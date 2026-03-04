"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface DeleteConcertButtonProps {
    concertId: string
    groupId: string
    concertName: string
}

export function DeleteConcertButton({ concertId, groupId, concertName }: DeleteConcertButtonProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleDelete() {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from("concerts")
                .delete()
                .eq("id", concertId)

            if (error) throw error

            setOpen(false)
            router.push(`/${groupId}/concerts`)
            router.refresh()
        } catch (error) {
            console.error("Delete error:", error)
            alert("Failed to delete event")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <Trash2 className="h-4 w-4 mr-2" /> Cancel/Delete Event
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <div className="bg-red-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Delete Event?</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Are you sure you want to delete <span className="text-zinc-300 font-bold">"{concertName}"</span>?
                        This action cannot be undone and will unassign any linked setlists.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-zinc-400 hover:text-white"
                        disabled={isLoading}
                    >
                        Keep Event
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Delete Permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
