import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Music } from "lucide-react"

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Verify group membership
    const { data: membership, error } = await supabase
        .from("memberships")
        .select("*, groups(name)")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single()

    if (error || !membership) {
        redirect("/")
    }

    const groupName = (membership.groups as any)?.name

    return (
        <SidebarProvider>
            <AppSidebar groupName={groupName} groupId={groupId} user={user} />
            <SidebarInset className="bg-[#050505]">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800/50 px-4">
                    <SidebarTrigger className="-ml-1 text-zinc-400" />
                    <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-800" />
                    <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-indigo-500" />
                        <span className="font-semibold text-zinc-200">{groupName}</span>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
