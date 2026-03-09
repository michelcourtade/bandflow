"use client"

import * as React from "react"
import {
    Calendar,
    LayoutDashboard,
    Music2,
    Settings,
    User,
    Music,
    LogOut,
    ChevronRight,
    MoreHorizontal,
    Users
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function AppSidebar({
    groupName,
    groupId,
    user
}: {
    groupName: string,
    groupId: string,
    user: any
}) {
    const { setOpenMobile } = useSidebar()
    const navItems = [
        {
            title: "Dashboard",
            url: `/${groupId}`,
            icon: LayoutDashboard,
        },
        {
            title: "Repertoire",
            url: `/${groupId}/songs`,
            icon: Music2,
        },
        {
            title: "Setlists",
            url: `/${groupId}/setlists`,
            icon: Music,
        },
        {
            title: "Concerts",
            url: `/${groupId}/concerts`,
            icon: Calendar,
        },
        {
            title: "Members",
            url: `/${groupId}/members`,
            icon: Users,
        },
    ]

    return (
        <Sidebar collapsible="icon" className="border-r border-zinc-800/50 bg-[#0a0a0a]">
            <SidebarHeader className="bg-[#0a0a0a]">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-zinc-900 group">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                <Music className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold text-white tracking-tight uppercase italic">BandFlow</span>
                                <span className="truncate text-xs text-zinc-500">{groupName}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="bg-[#0a0a0a]">
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                className="hover:bg-zinc-900 text-zinc-400 hover:text-white group active:scale-[0.97] transition-all"
                                onClick={() => setOpenMobile(false)}
                            >
                                <Link href={item.url}>
                                    <item.icon className="group-hover:text-indigo-500 transition-colors" />
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="bg-[#0a0a0a] border-t border-zinc-900">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-zinc-900 hover:bg-zinc-900 text-zinc-400"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg border border-zinc-800">
                                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400 capitalize">
                                            {user.email?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold text-zinc-200">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </span>
                                        <span className="truncate text-xs text-zinc-500">{user.email}</span>
                                    </div>
                                    <MoreHorizontal className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg border border-zinc-800">
                                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                                                {user.email?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold text-white">
                                                {user.user_metadata?.full_name}
                                            </span>
                                            <span className="truncate text-xs text-zinc-500">{user.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem className="hover:bg-zinc-800 hover:text-white cursor-pointer focus:bg-zinc-800 focus:text-white" asChild>
                                    <Link href="/account">
                                        <User className="mr-2 h-4 w-4" />
                                        Account
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-zinc-800 hover:text-white cursor-pointer focus:bg-zinc-800 focus:text-white" asChild>
                                    <a href="/">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Switch Band
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem className="hover:bg-red-950/30 hover:text-red-400 text-red-400 cursor-pointer focus:bg-red-950/30 focus:text-red-400" asChild>
                                    <form action="/auth/signout" method="post" className="w-full">
                                        <button type="submit" className="w-full flex items-center">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </button>
                                    </form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
