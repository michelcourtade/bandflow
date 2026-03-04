export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Calendar, ListTodo, Users } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    // Simple stats for the dashboard
    const [songsCount, concertsCount, setlistsCount, membersCount] = await Promise.all([
        supabase.from("group_songs").select("id", { count: "exact", head: true }).eq("group_id", groupId),
        supabase.from("concerts").select("id", { count: "exact", head: true }).eq("group_id", groupId),
        supabase.from("setlists").select("id", { count: "exact", head: true }).eq("group_id", groupId),
        supabase.from("memberships").select("id", { count: "exact", head: true }).eq("group_id", groupId),
    ])

    const stats = [
        { title: "Songs", value: songsCount.count || 0, icon: Music, color: "text-indigo-500" },
        { title: "Upcoming Events", value: concertsCount.count || 0, icon: Calendar, color: "text-emerald-500" },
        { title: "Setlists", value: setlistsCount.count || 0, icon: ListTodo, color: "text-violet-500" },
        { title: "Band Members", value: membersCount.count || 0, icon: Users, color: "text-orange-500" },
    ]

    // Fetch the next upcoming event
    const { data: upcomingEvent } = await supabase
        .from("concerts")
        .select("*")
        .eq("group_id", groupId)
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(1)
        .single()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Workspace Dashboard</h1>
                <p className="text-zinc-500">Overview of your band's activity and repertoire.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-zinc-600 italic">
                            No recent activity to show yet.
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden">
                    {upcomingEvent && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -z-10 rounded-full" />
                    )}
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            Next Event
                            <Calendar className="h-4 w-4 text-zinc-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingEvent ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold text-white line-clamp-1">{upcomingEvent.name}</div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-indigo-400 font-medium flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(upcomingEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </div>
                                        <div className="text-zinc-500 flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 opacity-0" /> {/* Spacer */}
                                            {upcomingEvent.venue || "Location TBD"}
                                        </div>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="w-full border-zinc-800 bg-zinc-900/50 text-white rounded-xl hover:bg-zinc-800 transition-all">
                                    <Link href={`/${groupId}/concerts/${upcomingEvent.id}`}>View Details</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-zinc-600 italic text-center px-4">
                                No upcoming events scheduled.<br />
                                <Link href={`/${groupId}/concerts`} className="text-indigo-500 hover:underline mt-2 inline-block">Plan one now</Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
