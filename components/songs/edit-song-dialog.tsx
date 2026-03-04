"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Music,
    Loader2,
    Save,
    Trash2,
    Plus,
    Mic2,
    Hash,
    Type,
    CircleDot,
    Clock,
    Youtube
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GroupSong, SongStatus } from "./song-list"
import { cn } from "@/lib/utils"

interface EditSongDialogProps {
    song: GroupSong | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const statusOptions: { value: SongStatus; label: string; color: string }[] = [
    { value: 'proposal', label: "Proposal", color: "text-zinc-400" },
    { value: 'to_learn', label: "To Learn", color: "text-orange-400" },
    { value: 'rehearsing', label: "Rehearsing", color: "text-blue-400" },
    { value: 'ready_live', label: "Ready Live", color: "text-emerald-400" }
]

export function EditSongDialog({ song, isOpen, onOpenChange }: EditSongDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState({
        status: 'proposal' as SongStatus,
        bpm_override: "",
        duration_minutes: "",
        duration_seconds: "",
        key_override: "",
        note: "",
        spotify_url: "",
        deezer_url: "",
        videos: [] as { title: string, url: string }[]
    })

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (song) {
            setFormData({
                status: song.status,
                bpm_override: song.bpm_override?.toString() || "",
                duration_minutes: song.duration_seconds ? Math.floor(song.duration_seconds / 60).toString() : "",
                duration_seconds: song.duration_seconds ? (song.duration_seconds % 60).toString() : "",
                key_override: song.key_override || "",
                note: song.note || "",
                spotify_url: (song as any).spotify_url || "",
                deezer_url: (song as any).deezer_url || "",
                videos: (song as any).videos || []
            })
        }
    }, [song])

    async function handleSave() {
        if (!song) return
        setIsLoading(true)

        const totalSeconds = (parseInt(formData.duration_minutes || "0") * 60) + parseInt(formData.duration_seconds || "0")

        const { error } = await supabase
            .from("group_songs")
            .update({
                status: formData.status,
                bpm_override: formData.bpm_override ? parseInt(formData.bpm_override) : null,
                duration_seconds: totalSeconds || null,
                key_override: formData.key_override || null,
                note: formData.note || null,
                spotify_url: formData.spotify_url || null,
                deezer_url: formData.deezer_url || null,
                videos: formData.videos || []
            })
            .eq("id", song.id)

        if (!error) {
            router.refresh()
            onOpenChange(false)
        }
        setIsLoading(false)
    }

    async function handleDelete() {
        if (!song || !confirm("Are you sure you want to remove this song from your repertoire?")) return
        setIsDeleting(true)

        const { error } = await supabase
            .from("group_songs")
            .delete()
            .eq("id", song.id)

        if (!error) {
            router.refresh()
            onOpenChange(false)
        }
        setIsDeleting(false)
    }

    if (!song) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden backdrop-blur-xl">
                <div className="bg-indigo-600/10 p-8 border-b border-zinc-800/50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-zinc-900 h-16 w-16 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl">
                                <Music className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{song.title}</h2>
                                <p className="text-zinc-400 font-medium">{song.artist || "Unknown Artist"}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Status Selection */}
                    <div className="space-y-3">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <CircleDot className="h-3 w-3" /> Status
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {statusOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFormData({ ...formData, status: opt.value })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                                        formData.status === opt.value
                                            ? "bg-zinc-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5"
                                            : "bg-transparent border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                                    )}
                                >
                                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", opt.color)}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Duration
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 pr-8"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 font-bold uppercase">m</span>
                                </div>
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        value={formData.duration_seconds}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration_seconds: e.target.value })}
                                        className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 pr-8"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 font-bold uppercase">s</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Hash className="h-3 w-3" /> BPM
                            </Label>
                            <Input
                                type="number"
                                value={formData.bpm_override}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bpm_override: e.target.value })}
                                className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 transition-all"
                                placeholder={song.songs.default_bpm?.toString() || "BPM"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Type className="h-3 w-3" /> Key
                            </Label>
                            <Input
                                value={formData.key_override}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, key_override: e.target.value })}
                                className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 transition-all"
                                placeholder={song.songs.default_key || "Key"}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">External Links</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="spotify" className="text-zinc-400 text-xs">Spotify URL</Label>
                                <Input
                                    id="spotify"
                                    value={formData.spotify_url}
                                    onChange={(e) => setFormData({ ...formData, spotify_url: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500 h-12 rounded-xl"
                                    placeholder="https://open.spotify.com/track/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deezer" className="text-zinc-400 text-xs">Deezer URL</Label>
                                <Input
                                    id="deezer"
                                    value={formData.deezer_url}
                                    onChange={(e) => setFormData({ ...formData, deezer_url: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 focus:ring-violet-500 h-12 rounded-xl"
                                    placeholder="https://www.deezer.com/track/..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                            <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">Video Resources / Tutorials / Photos</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({ ...formData, videos: [...formData.videos, { title: "", url: "" }] })}
                                className="h-7 text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add Reference
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {formData.videos.map((video, idx) => (
                                <div key={idx} className="bg-zinc-900 shadow-xl rounded-2xl p-4 space-y-3 relative group/video border border-zinc-800/50">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newVideos = [...formData.videos]
                                            newVideos.splice(idx, 1)
                                            setFormData({ ...formData, videos: newVideos })
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/video:opacity-100 transition-opacity shadow-lg z-10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 font-bold ml-1 uppercase">Title</Label>
                                            <Input
                                                value={video.title}
                                                onChange={(e) => {
                                                    const newVideos = [...formData.videos]
                                                    newVideos[idx].title = e.target.value
                                                    setFormData({ ...formData, videos: newVideos })
                                                }}
                                                className="bg-zinc-950 border-zinc-800 h-10 rounded-xl"
                                                placeholder="e.g. Bass playthrough"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 font-bold ml-1 uppercase">Video URL</Label>
                                            <Input
                                                value={video.url}
                                                onChange={(e) => {
                                                    const newVideos = [...formData.videos]
                                                    newVideos[idx].url = e.target.value
                                                    setFormData({ ...formData, videos: newVideos })
                                                }}
                                                className="bg-zinc-950 border-zinc-800 h-10 rounded-xl"
                                                placeholder="YouTube, Google Photos, or Direct .mp4 link"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {formData.videos.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-zinc-900/50 rounded-2xl">
                                    <p className="text-zinc-600 text-[10px] italic">No video references added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-zinc-800">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Mic2 className="h-3 w-3" /> Internal Notes
                        </Label>
                        <Textarea
                            value={formData.note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                            className="bg-zinc-900/50 border-zinc-800 rounded-xl min-h-[100px] focus:ring-indigo-500 transition-all resize-none"
                            placeholder="Add rehearsal notes..."
                        />
                    </div>
                </div>

                <div className="p-8 pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-5 w-5" />
                                Save Changes
                            </div>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
