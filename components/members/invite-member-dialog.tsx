"use client"

import { useState } from "react"
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
import {
    UserPlus,
    Loader2,
    Mail,
    Shield,
    Music2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function InviteMemberDialog({ groupId }: { groupId: string }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        role: "member",
        instrument: ""
    })

    const supabase = createClient()
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        // 1. Check if user already exists in profiles
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", formData.email)
            .single()

        if (profile) {
            // User exists, add them directly to memberships (or create invitation)
            // For now, let's just create an invitation to follow the flow
        }

        const { error } = await supabase
            .from("group_invitations")
            .upsert({
                group_id: groupId,
                email: formData.email,
                role: formData.role,
                status: 'pending'
            }, {
                onConflict: 'group_id,email'
            })

        if (!error) {
            // Trigger the email API route
            try {
                const response = await fetch("/api/invitations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: formData.email,
                        groupId: groupId,
                        role: formData.role
                    })
                })

                const data = await response.json()

                if (response.ok) {
                    toast.success(`Invitation sent to ${formData.email}`)
                    setOpen(false)
                    setFormData({ email: "", role: "member", instrument: "" })
                    router.refresh()
                } else {
                    toast.error(`Email error: ${data.error || "Failed to send"}`)
                }
            } catch (apiError) {
                console.error("Failed to trigger email API", apiError)
                toast.error("Network error while sending invitation")
            }
        } else {
            console.error(error)
            toast.error("Database error while creating invitation")
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6 py-6 h-auto transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <UserPlus className="h-5 w-5 mr-2" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden backdrop-blur-xl">
                <div className="bg-indigo-600/10 p-8 border-b border-zinc-800/50">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Mail className="h-8 w-8 text-indigo-500" />
                            Invite Musician
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-base">
                            Send an invitation to join your band workspace.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Email Address</Label>
                            <Input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                placeholder="musician@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v: string) => setFormData({ ...formData, role: v })}
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
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Instrument</Label>
                                <Input
                                    value={formData.instrument}
                                    onChange={e => setFormData({ ...formData, instrument: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 h-12 rounded-xl focus:ring-indigo-500"
                                    placeholder="Guitar, Vocals..."
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 mt-4 outline-none"
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            "Send Invitation"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
