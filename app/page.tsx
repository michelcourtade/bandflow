export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Music, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { InvitationList } from "@/components/groups/invitation-list"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user groups
  const { data: memberships } = await supabase
    .from("memberships")
    .select("group_id, role, groups(name)")
    .eq("user_id", user.id)

  // Fetch pending invitations via email
  const { data: invitations } = await supabase
    .from("group_invitations")
    .select(`
      id,
      group_id,
      role,
      invited_by,
      groups(name)
    `)
    .eq("email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const groups = memberships?.map((m: any) => ({
    id: m.group_id,
    role: m.role,
    name: (m.groups as any)?.name
  })) || []

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Music className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight italic">
              BAND<span className="text-indigo-500">FLOW</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/account" className="text-zinc-400 hover:text-white text-sm transition-colors">Account</Link>
            <span className="text-zinc-400 text-sm hidden md:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Sign Out</Button>
            </form>
          </div>
        </header>

        {invitations && invitations.length > 0 && (
          <InvitationList invitations={invitations} userId={user.id} />
        )}

        <section className="grid gap-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Your Bands</h1>
            <CreateGroupDialog />
          </div>

          {groups.length === 0 ? (
            <Card className="bg-zinc-900/40 border-zinc-800 border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="bg-zinc-800/50 p-4 rounded-full mb-4">
                  <Users className="h-8 w-8 text-zinc-500" />
                </div>
                <CardTitle className="text-zinc-300 mb-2">No groups found</CardTitle>
                <CardDescription className="text-zinc-500 max-w-sm">
                  You haven't joined any bands yet. Create a group to start managing your repertoire and setlists.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any) => (
                <Card key={group.id} className="bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 transition-all group">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {group.name}
                      <span className="text-[10px] uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                        {group.role}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild className="w-full bg-zinc-800 hover:bg-indigo-600 group-hover:bg-indigo-600 transition-colors">
                      <Link href={`/${group.id}`}>Enter Workspace</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
