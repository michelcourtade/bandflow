"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, Music, Loader2, Check, Globe, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AddSongDialog({ groupId }: { groupId: string }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'search' | 'details'>('search')
    const [search, setSearch] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isAdding, setIsAdding] = useState<string | null>(null)

    // New song details
    const [newSong, setNewSong] = useState({
        title: "",
        artist: "",
        bpm: "",
        key: "",
        duration_minutes: "",
        duration_seconds: ""
    })

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search.length >= 2 && step === 'search') {
                performSearch()
            } else if (search.length < 2) {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [search, step])

    async function performSearch() {
        setIsSearching(true)
        const { data, error } = await supabase
            .from("songs")
            .select("*")
            .ilike("title", `%${search}%`)
            .limit(5)

        if (!error) setResults(data || [])
        setIsSearching(false)
    }

    async function addSongToGroup(songId: string) {
        setIsAdding(songId)
        const { error } = await supabase
            .from("group_songs")
            .insert({
                group_id: groupId,
                song_id: songId,
                status: 'proposal'
            })

        if (!error) {
            router.refresh()
            setOpen(false)
            resetForm()
        }
        setIsAdding(null)
    }

    async function createAndAddSong() {
        setIsAdding("new")

        const totalSeconds = (parseInt(newSong.duration_minutes || "0") * 60) + parseInt(newSong.duration_seconds || "0")

        // 1. Create global song
        const { data: song, error: songError } = await supabase
            .from("songs")
            .insert({
                title: newSong.title,
                artist: newSong.artist,
                duration_seconds: totalSeconds || null,
                default_bpm: newSong.bpm ? parseInt(newSong.bpm) : null,
                default_key: newSong.key,
                is_public: false
            })
            .select()
            .single()

        if (song && !songError) {
            // 2. Add to group
            const { error: groupError } = await supabase
                .from("group_songs")
                .insert({
                    group_id: groupId,
                    song_id: song.id,
                    status: 'to_learn'
                })

            if (!groupError) {
                router.refresh()
                setOpen(false)
                resetForm()
            }
        }
        setIsAdding(null)
    }

    function resetForm() {
        setStep('search')
        setSearch("")
        setResults([])
        setNewSong({
            title: "",
            artist: "",
            bpm: "",
            key: "",
            duration_minutes: "",
            duration_seconds: ""
        })
    }

    return (
        <Dialog open={open} onOpenChange={(val: boolean) => {
            setOpen(val)
            if (!val) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6 py-6 h-auto transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="h-5 w-5 mr-2" /> Add New Song
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden backdrop-blur-xl">
                {step === 'search' ? (
                    <>
                        <DialogHeader className="p-8 pb-0">
                            <DialogTitle className="text-3xl font-bold tracking-tight">Add to Repertoire</DialogTitle>
                            <DialogDescription className="text-zinc-500 text-base">
                                Search our global library or create a custom entry for your band.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="Search song title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-12 bg-zinc-900/50 border-zinc-800 focus:ring-indigo-500 h-14 text-lg rounded-2xl transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
                                        <p className="text-sm font-medium italic">Scanning library...</p>
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1 mb-3">Global Library Matches</p>
                                        {results.map((song) => (
                                            <div
                                                key={song.id}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-zinc-950 h-12 w-12 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-indigo-500/20">
                                                        <Music className="h-5 w-5 text-zinc-500 group-hover:text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-bold text-zinc-100">{song.title}</div>
                                                        <div className="text-xs text-zinc-500">{song.artist || "Unknown Artist"}</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-xl h-10 w-10"
                                                    onClick={() => addSongToGroup(song.id)}
                                                    disabled={isAdding === song.id}
                                                >
                                                    {isAdding === song.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : search.length >= 2 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-zinc-900/80 p-6 rounded-3xl mb-4 border border-zinc-800">
                                            <Globe className="h-8 w-8 text-zinc-700" />
                                        </div>
                                        <p className="text-zinc-400 font-medium mb-6">No exact matches found.</p>
                                        <Button
                                            onClick={() => {
                                                setNewSong({ ...newSong, title: search })
                                                setStep('details')
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-indigo-500/10"
                                        >
                                            Create "{search}" Manually
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
                                        <div className="relative mb-4">
                                            <Music className="h-16 w-16 opacity-[0.03]" />
                                            <Search className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium tracking-wide">Enter a title to search our catalog</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="p-8 pb-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-zinc-500 hover:text-white"
                                    onClick={() => setStep('search')}
                                >
                                    Back to search
                                </Button>
                                <ChevronRight className="h-3 w-3 text-zinc-700" />
                                <span className="text-zinc-300">New Song</span>
                            </div>
                            <DialogTitle className="text-3xl font-bold tracking-tight">Song Details</DialogTitle>
                        </DialogHeader>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Title</Label>
                                    <Input
                                        value={newSong.title}
                                        onChange={e => setNewSong({ ...newSong, title: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                        placeholder="e.g. Bohemian Rhapsody"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Artist</Label>
                                    <Input
                                        value={newSong.artist}
                                        onChange={e => setNewSong({ ...newSong, artist: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                        placeholder="e.g. Queen"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Default BPM</Label>
                                        <Input
                                            type="number"
                                            value={newSong.bpm}
                                            onChange={e => setNewSong({ ...newSong, bpm: e.target.value })}
                                            className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                            placeholder="120"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Key</Label>
                                        <Input
                                            value={newSong.key}
                                            onChange={e => setNewSong({ ...newSong, key: e.target.value })}
                                            className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                            placeholder="Am"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Duration</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <Input
                                                type="number"
                                                value={newSong.duration_minutes}
                                                onChange={e => setNewSong({ ...newSong, duration_minutes: e.target.value })}
                                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 pr-10"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase">min</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <Input
                                                type="number"
                                                value={newSong.duration_seconds}
                                                onChange={e => setNewSong({ ...newSong, duration_seconds: e.target.value })}
                                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 pr-10"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase">sec</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={createAndAddSong}
                                disabled={!newSong.title || isAdding === "new"}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 mt-4 overflow-hidden"
                            >
                                {isAdding === "new" ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>Add to Repertoire</>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
