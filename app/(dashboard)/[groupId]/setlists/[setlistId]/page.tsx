export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { SetlistBuilder } from "@/components/setlists/setlist-builder"

export default async function SetlistBuilderPage({
    params,
}: {
    params: Promise<{ groupId: string; setlistId: string }>
}) {
    const { groupId, setlistId } = await params
    const supabase = await createClient()

    // 1. Fetch the setlist details
    const { data: setlist, error: setlistError } = await supabase
        .from("setlists")
        .select("*, concerts(name, date)")
        .eq("id", setlistId)
        .single()

    if (setlistError || !setlist) {
        redirect(`/${groupId}/setlists`)
    }

    // 2. Fetch the current items in the setlist
    const { data: items } = await supabase
        .from("setlist_items")
        .select(`
      id,
      position,
      group_song_id,
      group_songs (
        id,
        status,
        bpm_override,
        duration_seconds,
        key_override,
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

    // 3. Fetch the full repertoire of the group (to add songs)
    const { data: groupSongs } = await supabase
        .from("group_songs")
        .select(`
      id,
      status,
      bpm_override,
      duration_seconds,
      key_override,
      songs (
        title,
        artist,
        duration_seconds,
        default_bpm,
        default_key
      )
    `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-1">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        Builder: <span className="text-zinc-400 font-medium">{setlist.name}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Drag songs from repertoire to build your show sequence.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block mr-2">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Planned Duration</div>
                        <div className="text-xl font-mono text-indigo-400">
                            ~ {Math.floor((items || []).reduce((acc: number, curr: any) => acc + (curr.group_songs.duration_seconds || curr.group_songs.songs.duration_seconds || 0), 0) / 60)}:00
                        </div>
                    </div>
                    <Button 
                        asChild={items && items.length > 0} 
                        disabled={!items || items.length === 0}
                        className={cn(
                            "rounded-xl font-bold shadow-lg transition-all",
                            items && items.length > 0 
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10" 
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700"
                        )}
                    >
                        {items && items.length > 0 ? (
                            <Link href={`/stage/${groupId}/${setlistId}`}>
                                <Play className="h-4 w-4 mr-2 fill-current" /> Stage Mode
                            </Link>
                        ) : (
                            <span className="flex items-center">
                                <Play className="h-4 w-4 mr-2" /> Stage Mode
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            <SetlistBuilder
                groupId={groupId}
                setlistId={setlistId}
                initialItems={items || []}
                repertoire={groupSongs || []}
            />
        </div>
    )
}
