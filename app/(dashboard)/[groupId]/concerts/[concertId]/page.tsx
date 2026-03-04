export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
    Calendar,
    MapPin,
    Music,
    ChevronLeft,
    Clock,
    Users,
    Info,
    ExternalLink,
    ListMusic,
    Pencil
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LinkSetlistSelect } from "@/components/concerts/link-setlist-select"
import { DeleteConcertButton } from "@/components/concerts/delete-concert-button"
import { ConcertDialog } from "@/components/concerts/concert-dialog"
import { formatDuration } from "@/lib/utils"

export default async function ConcertDetailPage({
    params,
}: {
    params: Promise<{ groupId: string; concertId: string }>
}) {
    const { groupId, concertId } = await params
    const supabase = await createClient()

    // 1. Fetch concert details
    const { data: concert, error } = await supabase
        .from("concerts")
        .select(`
            *,
            setlists (
                id,
                name,
                setlist_items (
                    id,
                    position,
                    group_songs (
                        duration_seconds,
                        songs (
                            title,
                            artist,
                            duration_seconds
                        )
                    )
                )
            )
        `)
        .eq("id", concertId)
        .single()

    if (error || !concert) {
        redirect(`/${groupId}/concerts`)
    }

    // 2. Fetch all setlists for this group to allow linking
    const { data: allSetlists } = await supabase
        .from("setlists")
        .select("id, name")
        .eq("group_id", groupId)

    const linkedSetlist = concert.setlists?.[0] || null

    // Calculate total duration if setlist is linked
    let totalSeconds = 0
    if (linkedSetlist) {
        totalSeconds = linkedSetlist.setlist_items?.reduce((acc: number, item: any) => {
            const duration = item.group_songs?.duration_seconds || item.group_songs?.songs?.duration_seconds || 0
            return acc + duration
        }, 0) || 0
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Link
                href={`/${groupId}/concerts`}
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
            >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Events
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COL: INFO */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 rounded-full" />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-extrabold tracking-tight text-white">{concert.name}</h1>
                                <div className="flex flex-wrap items-center gap-6 text-zinc-400">
                                    {concert.date && (
                                        <div className="flex items-center gap-2 font-medium">
                                            <Calendar className="h-5 w-5 text-indigo-500" />
                                            {new Date(concert.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    )}
                                    {concert.date && (
                                        <div className="flex items-center gap-2 font-mono">
                                            <Clock className="h-5 w-5 text-indigo-500" />
                                            {new Date(concert.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                    {concert.venue && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-red-500" />
                                            {concert.venue}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/50">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Load-in</div>
                                    <div className="text-white font-mono">—</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Soundcheck</div>
                                    <div className="text-white font-mono">—</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Doors</div>
                                    <div className="text-white font-mono">—</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Showtime</div>
                                    <div className="text-indigo-400 font-mono font-bold">
                                        {concert.date ? new Date(concert.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ATTACHED SETLIST */}
                    {linkedSetlist ? (
                        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                        <ListMusic className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Linked Setlist</h2>
                                        <p className="text-zinc-500 text-sm">{linkedSetlist.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Est. Duration</div>
                                    <div className="text-lg font-mono text-zinc-300">~ {Math.floor(totalSeconds / 60)} min</div>
                                </div>
                            </div>

                            <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {linkedSetlist.setlist_items && linkedSetlist.setlist_items.length > 0 ? (
                                        <div className="divide-y divide-zinc-800/30">
                                            {(linkedSetlist.setlist_items as any[])
                                                .sort((a, b) => (a.position || 0) - (b.position || 0))
                                                .map((item, idx) => {
                                                    const songInfo = item.group_songs?.songs || {}
                                                    const duration = item.group_songs?.duration_seconds || songInfo.duration_seconds
                                                    return (
                                                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <span className="text-zinc-600 font-mono text-xs w-4">{idx + 1}.</span>
                                                                <div className="truncate">
                                                                    <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">{songInfo.title || "Untitled Song"}</p>
                                                                    <p className="text-[10px] text-zinc-500 truncate">{songInfo.artist || "Unknown Artist"}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-mono text-zinc-600 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50">
                                                                {formatDuration(duration)}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-zinc-600 text-sm italic">
                                            This setlist is empty.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button asChild className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex-1">
                                    <Link href={`/${groupId}/setlists/${linkedSetlist.id}`}>
                                        <Music className="h-4 w-4 mr-2" /> Modify Setlist
                                    </Link>
                                </Button>
                                <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl flex-1">
                                    <ExternalLink className="h-4 w-4 mr-2" /> Print PDF
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-12 text-center space-y-6">
                            <div className="bg-amber-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                                <Info className="h-8 w-8 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-amber-200">No setlist linked yet</h3>
                                <p className="text-zinc-500 max-w-sm mx-auto text-sm">You haven't attached a setlist to this event. Link one now to start preparing your show sequence.</p>
                            </div>
                            <div className="flex justify-center">
                                <LinkSetlistSelect
                                    concertId={concertId}
                                    groupId={groupId}
                                    availableSetlists={allSetlists || []}
                                    currentSetlistId={null}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COL: SETTINGS / ACTIONS */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Management</h4>

                        <div className="space-y-4">
                            <ConcertDialog
                                groupId={groupId}
                                concert={concert}
                                trigger={
                                    <Button variant="outline" className="w-full justify-start border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all">
                                        <Pencil className="h-4 w-4 mr-2" /> Edit Event Details
                                    </Button>
                                }
                            />

                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 font-medium ml-1">Change Setlist</label>
                                <LinkSetlistSelect
                                    concertId={concertId}
                                    groupId={groupId}
                                    availableSetlists={allSetlists || []}
                                    currentSetlistId={linkedSetlist?.id}
                                />
                            </div>

                            <DeleteConcertButton
                                concertId={concertId}
                                groupId={groupId}
                                concertName={concert.name}
                            />
                        </div>
                    </div>

                    <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Line-up</span>
                        </div>
                        <p className="text-xs text-zinc-600 italic">Full band (All members invited)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
