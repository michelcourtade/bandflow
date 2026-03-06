"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function AccountForm({ user }: { user: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [fullName, setFullName] = useState(user.user_metadata?.full_name || "")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const supabase = createClient()

    async function updateProfile(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (error) throw error

            // Also update the profiles table if it exists
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id)

            if (profileError) console.error("Error updating profiles table:", profileError)

            toast.success("Profile updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile")
        } finally {
            setIsLoading(false)
        }
    }

    async function updatePassword(e: React.FormEvent) {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setNewPassword("")
            setConfirmPassword("")
            toast.success("Password updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid gap-8">
            {/* Profile Section */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <User className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-xl">Profile Information</CardTitle>
                    </div>
                    <CardDescription className="text-zinc-500">
                        Update your personal details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updateProfile} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed h-12 rounded-xl"
                            />
                            <p className="text-[10px] text-zinc-600 pl-1 italic">Contact support to change your email.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus:ring-indigo-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || fullName === (user.user_metadata?.full_name || "")}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Lock className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-xl">Security</CardTitle>
                    </div>
                    <CardDescription className="text-zinc-500">
                        Change your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updatePassword} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat new password"
                                    className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !newPassword || !confirmPassword}
                            className="bg-zinc-100 hover:bg-white text-zinc-950 h-12 px-8 rounded-xl font-bold transition-all"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
