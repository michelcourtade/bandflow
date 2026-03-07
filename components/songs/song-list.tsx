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
import { Music, MoreVertical, Play, Clock, Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditSongDialog } from "./edit-song-dialog"
import { useRouter } from "next/navigation"
import { cn, formatDuration } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<SongStatus | "all">("all")
    const router = useRouter()

    const handleRowClick = (song: GroupSong) => {
        router.push(`/${groupId}/songs/${song.id}`)
    }

    const handleEditClick = (e: React.MouseEvent, song: GroupSong) => {
        e.stopPropagation()
        setSelectedSong(song)
        setIsEditDialogOpen(true)
    }

    const filteredSongs = songs.filter(song => {
        const matchesSearch =
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (song.artist?.toLowerCase() || "").includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || song.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            {/* SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search by title, artist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 h-11 rounded-xl"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-900/30 text-zinc-400 rounded-full hover:text-white h-9 px-4">
                                <Filter className="h-4 w-4 mr-2" />
                                {statusFilter === "all" ? "All Status" : statusConfig[statusFilter as SongStatus].label}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-300 w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <DropdownMenuRadioItem key={key} value={key}>
                                        {config.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchQuery || statusFilter !== "all") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 text-xs hover:text-white h-9 rounded-full"
                            onClick={() => {
                                setSearchQuery("")
                                setStatusFilter("all")
                            }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* MOBILE VIEW: CARDS */}
                <div className="grid grid-cols-1 gap-3 lg:hidden">
                    {filteredSongs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-6 bg-zinc-900/10 rounded-3xl py-24 border-2 border-dashed border-zinc-800/50">
                            <div className="bg-zinc-800/50 p-6 rounded-full">
                                <Search className="h-12 w-12 text-zinc-600" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-zinc-300 font-bold">No matches found</p>
                                <p className="text-xs text-zinc-500">Try adjusting your search or filters</p>
                            </div>
                        </div>
                    ) : (
                        filteredSongs.map((song) => (
                            <div
                                key={song.id}
                                onClick={() => handleRowClick(song)}
                                className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-4 active:scale-[0.98] transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-900 h-10 w-10 rounded-xl flex items-center justify-center border border-zinc-800">
                                            <Play className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <div className="text-zinc-100 font-bold line-clamp-1">{song.title}</div>
                                            <div className="text-zinc-500 text-xs line-clamp-1">{song.artist || "Unknown Artist"}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-500"
                                        onClick={(e) => handleEditClick(e, song)}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/30">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`${statusConfig[song.status].color} border px-2 py-0 rounded-full text-[9px] font-bold tracking-tight uppercase`}>
                                            {statusConfig[song.status].label}
                                        </Badge>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {song.key_override || song.songs?.default_key || "—"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 opacity-30" />
                                            {formatDuration(song.duration_seconds || song.songs?.duration_seconds)}
                                        </span>
                                        <span>
                                            {song.bpm_override || song.songs?.default_bpm || "—"} BPM
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden lg:block rounded-xl border border-zinc-800/50 bg-[#0a0a0a]/50 overflow-hidden backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-zinc-900/30">
                            <TableRow className="hover:bg-transparent border-zinc-800/50">
                                <TableHead className="w-[400px] text-zinc-400 font-medium font-bold uppercase text-[10px] tracking-widest px-6">Song</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-center font-bold uppercase text-[10px] tracking-widest">Time</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-center font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-center font-bold uppercase text-[10px] tracking-widest">Key</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-center font-bold uppercase text-[10px] tracking-widest">BPM</TableHead>
                                <TableHead className="text-right text-zinc-400 font-medium px-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSongs.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-[400px] text-center p-0">
                                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-6 bg-zinc-900/10 rounded-2xl m-4 border-2 border-dashed border-zinc-800/50">
                                            <div className="bg-zinc-800/50 p-6 rounded-full">
                                                <Search className="h-12 w-12 text-zinc-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-bold text-zinc-300">No songs found</p>
                                                <p className="text-zinc-500 max-w-xs mx-auto text-sm">Adjust your search or filters to see more results.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSongs.map((song) => (
                                    <TableRow
                                        key={song.id}
                                        className="border-zinc-800/30 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => handleRowClick(song)}
                                    >
                                        <TableCell className="font-medium px-6 py-4">
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
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full h-8 w-8 border-zinc-800 bg-zinc-900 hover:border-zinc-600"
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
                </div>

                <EditSongDialog
                    song={selectedSong}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            </div>
        </div>
    )
}
