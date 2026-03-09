export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { StageView } from "@/components/setlists/stage-view"

export default async function StageModePage({
    params,
}: {
    params: Promise<{ groupId: string; setlistId: string }>
}) {
    const { groupId, setlistId } = await params
    const supabase = await createClient()

    // Auth & Membership check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single()

    if (!membership) redirect("/")

    // 1. Fetch setlist
    const { data: setlist } = await supabase
        .from("setlists")
        .select("*, concerts(name, venue)")
        .eq("id", setlistId)
        .single()

    if (!setlist) notFound()

    // 2. Fetch items with full details
    const { data: items } = await supabase
        .from("setlist_items")
        .select(`
            id,
            position,
            group_songs (
                id,
                status,
                bpm_override,
                duration_seconds,
                key_override,
                lyrics,
                note,
                songs (
                    title,
                    artist,
                    duration_seconds,
                    default_bpm,
                    default_key
                )
            )
        `)
        .eq("setlist_id", setlistId)
        .order("position", { ascending: true })

    if (!items || items.length === 0) {
        redirect(`/${groupId}/setlists/${setlistId}`)
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden">
            <StageView 
                setlist={setlist} 
                items={items} 
                groupId={groupId}
            />
        </div>
    )
}
