"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Users,
    Mail,
    Music2,
    MoreHorizontal,
    Clock,
    XCircle,
    UserCircle
} from "lucide-react"
import { InviteMemberDialog } from "@/components/members/invite-member-dialog"
import { EditMemberDialog } from "@/components/members/edit-member-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MembersListProps {
    groupId: string
    initialMembers: any[]
    initialInvitations: any[]
    currentUserId: string
    currentUserRole: string
}

export function MembersList({ groupId, initialMembers, initialInvitations, currentUserId, currentUserRole }: MembersListProps) {
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const isAdmin = currentUserRole === 'admin'

    const handleEdit = (member: any) => {
        // Members can only edit themselves. Admins can edit anyone.
        if (member.profiles.id !== currentUserId && !isAdmin) return

        setSelectedMember(member)
        setIsEditOpen(true)
    }

    const handleDeleteInvitation = async (inviteId: string) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return
        setIsDeleting(true)

        const { error } = await supabase
            .from("group_invitations")
            .delete()
            .eq("id", inviteId)

        if (!error) {
            router.refresh()
        } else {
            console.error("Delete error:", error)
        }
        setIsDeleting(false)
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Users className="h-10 w-10 text-indigo-500" />
                        Band Members
                    </h1>
                    <p className="text-zinc-500 text-lg">Manage your band line-up, roles, and invitations.</p>
                </div>
                {isAdmin && <InviteMemberDialog groupId={groupId} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CURRENT MEMBERS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Active Line-up</h2>
                    <div className="grid gap-4">
                        {(initialMembers || []).map((member: any) => {
                            const isSelf = member.profiles.id === currentUserId
                            return (
                                <div
                                    key={member.id}
                                    onClick={() => handleEdit(member)}
                                    className={`group relative bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-5 flex items-center justify-between shadow-xl transition-all ${isSelf || isAdmin
                                            ? "hover:border-indigo-500/30 hover:bg-zinc-900/40 cursor-pointer"
                                            : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 rounded-xl border border-zinc-800 shadow-sm">
                                                <AvatarImage src={member.profiles.avatar_url} />
                                                <AvatarFallback className="bg-zinc-900 text-zinc-400 font-bold text-lg">
                                                    {member.profiles.full_name?.charAt(0) || member.profiles.email?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isSelf && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-zinc-950">
                                                    <UserCircle className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-lg">
                                                    {member.profiles.full_name || member.profiles.email.split('@')[0]}
                                                    {isSelf && <span className="text-indigo-400 ml-2 text-sm font-medium">(You)</span>}
                                                </span>
                                                {member.role === 'admin' ? (
                                                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-bold uppercase tracking-tight h-5">
                                                        Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] uppercase font-bold h-5">
                                                        Member
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-zinc-500 text-sm flex items-center gap-1.5 font-medium group-hover:text-zinc-300 transition-colors">
                                                    <Music2 className="h-3.5 w-3.5" />
                                                    {member.instrument || "No instrument set"}
                                                </span>
                                                <span className="text-zinc-700 text-xs">•</span>
                                                <span className="text-zinc-600 text-xs italic">{member.profiles.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-zinc-600 group-hover:text-white group-hover:bg-zinc-800 rounded-xl transition-all">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* PENDING INVITATIONS */}
                <div className="space-y-6">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Invitations</h2>
                    <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl text-white">
                        {(initialInvitations || []).length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <div className="bg-zinc-900/50 h-12 w-12 rounded-full flex items-center justify-center mx-auto opacity-20">
                                    <Mail className="h-6 w-6 text-zinc-400" />
                                </div>
                                <p className="text-zinc-600 text-sm font-medium">No pending invites</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-900">
                                {(initialInvitations || []).map((invite: any) => (
                                    <div key={invite.id} className="p-5 space-y-3 group hover:bg-zinc-900/20 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 text-white">
                                                <div className="font-bold flex items-center gap-2">
                                                    {invite.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    Sent {new Date(invite.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteInvitation(invite.id)}
                                                    disabled={isDeleting}
                                                    className="h-8 w-8 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-500 text-[9px] uppercase font-bold py-0.5">
                                                {invite.role}
                                            </Badge>
                                            <Badge variant="outline" className="bg-amber-500/5 border-amber-500/20 text-amber-500/70 text-[9px] uppercase font-bold py-0.5">
                                                Pending
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-4 bg-zinc-900/30 border-t border-zinc-900">
                            <p className="text-[10px] text-zinc-600 font-medium italic text-center">
                                Invitations are sent via email.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <EditMemberDialog
                member={selectedMember}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                currentUserId={currentUserId}
            />
        </div>
    )
}
