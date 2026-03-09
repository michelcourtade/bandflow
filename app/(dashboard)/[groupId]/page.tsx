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

    // Fetch recent activity and next event
    const [recentSongs, recentDocs, recentConcerts, recentSetlists, { data: upcomingEvent }] = await Promise.all([
        supabase.from("group_songs")
            .select("created_at, songs(title)")
            .eq("group_id", groupId)
            .order("created_at", { ascending: false })
            .limit(3),
        supabase.from("group_song_documents")
            .select("created_at, name, file_type")
            .eq("group_id", groupId)
            .order("created_at", { ascending: false })
            .limit(3),
        supabase.from("concerts")
            .select("created_at, name")
            .eq("group_id", groupId)
            .order("created_at", { ascending: false })
            .limit(3),
        supabase.from("setlists")
            .select("created_at, name")
            .eq("group_id", groupId)
            .order("created_at", { ascending: false })
            .limit(3),
        supabase.from("concerts")
            .select("*")
            .eq("group_id", groupId)
            .gte("date", new Date().toISOString())
            .order("date", { ascending: true })
            .limit(1)
            .maybeSingle()
    ])

    const activity = [
        ...(recentSongs.data || []).map(s => ({ type: 'song', name: (s.songs as any)?.title, date: s.created_at, icon: Music, color: "text-indigo-400" })),
        ...(recentDocs.data || []).map(d => ({ type: 'doc', name: d.name, date: d.created_at, icon: ListTodo, color: "text-blue-400" })),
        ...(recentConcerts.data || []).map(c => ({ type: 'event', name: c.name, date: c.created_at, icon: Calendar, color: "text-emerald-400" })),
        ...(recentSetlists.data || []).map(s => ({ type: 'setlist', name: s.name, date: s.created_at, icon: ListTodo, color: "text-violet-400" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Workspace Dashboard</h1>
                    <p className="text-zinc-500 text-lg">Overview of your band's activity and repertoire.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="border-zinc-800 bg-zinc-900/50 rounded-xl">
                        <Link href={`/${groupId}/songs`}>Manage Repertoire</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md shadow-xl group hover:border-indigo-500/30 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/20">
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                             Activity Feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activity.length > 0 ? (
                            <div className="divide-y divide-zinc-800/50">
                                {activity.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 hover:bg-zinc-800/20 transition-colors group">
                                        <div className={`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors`}>
                                            <item.icon className={`h-4 w-4 ${item.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-200 truncate">
                                                {item.type === 'song' ? 'New song added:' : 
                                                 item.type === 'doc' ? 'File uploaded:' :
                                                 item.type === 'event' ? 'New event created:' : 'Setlist created:'}
                                                <span className="text-white ml-1 font-extrabold">{item.name}</span>
                                            </p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">
                                                {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-zinc-600 italic gap-4">
                                <ListTodo className="h-12 w-12 opacity-10" />
                                <p>No recent activity to show yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 group-hover:bg-indigo-500/10 transition-colors" />
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                            Up Next
                            <Calendar className="h-4 w-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingEvent ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="text-2xl md:text-3xl font-black text-white line-clamp-2 tracking-tight leading-none group-hover:text-indigo-400 transition-colors font-glow">
                                        {upcomingEvent.name}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {new Date(upcomingEvent.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="text-zinc-400 flex items-center gap-2 px-1">
                                            <MapPinIcon className="h-4 w-4 text-zinc-600" />
                                            <span className="text-sm font-medium">{upcomingEvent.venue || "Location TBD"}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.02]">
                                    <Link href={`/${groupId}/concerts/${upcomingEvent.id}`}>Go to Event Hub</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="h-[250px] flex flex-col items-center justify-center text-zinc-600 italic text-center px-8 gap-4">
                                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                                    <Calendar className="h-10 w-10 opacity-20" />
                                </div>
                                <div className="space-y-1">
                                    <p>No upcoming events scheduled.</p>
                                    <Link href={`/${groupId}/concerts`} className="text-indigo-500 hover:text-indigo-400 font-bold text-sm">Create a show →</Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MapPinIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    )
}
