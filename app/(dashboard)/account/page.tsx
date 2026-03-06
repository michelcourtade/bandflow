export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Music, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccountForm } from "@/components/account/account-form"

export default async function AccountPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-zinc-900 p-2 rounded-lg group-hover:bg-indigo-600 transition-colors">
                            <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        </div>
                        <span className="text-zinc-400 group-hover:text-white transition-colors">Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-md">
                            <Music className="h-4 w-4" />
                        </div>
                        <span className="text-xl font-bold tracking-tight italic">
                            BAND<span className="text-indigo-500">FLOW</span>
                        </span>
                    </div>
                </header>

                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">Account Settings</h1>
                    <p className="text-zinc-500 text-lg">Manage your profile and security preferences.</p>
                </div>

                <AccountForm user={user} />

                <footer className="mt-20 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
                    &copy; {new Date().getFullYear()} BandFlow. All rights reserved.
                </footer>
            </div>
        </main>
    )
}
