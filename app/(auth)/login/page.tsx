import React from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    return (
        <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 w-full px-4 flex flex-col items-center">
                <div className="mb-8 flex items-center gap-2">
                    <span className="text-4xl font-black italic tracking-tighter text-white">
                        BAND<span className="text-indigo-500">FLOW</span>
                    </span>
                </div>

                <React.Suspense fallback={<div className="w-full max-w-md h-[400px] flex items-center justify-center bg-black/60 rounded-xl border border-zinc-800"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>}>
                    <AuthForm />
                </React.Suspense>

                <p className="mt-8 text-zinc-500 text-sm">
                    &copy; {new Date().getFullYear()} BandFlow. Built for the stage.
                </p>
            </div>
        </main>
    )
}
