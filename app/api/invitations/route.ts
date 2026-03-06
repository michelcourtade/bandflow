export const runtime = 'edge'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
// No Resend package needed, using direct fetch
const resendApiKey = process.env.RESEND_API_KEY

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
        if (!resendApiKey) {
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

        // Send real email via Resend API using fetch
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "BandFlow <invites@bandflow.app>",
                to: [email],
                subject: `${inviterName} invited you to join ${groupName} on BandFlow!`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Invitation to BandFlow</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                            <tr>
                                <td align="center" style="padding: 40px 0 20px 0;">
                                    <div style="font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -1px; color: #ffffff;">
                                        BAND<span style="color: #6366f1;">FLOW</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td align="center">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 20px; background-color: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                        <tr>
                                            <td style="padding: 40px;">
                                                <div style="text-align: center; margin-bottom: 24px;">
                                                    <div style="display: inline-block; padding: 12px; background-color: #4f46e5; border-radius: 12px; margin-bottom: 16px;">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                                                    </div>
                                                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Join the Band</h1>
                                                </div>
                                                
                                                <p style="font-size: 16px; line-height: 24px; color: #a1a1aa; text-align: center; margin-bottom: 24px;">
                                                    <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join <strong style="color: #6366f1;">${groupName}</strong> on BandFlow.
                                                </p>
                                                
                                                <p style="font-size: 16px; line-height: 24px; color: #a1a1aa; text-align: center; margin-bottom: 32px;">
                                                    You are invited as a <span style="color: #ffffff; font-weight: 600; text-transform: capitalize;">${role}</span>. Ready to orchestrate your success?
                                                </p>
                                                
                                                <div style="text-align: center; margin-bottom: 32px;">
                                                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 32px; background-color: #4338ca; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                                        Accept Invitation
                                                    </a>
                                                </div>
                                                
                                                <div style="background-color: #161616; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #262626;">
                                                    <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">What is BandFlow?</h2>
                                                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #a1a1aa;">
                                                        BandFlow is the ultimate workspace for modern bands. A single place to manage your <strong>repertoire</strong>, craft perfect <strong>setlists</strong>, and centralize all your <strong>charts and recordings</strong>. Built by musicians, for the stage.
                                                    </p>
                                                </div>

                                                <div style="border-top: 1px solid #1f1f1f; padding-top: 24px;">
                                                    <p style="font-size: 13px; line-height: 20px; color: #71717a; text-align: center; margin: 0;">
                                                        If the button above doesn't work, copy and paste this link into your browser:
                                                    </p>
                                                    <p style="font-size: 13px; line-height: 20px; color: #6366f1; text-align: center; margin: 8px 0 0 0; word-break: break-all;">
                                                        ${inviteLink}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 32px 0 40px 0;">
                                    <p style="font-size: 13px; color: #52525b; margin: 0;">
                                        &copy; ${new Date().getFullYear()} BandFlow. Built for the stage.
                                    </p>
                                    <p style="font-size: 12px; color: #3f3f46; margin-top: 8px;">
                                        If you weren't expecting this invitation, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json({ error: data.message || "Failed to send email" }, { status: response.status })
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("Failed to send invite email:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
