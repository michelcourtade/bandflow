"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Music2, Music, User, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav({ groupId }: { groupId: string }) {
    const pathname = usePathname()

    const navItems = [
        {
            title: "Dashboard",
            url: `/${groupId}`,
            icon: LayoutDashboard,
        },
        {
            title: "Songs",
            url: `/${groupId}/songs`,
            icon: Music2,
        },
        {
            title: "Setlists",
            url: `/${groupId}/setlists`,
            icon: Music,
        },
        {
            title: "Events",
            url: `/${groupId}/concerts`,
            icon: Calendar,
        },
        {
            title: "Account",
            url: `/account`,
            icon: User,
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-zinc-800/50 px-2 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.url
                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 active:scale-90",
                                isActive ? "text-indigo-500 scale-110" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "fill-indigo-500/10" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {item.title}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
