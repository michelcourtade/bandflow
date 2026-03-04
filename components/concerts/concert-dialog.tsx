"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Calendar as CalendarIcon,
    MapPin,
    Plus,
    Loader2,
    Sparkles,
    Settings2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ConcertDialogProps {
    groupId: string
    concert?: {
        id: string
        name: string
        date: string | null
        venue: string | null
    }
    trigger?: React.ReactNode
}

export function ConcertDialog({ groupId, concert, trigger }: ConcertDialogProps) {
    const isEditing = !!concert
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Parse date and time from concert.date string
    const initialDate = concert?.date ? new Date(concert.date).toISOString().split('T')[0] : ""
    const initialTime = concert?.date ? new Date(concert.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ""

    const [formData, setFormData] = useState({
        name: concert?.name || "",
        date: initialDate,
        time: initialTime,
        venue: concert?.venue || ""
    })

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        // Combine date and time
        let combinedDate = null
        if (formData.date) {
            const dateObj = new Date(formData.date)
            if (formData.time) {
                const [hours, minutes] = formData.time.split(':')
                dateObj.setHours(parseInt(hours), parseInt(minutes))
            }
            combinedDate = dateObj.toISOString()
        }

        if (isEditing && concert) {
            const { error } = await supabase
                .from("concerts")
                .update({
                    name: formData.name,
                    date: combinedDate,
                    venue: formData.venue
                })
                .eq("id", concert.id)

            if (!error) {
                router.refresh()
                setOpen(false)
            }
        } else {
            const { error } = await supabase
                .from("concerts")
                .insert({
                    group_id: groupId,
                    name: formData.name,
                    date: combinedDate,
                    venue: formData.venue
                })

            if (!error) {
                router.refresh()
                setOpen(false)
                setFormData({ name: "", date: "", time: "", venue: "" })
            }
        }
        setIsLoading(false)
    }

    if (!mounted) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6 py-6 h-auto transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="h-5 w-5 mr-2" /> Schedule Concert
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden backdrop-blur-xl">
                <div className="bg-indigo-600/10 p-8 border-b border-zinc-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -z-10 rounded-full" />
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {isEditing ? <Settings2 className="h-8 w-8 text-indigo-500" /> : <CalendarIcon className="h-8 w-8 text-indigo-500" />}
                            {isEditing ? "Edit Event" : "New Event"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-base">
                            {isEditing ? "Update details for this concert or rehearsal." : "Schedule a future concert or rehearsal for your band."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Event Name</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                placeholder="e.g. Summer Festival Main Stage"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Time</Label>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1 flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Venue / Location
                            </Label>
                            <Input
                                value={formData.venue}
                                onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                placeholder="e.g. The Madison Square Garden"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 mt-4 overflow-hidden group"
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-300 group-hover:rotate-12 transition-transform" />
                                {isEditing ? "Update Details" : "Schedule Event"}
                            </div>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
