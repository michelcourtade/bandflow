"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Check, X, Mail } from "lucide-react"

export function InvitationList({ invitations, userId }: { invitations: any[], userId: string }) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    if (!invitations || invitations.length === 0) return null

    async function handleAccept(invite: any) {
        setIsLoading(invite.id)

        // Add to memberships
        const { error: memberError } = await supabase
            .from("memberships")
            .insert({
                user_id: userId,
                group_id: invite.group_id,
                role: invite.role
            })

        if (!memberError) {
            // Update invitation status
            await supabase
                .from("group_invitations")
                .update({ status: 'accepted' })
                .eq("id", invite.id)

            router.refresh()
        } else {
            console.error("Failed to accept invite:", memberError)
            setIsLoading(null)
        }
    }

    async function handleDecline(inviteId: string) {
        setIsLoading(inviteId)
        await supabase
            .from("group_invitations")
            .update({ status: 'declined' })
            .eq("id", inviteId)

        router.refresh()
    }

    return (
        <div className="mb-12 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-500" />
                Pending Invitations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invitations.map((invite) => (
                    <Card key={invite.id} className="bg-indigo-900/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                                {invite.groups?.name || "A band"}
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                You have been invited to join as a <span className="text-indigo-400 uppercase text-xs font-bold tracking-wider">{invite.role}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-3">
                            <Button
                                onClick={() => handleAccept(invite)}
                                disabled={!!isLoading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                            >
                                {isLoading === invite.id ? "Processing..." : <><Check className="h-4 w-4 mr-2" /> Accept</>}
                            </Button>
                            <Button
                                onClick={() => handleDecline(invite.id)}
                                disabled={!!isLoading}
                                variant="outline"
                                className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <X className="h-4 w-4 mr-2" /> Decline
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
