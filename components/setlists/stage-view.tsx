"use client"

import { useState, useEffect } from "react"
import { 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Music, 
    Clock, 
    Hash, 
    Type, 
    AlignLeft,
    Maximize2,
    Minimize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn, formatDuration } from "@/lib/utils"
import Link from "next/link"

interface StageViewProps {
    setlist: any
    items: any[]
    groupId: string
}

export function StageView({ setlist, items, groupId }: StageViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    const currentItem = items[currentIndex]
    const currentSong = currentItem.group_songs
    const nextItem = items[currentIndex + 1]
    
    const totalSongs = items.length
    const progress = ((currentIndex + 1) / totalSongs) * 100

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                if (currentIndex < totalSongs - 1) setCurrentIndex(prev => prev + 1)
            } else if (e.key === "ArrowLeft") {
                if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
            } else if (e.key === "Escape") {
                // Should exit stage mode
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentIndex, totalSongs])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full select-none">
            {/* STAGE HEADER */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link href={`/${groupId}/setlists/${setlist.id}`}>
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Setlist</span>
                        <span className="text-white font-bold truncate max-w-[200px] leading-none">{setlist.name}</span>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <span className="text-indigo-500 font-black text-xl">{currentIndex + 1}</span>
                        <span className="text-zinc-700 text-lg">/</span>
                        <span className="text-zinc-500 font-bold text-lg">{totalSongs}</span>
                     </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleFullscreen}
                        className="text-zinc-500 hover:text-white"
                    >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Current Time</span>
                        <CurrentTime />
                    </div>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-1 bg-zinc-900 overflow-hidden">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* MAIN CONTENT Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* SONG INFO & TITLE */}
                <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 justify-center min-w-0">
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                             <div className="h-1.5 w-12 bg-indigo-600 rounded-full" />
                             <span className="text-zinc-500 text-lg md:text-xl font-bold uppercase tracking-[0.2em]">{currentSong.songs.artist}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white leading-none tracking-tighter break-words">
                            {currentSong.songs.title}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-12 mt-4">
                        <div className="space-y-1">
                            <span className="text-zinc-500 text-sm md:text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-4 w-4 md:h-5 md:w-5" /> Duration
                            </span>
                            <p className="text-white text-3xl md:text-5xl font-mono font-bold">
                                {formatDuration(currentSong.duration_seconds || currentSong.songs.duration_seconds)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-zinc-500 text-sm md:text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                                <Hash className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" /> BPM
                            </span>
                            <p className="text-white text-3xl md:text-5xl font-mono font-bold">
                                {currentSong.bpm_override || currentSong.songs.default_bpm || "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-zinc-500 text-sm md:text-lg font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-500">
                                <Type className="h-4 w-4 md:h-5 md:w-5" /> Key
                            </span>
                            <p className="text-white text-3xl md:text-5xl font-mono font-bold">
                                {currentSong.key_override || currentSong.songs.default_key || "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* LYRICS / NOTES PANEL */}
                <div className="w-full lg:w-[450px] xl:w-[600px] border-t lg:border-t-0 lg:border-l border-zinc-900 bg-[#080808] flex flex-col p-8 md:p-12 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-zinc-500 text-sm md:text-base font-bold uppercase tracking-widest flex items-center gap-3">
                            <AlignLeft className="h-5 w-5" /> Master Lyrics
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                        {currentSong.lyrics ? (
                            <pre className="text-zinc-300 text-xl md:text-2xl font-medium leading-relaxed font-sans whitespace-pre-wrap">
                                {currentSong.lyrics}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic animate-pulse">
                                <AlignLeft className="h-16 w-16 mb-4 opacity-10" />
                                <p>No lyrics found for this arrangement.</p>
                            </div>
                        )}
                        
                        {currentSong.note && (
                            <div className="mt-12 pt-8 border-t border-zinc-900">
                                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Internal Notes</h4>
                                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 text-lg md:text-xl text-zinc-400 leading-relaxed italic">
                                    {currentSong.note}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* STAGE FOOTER / NAVIGATION */}
            <div className="h-24 md:h-32 border-t border-zinc-800 bg-zinc-950 flex items-center px-6 md:px-12 gap-8 shrink-0">
                <Button 
                    variant="outline" 
                    size="lg"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="h-16 md:h-20 px-6 md:px-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl hover:scale-[1.02] transition-all"
                >
                    <ChevronLeft className="h-8 w-8" />
                </Button>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                    {nextItem ? (
                        <>
                            <span className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">Coming Up Next</span>
                            <h4 className="text-xl md:text-3xl font-bold text-zinc-400 truncate tracking-tight">{nextItem.group_songs.songs.title}</h4>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 text-emerald-500 font-bold italic">
                            <CheckCircleIcon className="h-5 w-5" /> End of Setlist
                        </div>
                    )}
                </div>

                <Button 
                    variant="default" 
                    size="lg"
                    disabled={currentIndex === totalSongs - 1}
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="h-16 md:h-20 flex-1 md:flex-none md:w-80 bg-indigo-600 hover:bg-indigo-500 text-white text-xl md:text-2xl font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-between px-8"
                >
                    <span>NEXT SONG</span>
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </div>
        </div>
    )
}

function CurrentTime() {
    const [time, setTime] = useState(new Date())
    
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])
    
    return (
        <span className="text-xl font-mono font-bold text-white">
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
    )
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    )
}
