"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Loader2,
    Music2,
    Trash2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface EditMemberDialogProps {
    member: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    currentUserId?: string
}

export function EditMemberDialog({ member, isOpen, onOpenChange, currentUserId }: EditMemberDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        role: "member",
        instrument: ""
    })

    const supabase = createClient()
    const router = useRouter()

    // Sync form when member prop changes OR when dialog opens
    useEffect(() => {
        if (isOpen && member) {
            setFormData({
                role: member.role || "member",
                instrument: member.instrument || ""
            })
        }
    }, [isOpen, member])

    async function handleSave() {
        if (!member) return
        setIsLoading(true)

        console.log("Saving member data:", formData)

        const { error } = await supabase
            .from("memberships")
            .update({
                role: formData.role,
                instrument: formData.instrument
            })
            .eq("id", member.id)

        if (!error) {
            router.refresh()
            setTimeout(() => {
                onOpenChange(false)
            }, 100)
        } else {
            console.error("Save error:", error)
        }
        setIsLoading(false)
    }

    async function handleRemove() {
        if (!member) return
        if (!confirm("Are you sure you want to remove this member from the band?")) return

        setIsLoading(true)
        const { error } = await supabase
            .from("memberships")
            .delete()
            .eq("id", member.id)

        if (!error) {
            router.refresh()
            onOpenChange(false)
        } else {
            console.error("Delete error:", error)
        }
        setIsLoading(false)
    }

    const isSelf = member?.profiles?.id === currentUserId

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="bg-indigo-600/10 p-8 border-b border-zinc-800/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <Music2 className="h-6 w-6 text-indigo-500" />
                            {isSelf ? "My Profile" : "Edit Member"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            {isSelf
                                ? "Update your instrument in this band."
                                : `Update ${member?.profiles?.full_name || member?.profiles?.email}'s role and instrument.`}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Instrument</Label>
                            <Input
                                value={formData.instrument}
                                onChange={e => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500 text-white"
                                placeholder="Guitar, Vocals, Keys..."
                                autoFocus
                            />
                        </div>

                        {!isSelf && (
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v: string) => setFormData(prev => ({ ...prev, role: v }))}
                                >
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-zinc-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        {!isSelf && (
                            <Button
                                onClick={handleRemove}
                                disabled={isLoading}
                                variant="ghost"
                                className="bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 h-12 rounded-xl flex-1"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-xl font-bold flex-[2] shadow-lg shadow-indigo-600/10"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
