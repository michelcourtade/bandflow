"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Music, MoreVertical, Play, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditSongDialog } from "./edit-song-dialog"
import { useRouter } from "next/navigation"
import { cn, formatDuration } from "@/lib/utils"

export type SongStatus = 'proposal' | 'to_learn' | 'rehearsing' | 'ready_live'

export interface GroupSong {
    id: string
    title: string
    artist: string | null
    status: SongStatus
    bpm_override: number | null
    duration_seconds: number | null
    key_override: string | null
    note: string | null
    spotify_url: string | null
    deezer_url: string | null
    videos: { title: string; url: string }[] | null
    songs: {
        duration_seconds: number | null
        default_bpm: number | null
        default_key: string | null
    }
}

const statusConfig: Record<SongStatus, { label: string; color: string }> = {
    proposal: { label: "Proposal", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    to_learn: { label: "To Learn", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    rehearsing: { label: "Rehearsing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    ready_live: { label: "Ready Live", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
}


export function SongList({ songs, groupId }: { songs: GroupSong[], groupId: string }) {
    const [selectedSong, setSelectedSong] = useState<GroupSong | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const router = useRouter()

    const handleRowClick = (song: GroupSong) => {
        router.push(`/${groupId}/songs/${song.id}`)
    }

    const handleEditClick = (e: React.MouseEvent, song: GroupSong) => {
        e.stopPropagation()
        setSelectedSong(song)
        setIsEditDialogOpen(true)
    }

    return (
        <div className="rounded-xl border border-zinc-800/50 bg-[#0a0a0a]/50 overflow-hidden backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-zinc-900/30">
                    <TableRow className="hover:bg-transparent border-zinc-800/50">
                        <TableHead className="w-[400px] text-zinc-400 font-medium">Song</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-center">Time</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-center">Status</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-center">Key</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-center">BPM</TableHead>
                        <TableHead className="text-right text-zinc-400 font-medium"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {songs.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={5} className="h-[400px] text-center p-0">
                                <div className="flex flex-col items-center justify-center text-zinc-500 gap-6 bg-zinc-900/10 rounded-2xl m-4 border-2 border-dashed border-zinc-800/50">
                                    <div className="bg-zinc-800/50 p-6 rounded-full">
                                        <Music className="h-12 w-12 text-zinc-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-bold text-zinc-300">Your repertoire is empty</p>
                                        <p className="text-zinc-500 max-w-xs mx-auto text-sm">Add songs from the global library or create your own custom entries to start building setlists.</p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        songs.map((song) => (
                            <TableRow
                                key={song.id}
                                className="border-zinc-800/30 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                onClick={() => handleRowClick(song)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-900 h-10 w-10 rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-indigo-500/50 transition-colors">
                                            <Play className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="text-zinc-200 font-semibold">{song.title}</div>
                                            <div className="text-zinc-500 text-xs">{song.artist || "Unknown Artist"}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-mono text-xs text-zinc-500">
                                    {formatDuration(song.duration_seconds || song.songs?.duration_seconds)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`${statusConfig[song.status].color} border px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase`}>
                                        {statusConfig[song.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono text-xs text-zinc-400">
                                    {song.key_override || song.songs?.default_key || "—"}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-mono text-xs">
                                        <Clock className="h-3 w-3 opacity-50" />
                                        {song.bpm_override || song.songs?.default_bpm || "—"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full h-8 w-8"
                                        onClick={(e) => handleEditClick(e, song)}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <EditSongDialog
                song={selectedSong}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </div>
    )
}
