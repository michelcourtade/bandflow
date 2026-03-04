export const runtime = 'edge'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

// Initialize Resend with API Key (Needs RESEND_API_KEY in .env.local)
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(req: Request) {
    try {
        const { email, groupId, role } = await req.json()

        if (!email || !groupId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const supabase = await createClient()

        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch user's profile info (the inviter)
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single()

        const inviterName = profile?.full_name || profile?.email || "Someone"

        // Fetch group info
        const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", groupId)
            .single()

        const groupName = group?.name || "their band"

        // Generate invitation link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const inviteLink = `${appUrl}/login?invite=${groupId}&email=${encodeURIComponent(email)}`

        // If no API key, we simulate the email sending (console log)
        if (!resend) {
            console.log("=========================================")
            console.log("📧 MOCK EMAIL SENT")
            console.log(`To: ${email}`)
            console.log(`Subject: ${inviterName} invited you to join ${groupName} on BandFlow!`)
            console.log(`Body: You've been invited as a ${role}. Click here to join: ${inviteLink}`)
            console.log("=========================================")

            return NextResponse.json({
                success: true,
                simulated: true,
                message: "Email simulated (No RESEND_API_KEY found)"
            })
        }

        // Send real email via Resend
        const data = await resend.emails.send({
            from: "BandFlow <invites@bandflow.app>", // Update this if you have a verified domain on Resend
            to: [email],
            subject: `${inviterName} invited you to join ${groupName} on BandFlow!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #4f46e5; text-align: center;">Welcome to BandFlow</h2>
                    <p style="font-size: 16px; color: #374151;">Hello!</p>
                    <p style="font-size: 16px; color: #374151;">
                        <strong>${inviterName}</strong> has invited you to join their band <strong>${groupName}</strong> on BandFlow.
                    </p>
                    <p style="font-size: 16px; color: #374151;">
                        You'll be joining as a <strong>${role}</strong>.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Accept Invitation
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">
                        If you don't use BandFlow yet, accepting the invitation will help you create your account.
                    </p>
                </div>
            `,
        })

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("Failed to send invite email:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
