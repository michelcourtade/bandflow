"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { EditSongDialog } from "./edit-song-dialog"
import { GroupSong } from "./song-list"

interface SongActionsProps {
    song: GroupSong
}

export function SongActions({ song }: SongActionsProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="h-10 px-4 rounded-xl gap-2 transition-all shadow-xl"
            >
                <Settings className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Edit Arrangement</span>
            </Button>

            <EditSongDialog
                song={song}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    )
}
