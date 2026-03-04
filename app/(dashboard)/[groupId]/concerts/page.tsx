export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Music, ChevronRight, Clock, Plus, Ghost } from "lucide-react"
import { ConcertDialog } from "@/components/concerts/concert-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Concert {
    id: string
    name: string
    date: string | null
    venue: string | null
    group_id: string
    setlists: {
        id: string
        name: string
    }[]
}

export default async function ConcertsPage({
    params,
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    const { data: concerts } = await supabase
        .from("concerts")
        .select(`
            *,
            setlists (
                id,
                name
            )
        `)
        .eq("group_id", groupId)
        .order("date", { ascending: true })

    const now = new Date()
    const upcoming = ((concerts as any) || []).filter((c: Concert) => !c.date || new Date(c.date) >= now)
    const past = ((concerts as any) || []).filter((c: Concert) => c.date && new Date(c.date) < now).reverse()

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">Events</h1>
                    <p className="text-zinc-500 text-lg">Schedule shows, rehearsals, and manage your touring life.</p>
                </div>
                <ConcertDialog groupId={groupId} />
            </div>

            <div className="space-y-12">
                {/* UPCOMING EVENTS */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest text-sm">Upcoming Shows</h2>
                    </div>

                    {upcoming.length === 0 ? (
                        <div className="bg-zinc-900/10 border-2 border-dashed border-zinc-800/50 rounded-3xl p-16 text-center">
                            <div className="bg-zinc-800/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="h-10 w-10 text-zinc-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-300 mb-2">No upcoming events</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto mb-8">Time to book a show! Check your calendar and add your next live performance or rehearsal.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {upcoming.map((concert: Concert) => (
                                <Link
                                    key={concert.id}
                                    href={`/${groupId}/concerts/${concert.id}`}
                                    className="group relative bg-[#0a0a0a] border border-zinc-800/50 rounded-3xl p-6 hover:border-indigo-500/50 hover:bg-zinc-900/30 transition-all overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -z-10 group-hover:bg-indigo-500/10 transition-colors" />

                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-4 flex-1">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                    {concert.name || "Untitled Event"}
                                                </h3>
                                                <div className="flex items-center gap-4 text-zinc-400">
                                                    {concert.date && (
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <Calendar className="h-4 w-4 text-zinc-600" />
                                                            {new Date(concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                    {concert.date && (
                                                        <div className="flex items-center gap-1.5 text-sm font-mono">
                                                            <Clock className="h-4 w-4 text-zinc-600" />
                                                            {new Date(concert.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {concert.venue && (
                                                    <Badge variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-400 py-1.5 px-3 rounded-xl flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" /> {concert.venue}
                                                    </Badge>
                                                )}
                                                {concert.setlists?.length > 0 && (
                                                    <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 py-1.5 px-3 rounded-xl flex items-center gap-2">
                                                        <Music className="h-3 w-3" /> {concert.setlists[0].name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900 h-12 w-12 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-indigo-500/30 transition-all self-center shrink-0 shadow-lg">
                                            <ChevronRight className="h-6 w-6 text-zinc-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* PAST EVENTS */}
                {past.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-zinc-500 uppercase tracking-widest text-sm">Gig History</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                            {past.map((concert: Concert) => (
                                <Link
                                    key={concert.id}
                                    href={`/${groupId}/concerts/${concert.id}`}
                                    className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 hover:bg-zinc-900/40 transition-all flex justify-between items-center group"
                                >
                                    <div className="space-y-1">
                                        <div className="font-bold text-zinc-300 group-hover:text-white transition-colors">{concert.name}</div>
                                        <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">
                                            {concert.venue} • {concert.date ? new Date(concert.date).toLocaleDateString() : "TBD"}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-zinc-600 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
