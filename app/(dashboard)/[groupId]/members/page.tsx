export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { MembersList } from "@/components/members/members-list"

export default async function MembersPage({
    params,
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    // Get current user to identify "You"
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch current members
    const { data: members } = await supabase
        .from("memberships")
        .select(`
            id,
            role,
            instrument,
            profiles (
                id,
                email,
                full_name,
                avatar_url
            )
        `)
        .eq("group_id", groupId)

    // 2. Fetch pending invitations
    const { data: invitations } = await supabase
        .from("group_invitations")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "pending")

    // Find current user's role
    const currentUserRole = members?.find(m => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        return (profile as any)?.id === user?.id
    })?.role || 'member'

    return (
        <MembersList
            groupId={groupId}
            initialMembers={members || []}
            initialInvitations={invitations || []}
            currentUserId={user?.id || ""}
            currentUserRole={currentUserRole}
        />
    )
}
