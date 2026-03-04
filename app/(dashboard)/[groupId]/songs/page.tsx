export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { SongList, GroupSong } from "@/components/songs/song-list"
import { AddSongDialog } from "@/components/songs/add-song-dialog"
import { Button } from "@/components/ui/button"
import { Music, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function RepertoirePage({
    params,
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    // Fetch group songs joined with global song library
    const { data: songs } = await supabase
        .from("group_songs")
        .select(`
      id,
      status,
      bpm_override,
      duration_seconds,
      key_override,
      note,
      spotify_url,
      deezer_url,
      videos,
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

    const typedSongs: GroupSong[] = (songs || []).map((s: any) => ({
        id: s.id,
        title: s.songs.title,
        artist: s.songs.artist,
        status: s.status,
        bpm_override: s.bpm_override,
        duration_seconds: s.duration_seconds,
        key_override: s.key_override,
        note: s.note,
        spotify_url: s.spotify_url,
        deezer_url: s.deezer_url,
        videos: s.videos,
        songs: {
            duration_seconds: s.songs.duration_seconds,
            default_bpm: s.songs.default_bpm,
            default_key: s.songs.default_key
        }
    }))

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Repertoire</h1>
                    <p className="text-zinc-500">Manage and organize all the songs your band performs.</p>
                </div>
                <AddSongDialog groupId={groupId} />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search by title, artist..."
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-900/30 text-zinc-400 rounded-full hover:text-white">
                        <Filter className="h-4 w-4 mr-2" /> All Status
                    </Button>
                    <Button variant="ghost" size="sm" className="text-zinc-500 text-xs hover:text-white">Clear Filters</Button>
                </div>
            </div>

            <SongList songs={typedSongs} groupId={groupId} />
        </div>
    )
}
