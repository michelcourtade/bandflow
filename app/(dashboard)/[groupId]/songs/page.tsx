export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { SongList, GroupSong } from "@/components/songs/song-list"
import { AddSongDialog } from "@/components/songs/add-song-dialog"
import { Music } from "lucide-react"

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

            <SongList songs={typedSongs} groupId={groupId} />
        </div>
    )
}
