"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Music, Check, Loader2 } from "lucide-react"

export function LinkSetlistSelect({
    concertId,
    groupId,
    availableSetlists,
    currentSetlistId
}: {
    concertId: string,
    groupId: string,
    availableSetlists: any[],
    currentSetlistId: string | null
}) {
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleLink(setlistId: string) {
        setIsLoading(true)

        // 1. Unlink any setlist currently linked to this concert
        await supabase
            .from("setlists")
            .update({ concert_id: null })
            .eq("concert_id", concertId)

        // 2. Link the new setlist (unless it's 'none')
        if (setlistId !== 'none') {
            await supabase
                .from("setlists")
                .update({ concert_id: concertId })
                .eq("id", setlistId)
        }

        router.refresh()
        setIsLoading(false)
    }

    return (
        <div className="flex items-center gap-3">
            <Select
                disabled={isLoading}
                defaultValue={currentSetlistId || 'none'}
                onValueChange={handleLink}
            >
                <SelectTrigger className="w-[280px] bg-zinc-900 border-zinc-800 rounded-xl h-12 text-zinc-300 focus:ring-indigo-500">
                    <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-indigo-500" />
                        <SelectValue placeholder="Select a setlist" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <SelectItem value="none" className="focus:bg-zinc-800 focus:text-white">No Setlist Linked</SelectItem>
                    {availableSetlists.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-zinc-800 focus:text-white">
                            {s.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
        </div>
    )
}
