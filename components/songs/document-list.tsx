"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FileText, Download, Trash2, FileAudio, PlayCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CustomDocument {
    id: string
    file_path: string
    file_type: string
    name: string
    uploaded_by: string
}

interface DocumentListProps {
    documents: CustomDocument[]
    groupId: string
    currentUserId: string
    isAdmin: boolean
}

export function DocumentList({ documents, groupId, currentUserId, isAdmin }: DocumentListProps) {
    const supabase = createClient()
    const router = useRouter()
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})

    const isAudio = (type: string) => type.startsWith("audio/")

    // Pre-fetch signed URLs for audio files so the browser player can stream them
    useEffect(() => {
        async function fetchAudioUrls() {
            const urls: Record<string, string> = {}
            for (const doc of documents) {
                if (isAudio(doc.file_type)) {
                    // Valid for 24 hours (86400 seconds)
                    const { data } = await supabase.storage.from('band-documents').createSignedUrl(doc.file_path, 86400)
                    if (data?.signedUrl) {
                        urls[doc.id] = data.signedUrl
                    }
                }
            }
            if (Object.keys(urls).length > 0) {
                setAudioUrls(urls)
            }
        }
        fetchAudioUrls()
    }, [documents, supabase])

    const handleDownload = async (doc: CustomDocument) => {
        setDownloadingId(doc.id)

        try {
            const { data, error } = await supabase.storage.from("band-documents").download(doc.file_path)
            if (error) throw error

            // Create a blob and trigger browser download
            const blob = new Blob([data], { type: doc.file_type })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = doc.name
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
        } catch (err) {
            console.error("Download error:", err)
        } finally {
            setDownloadingId(null)
        }
    }

    const handleDelete = async (doc: CustomDocument) => {
        if (!confirm(`Tear out '${doc.name}' from your digital binder?`)) return
        setDeletingId(doc.id)

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage.from("band-documents").remove([doc.file_path])
            if (storageError) throw storageError

            // Delete DB tracking record
            const { error: dbError } = await supabase.from("group_song_documents").delete().eq("id", doc.id)
            if (dbError) throw dbError

            router.refresh()
        } catch (err) {
            console.error("Delete error:", err)
        } finally {
            setDeletingId(null)
        }
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/10 border-2 border-dashed border-zinc-800/50 rounded-xl">
                <FileText className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-zinc-400 font-medium">No files uploaded yet.</p>
                <p className="text-zinc-600 text-sm max-w-xs mt-1">Upload chord charts, guitar tabs, lyrics, or MP3 demos specific to this arrangement.</p>
            </div>
        )
    }

    const audioDocs = documents.filter(d => isAudio(d.file_type))
    const otherDocs = documents.filter(d => !isAudio(d.file_type))

    return (
        <div className="space-y-6">
            {/* Audio Section */}
            {audioDocs.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Demos & Tracks</h4>
                    <div className="grid gap-3">
                        {audioDocs.map(doc => {
                            const canDelete = isAdmin || doc.uploaded_by === currentUserId
                            const audioSrc = audioUrls[doc.id]

                            return (
                                <div key={doc.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500/10 p-2 rounded-lg">
                                                <FileAudio className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-200 text-sm truncate max-w-[200px] md:max-w-xs">{doc.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownload(doc)}
                                                disabled={downloadingId === doc.id}
                                                className="text-zinc-500 hover:text-white"
                                            >
                                                {downloadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            </Button>
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(doc)}
                                                    disabled={deletingId === doc.id}
                                                    className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Embedded Browser Player */}
                                    {audioSrc ? (
                                        <audio controls className="w-full h-10 mt-1" controlsList="nodownload">
                                            <source src={audioSrc} type={doc.file_type} />
                                            Your browser does not support the audio element.
                                        </audio>
                                    ) : (
                                        <div className="w-full h-10 bg-zinc-900 rounded-md animate-pulse mt-1 border border-zinc-800"></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* General Files Section */}
            {otherDocs.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Scores & Lyrics</h4>
                    <div className="grid gap-3">
                        {otherDocs.map(doc => {
                            const canDelete = isAdmin || doc.uploaded_by === currentUserId
                            return (
                                <div key={doc.id} className="bg-zinc-900/60 border border-zinc-800 p-3 pr-2 rounded-xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-800 p-2 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                            <FileText className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400" />
                                        </div>
                                        <span className="font-semibold text-zinc-300 text-sm truncate max-w-[200px] md:max-w-xs">{doc.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDownload(doc)}
                                            disabled={downloadingId === doc.id}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            {downloadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        </Button>
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(doc)}
                                                disabled={deletingId === doc.id}
                                                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
