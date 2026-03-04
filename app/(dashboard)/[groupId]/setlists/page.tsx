export const runtime = 'edge'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Music, Calendar, Plus, MoreVertical, LayoutList, ListTodo } from "lucide-react"
import { CreateSetlistDialog } from "@/components/setlists/create-setlist-dialog"

export default async function SetlistsPage({
    params,
}: {
    params: Promise<{ groupId: string }>
}) {
    const { groupId } = await params
    const supabase = await createClient()

    // Fetch setlists for the group
    const { data: setlists } = await supabase
        .from("setlists")
        .select(`
      *,
      concerts (name, date),
      setlist_items (count)
    `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-glow">Setlists</h1>
                    <p className="text-zinc-500 text-lg">Create and organize sequences of songs for your shows.</p>
                </div>
                <CreateSetlistDialog groupId={groupId} />
            </div>

            {!setlists || setlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 backdrop-blur-sm">
                    <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
                        <ListTodo className="h-12 w-12 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-300 mb-2">No setlists yet</h3>
                    <p className="text-zinc-500 mb-8 max-w-sm text-center">
                        Start by creating a new setlist. You can then add songs from your repertoire and organize them.
                    </p>
                    <CreateSetlistDialog groupId={groupId} variant="secondary" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {setlists.map((setlist: any) => (
                        <Card key={setlist.id} className="bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 transition-all group overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-indigo-600/10 p-2 rounded-lg border border-indigo-500/20">
                                        <Music className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-8 w-8 rounded-full">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                    {setlist.name || "Untitled Setlist"}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{setlist.concerts?.name || "No concert assigned"}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-zinc-400">
                                    <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
                                        <LayoutList className="h-4 w-4 text-zinc-500" />
                                        <span>{setlist.setlist_items?.[0]?.count || 0} songs</span>
                                    </div>
                                    <div className="text-xs text-zinc-600">
                                        Last edited {new Date(setlist.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button asChild className="w-full bg-zinc-800 hover:bg-indigo-600 border border-zinc-700 hover:border-indigo-500 transition-all h-11 rounded-xl font-semibold">
                                    <Link href={`/${groupId}/setlists/${setlist.id}`}>Open Builder</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
