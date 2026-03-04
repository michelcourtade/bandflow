"use client"

import { useState, useTransition, useCallback } from "react"
import {
    Music,
    Plus,
    GripVertical,
    Trash2,
    Clock,
    Search,
    CheckCircle2,
    Circle,
    Music2,
    ExternalLink
} from "lucide-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

function formatDuration(seconds: number | null) {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface SortableItemProps {
    id: string
    item: any
    index: number
    groupId: string
    onRemove: (id: string) => void
}

function SortableItem({ id, item, index, groupId, onRemove }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl group transition-all shadow-lg",
                isDragging ? "opacity-50 border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02] shadow-2xl" : "hover:border-zinc-700"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="text-zinc-600 font-mono text-xs font-bold w-4">
                {index + 1}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white mb-0.5 truncate">{item.group_songs.songs.title}</div>
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">{item.group_songs.songs.artist}</span>
                    <Badge variant="outline" className="h-4 text-[8px] bg-zinc-950 border-zinc-800 text-zinc-400 px-1 py-0 uppercase shrink-0">
                        {item.group_songs.key_override || item.group_songs.songs.default_key || "—"}
                    </Badge>
                    <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="h-2.5 w-2.5 opacity-30" />
                        {formatDuration(item.group_songs.duration_seconds || item.group_songs.songs.duration_seconds)}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                        {item.group_songs.bpm_override || item.group_songs.songs.default_bpm || "?"} BPM
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg"
                    onClick={() => window.open(`/${groupId}/songs/${item.group_songs.id}`, '_blank')}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                    onClick={() => onRemove(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export function SetlistBuilder({
    groupId,
    setlistId,
    initialItems,
    repertoire
}: {
    groupId: string,
    setlistId: string,
    initialItems: any[],
    repertoire: any[]
}) {
    const [items, setItems] = useState(initialItems)
    const [search, setSearch] = useState("")
    const supabase = createClient()
    const router = useRouter()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const filteredRepertoire = repertoire.filter(rs =>
        rs.songs.title.toLowerCase().includes(search.toLowerCase()) ||
        rs.songs.artist?.toLowerCase().includes(search.toLowerCase())
    )

    const updateDBPositions = async (newItems: any[]) => {
        // Prepare bulk update
        const updates = newItems.map((item, index) => ({
            id: item.id,
            position: index,
            setlist_id: setlistId,
            group_song_id: item.group_song_id
        }))

        const { error } = await supabase
            .from("setlist_items")
            .upsert(updates)

        if (error) {
            console.error("Failed to update positions:", error)
        } else {
            router.refresh()
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // Update DB after local state change
                updateDBPositions(newItems)

                return newItems
            })
        }
    }

    async function addSong(groupSongId: string) {
        if (items.some(i => i.group_song_id === groupSongId)) return

        const { data: newItem, error } = await supabase
            .from("setlist_items")
            .insert({
                setlist_id: setlistId,
                group_song_id: groupSongId,
                position: items.length
            })
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
            .single()

        if (!error && newItem) {
            setItems([...items, newItem])
            router.refresh()
        }
    }

    async function removeSong(itemId: string) {
        const { error } = await supabase
            .from("setlist_items")
            .delete()
            .eq("id", itemId)

        if (!error) {
            const remainingItems = items.filter(i => i.id !== itemId)
            const reorderedItems = remainingItems.map((item, idx) => ({ ...item, position: idx }))
            setItems(reorderedItems)
            updateDBPositions(reorderedItems)
        }
    }

    const totalSeconds = items.reduce((acc, curr) =>
        acc + (curr.group_songs.duration_seconds || curr.group_songs.songs.duration_seconds || 0), 0
    )

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px] lg:h-[calc(100vh-12rem)]">
            {/* LEFT: REPERTOIRE */}
            <div className="flex flex-col gap-4 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 p-6 backdrop-blur-sm overflow-hidden h-[500px] lg:h-full">
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Music2 className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-xl font-bold text-white">Your Repertoire</h2>
                    </div>
                    <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700 text-zinc-400">
                        {repertoire.length} songs
                    </Badge>
                </div>

                <div className="relative group shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search songs to add..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500 h-11"
                    />
                </div>

                <ScrollArea className="flex-1 -mr-2 pr-2">
                    <div className="space-y-2 pb-4">
                        {filteredRepertoire.map((song) => {
                            const alreadyIn = items.some(i => i.group_song_id === song.id)
                            return (
                                <div
                                    key={song.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-2xl border transition-all group",
                                        alreadyIn
                                            ? "bg-indigo-500/5 border-indigo-500/20 opacity-60 pointer-events-none"
                                            : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                                            alreadyIn ? "bg-indigo-500/10 border-indigo-500/30" : "bg-zinc-950 border-zinc-800 group-hover:border-zinc-600"
                                        )}>
                                            {alreadyIn ? (
                                                <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                                            ) : (
                                                <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-zinc-200 truncate">{song.songs.title}</div>
                                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 truncate">
                                                {song.songs.artist || "Unknown Artist"}
                                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                                {formatDuration(song.duration_seconds || song.songs.duration_seconds)}
                                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                                {song.bpm_override || song.songs.default_bpm || "?"} BPM
                                            </div>
                                        </div>
                                    </div>
                                    {!alreadyIn && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-lg h-9 w-9 p-0 shrink-0"
                                            onClick={() => addSong(song.id)}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT: SETLIST SEQUENCE (DnD) */}
            <div className="flex flex-col gap-4 bg-[#0a0a0a] rounded-3xl border border-zinc-800/50 p-6 shadow-2xl overflow-hidden relative h-[500px] lg:h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[80px] -z-10 rounded-full" />

                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-xl font-bold text-white">Live Sequence</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                        {items.length} positions
                    </div>
                </div>

                <ScrollArea className="flex-1 -mr-2 pr-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3 pb-4">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-zinc-600 text-center px-10">
                                        <div className="bg-zinc-900/50 p-5 rounded-full mb-4 border border-zinc-800">
                                            <GripVertical className="h-8 w-8 opacity-20" />
                                        </div>
                                        <p className="text-sm italic">Setlist is empty.<br />Add songs from repertoire to start building your show.</p>
                                    </div>
                                ) : (
                                    items.map((item, index) => (
                                        <SortableItem
                                            key={item.id}
                                            id={item.id}
                                            item={item}
                                            index={index}
                                            groupId={groupId}
                                            onRemove={removeSong}
                                        />
                                    ))
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ScrollArea>

                {items.length > 0 && (
                    <div className="pt-4 mt-auto border-t border-zinc-800/50 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-[0.2em]">Total BandFlow Show Time</span>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                <span className="text-white text-xl font-mono">
                                    {Math.floor(totalSeconds / 60)}:{Math.round(totalSeconds % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-600 italic text-right">
                            Excluding transitions between songs.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
