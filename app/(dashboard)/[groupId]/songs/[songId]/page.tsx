export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { DocumentUploader } from "@/components/songs/document-uploader"
import { DocumentList } from "@/components/songs/document-list"
import { EditSongDialog } from "@/components/songs/edit-song-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Clock,
    Hash,
    Music,
    Type,
    ChevronRight,
    Youtube,
    Headphones,
    ExternalLink,
    Play
} from "lucide-react"
import Link from "next/link"
import { SongActions } from "@/components/songs/song-actions"
import { GroupSong } from "@/components/songs/song-list"
import { cn, formatDuration } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string }> = {
    proposal: { label: "Proposal", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    to_learn: { label: "To Learn", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    rehearsing: { label: "Rehearsing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    ready_live: { label: "Ready Live", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
}


export default async function SongDetailPage({
    params,
}: {
    params: Promise<{ groupId: string; songId: string }>
}) {
    const { groupId, songId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Privilege check
    const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("group_id", groupId)
        .single()

    if (!membership) redirect("/")
    const isAdmin = membership.role === 'admin'

    // Fetch Song Data
    const { data: song, error: songError } = await supabase
        .from("group_songs")
        .select(`
            id,
            song_id,
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
        .eq("id", songId)
        .eq("group_id", groupId)
        .single()

    if (songError || !song) {
        notFound()
    }

    const globalSong: any = Array.isArray(song.songs) ? song.songs[0] : song.songs

    // Fetch Documents
    const { data: documents } = await supabase
        .from("group_song_documents")
        .select("*")
        .eq("song_id", song.song_id)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })

    function getYoutubeId(url: string) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    function getVideoSource(url: string): 'youtube' | 'google-photos' | 'direct' | 'other' {
        if (getYoutubeId(url)) return 'youtube'
        if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) return 'google-photos'
        if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return 'direct'
        return 'other'
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <Link href={`/${groupId}/songs`} className="hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Repertoire
                </Link>
                <ChevronRight className="h-4 w-4 opacity-50" />
                <span className="text-zinc-300 truncate">{globalSong.title}</span>
            </div>

            {/* Header / Hero */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
                <div className="flex items-start gap-6">
                    <div className="bg-indigo-600/10 p-5 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-600/5">
                        <Music className="h-12 w-12 text-indigo-400" />
                    </div>
                    <div className="space-y-2 mt-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-1">
                            {globalSong.title}
                        </h1>
                        <p className="text-zinc-400 text-xl font-medium">{globalSong.artist || "Unknown Artist"}</p>

                        <div className="flex items-center gap-3 pt-2">
                            <Badge variant="outline" className={`${statusConfig[song.status].color} border px-3 py-1 rounded-full text-xs font-bold tracking-tight uppercase`}>
                                {statusConfig[song.status].label}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <SongActions
                        song={{
                            id: song.id,
                            title: globalSong.title,
                            artist: globalSong.artist,
                            status: song.status as any,
                            bpm_override: song.bpm_override,
                            duration_seconds: song.duration_seconds,
                            key_override: song.key_override,
                            note: song.note,
                            spotify_url: song.spotify_url,
                            deezer_url: song.deezer_url,
                            videos: song.videos as any,
                            songs: {
                                duration_seconds: globalSong.duration_seconds,
                                default_bpm: globalSong.default_bpm,
                                default_key: globalSong.default_key
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Left Column: Arrangement Info */}
                <div className="space-y-8">
                    <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden group">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Arrangement</h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <span className="text-zinc-500 text-xs font-bold flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> TIME</span>
                                <p className="text-white font-mono text-xl">{formatDuration(song.duration_seconds || globalSong.duration_seconds)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 text-xs font-bold flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> BPM</span>
                                <p className="text-white font-mono text-xl">{song.bpm_override || globalSong.default_bpm || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 text-xs font-bold flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> KEY</span>
                                <p className="text-white font-mono text-xl">{song.key_override || globalSong.default_key || "—"}</p>
                            </div>
                        </div>

                        {song.note && (
                            <div className="pt-4 border-t border-zinc-800/50 space-y-2">
                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest pl-1">Notes</span>
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                    {song.note}
                                </div>
                            </div>
                        )}

                        {/* Audio Streaming Links */}
                        {(song.spotify_url || song.deezer_url) && (
                            <div className="pt-4 border-t border-zinc-800/50 space-y-3">
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">Streaming</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {song.spotify_url && (
                                        <Button asChild variant="outline" className="w-full justify-start gap-3 border-emerald-500/30 text-emerald-400 rounded-xl transition-all">
                                            <a href={song.spotify_url} target="_blank" rel="noopener noreferrer">
                                                <Music className="h-4 w-4" />
                                                <span className="text-xs font-bold">Spotify</span>
                                                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                            </a>
                                        </Button>
                                    )}
                                    {song.deezer_url && (
                                        <Button asChild variant="outline" className="w-full justify-start gap-3 border-violet-500/30 text-violet-400 rounded-xl transition-all">
                                            <a href={song.deezer_url} target="_blank" rel="noopener noreferrer">
                                                <Headphones className="h-4 w-4" />
                                                <span className="text-xs font-bold">Deezer</span>
                                                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-[10px] text-zinc-600 italic">
                            (Edit details from Repertoire list menu)
                        </p>
                    </div>
                </div>

                {/* Right Column: Digital Binder */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            Digital Binder
                            <span className="hidden sm:inline-block text-zinc-700">/</span>
                            <span className="text-zinc-600 font-medium normal-case tracking-normal">Tabs, Lyrics & Audio Demos</span>
                        </h3>
                    </div>

                    <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-6 shadow-xl space-y-8">
                        {/* Uploader */}
                        <DocumentUploader groupId={groupId} songId={song.song_id} userId={user.id} />

                        {/* List */}
                        <div className="pt-2">
                            <DocumentList
                                documents={documents || []}
                                groupId={groupId}
                                currentUserId={user.id}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Video Resources */}
            {(song.videos && (song.videos as any[]).length > 0) && (
                <div className="pt-8 border-t border-zinc-900 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500/10 p-2 rounded-xl">
                            <Play className="h-5 w-5 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">External Video Resources</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(song.videos as any[]).map((video, idx) => {
                            const source = getVideoSource(video.url)
                            const ytId = getYoutubeId(video.url)

                            return (
                                <div key={idx} className="bg-[#0a0a0a] border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col group border-t-zinc-700/30">
                                    {source === 'youtube' && ytId ? (
                                        <div className="aspect-video w-full bg-zinc-900 relative">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${ytId}`}
                                                className="absolute inset-0 w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : source === 'direct' ? (
                                        <div className="aspect-video w-full bg-zinc-900 relative">
                                            <video
                                                controls
                                                className="absolute inset-0 w-full h-full"
                                                src={video.url}
                                            />
                                        </div>
                                    ) : source === 'google-photos' ? (
                                        <div className="aspect-video w-full bg-zinc-900/50 flex flex-col items-center justify-center p-6 text-center gap-4 relative overflow-hidden group/gp">
                                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/gp:opacity-100 transition-opacity" />
                                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-xl z-10 group-hover/gp:scale-110 transition-transform duration-500">
                                                <div className="grid grid-cols-2 gap-0.5 w-8 h-8 opacity-80">
                                                    <div className="bg-red-500 rounded-sm" />
                                                    <div className="bg-blue-500 rounded-sm" />
                                                    <div className="bg-green-500 rounded-sm" />
                                                    <div className="bg-yellow-500 rounded-sm" />
                                                </div>
                                            </div>
                                            <div className="z-10 space-y-1">
                                                <p className="text-xs font-bold text-zinc-300">Google Photos Video</p>
                                                <p className="text-[10px] text-zinc-500">Direct embedding restricted</p>
                                            </div>
                                            <Button asChild size="sm" variant="outline" className="z-10 h-8 rounded-lg bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                                                <a href={video.url} target="_blank" rel="noopener noreferrer">
                                                    Open Link <ExternalLink className="h-3 w-3 ml-2" />
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="aspect-video w-full bg-zinc-900 flex items-center justify-center p-6 text-center">
                                            <div className="space-y-3">
                                                <div className="bg-zinc-950 h-12 w-12 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto">
                                                    <ExternalLink className="h-5 w-5 text-zinc-600" />
                                                </div>
                                                <p className="text-zinc-500 text-[10px] italic font-mono truncate max-w-[200px]">{video.url}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-zinc-950/50 flex items-center justify-between gap-2 border-t border-zinc-800/30">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "p-2 rounded-xl transition-colors",
                                                source === 'youtube' ? "bg-red-500/10" :
                                                    source === 'google-photos' ? "bg-indigo-500/10" : "bg-white/5"
                                            )}>
                                                <Play className={cn(
                                                    "h-3 w-3 transition-all",
                                                    source === 'youtube' ? "text-red-500 fill-red-500" :
                                                        source === 'google-photos' ? "text-indigo-400 fill-indigo-400" : "text-zinc-400 fill-zinc-400"
                                                )} />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-300 truncate">{video.title || "Video Reference"}</span>
                                        </div>
                                        {(source === 'youtube' || source === 'direct' || source === 'other') && (
                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-white text-zinc-500"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
