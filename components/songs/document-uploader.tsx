"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UploadCloud, Loader2, FileText, Music as MusicIcon, AlertCircle } from "lucide-react"

interface DocumentUploaderProps {
    groupId: string
    songId: string
    userId: string
}

export function DocumentUploader({ groupId, songId, userId }: DocumentUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation: 15MB limit
        if (file.size > 15 * 1024 * 1024) {
            setError("File is too large (max 15MB).")
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            // Generate clean unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `${groupId}/${songId}/${fileName}`

            // 1. Upload file to Storage Bucket
            const { error: uploadError } = await supabase.storage
                .from("band-documents")
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw new Error(uploadError.message)

            // 2. Insert record in tracking table
            const { error: dbError } = await supabase
                .from("group_song_documents")
                .insert({
                    group_id: groupId,
                    song_id: songId, // Note: For consistency, passing the `group_song.id` as songId
                    file_path: filePath,
                    file_type: file.type || "application/octet-stream",
                    name: file.name,
                    uploaded_by: userId
                })

            if (dbError) {
                // Cleanup orphaned file if DB insert fails
                await supabase.storage.from("band-documents").remove([filePath])
                throw new Error(dbError.message)
            }

            router.refresh()
            if (fileInputRef.current) fileInputRef.current.value = "" // Reset input
        } catch (err: any) {
            console.error("Upload error:", err)
            setError(err.message || "Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.mp3,.wav,.m4a,.doc,.docx,.txt"
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full border-dashed border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800 text-zinc-400 hover:text-white h-16 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
                {isUploading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</>
                ) : (
                    <>
                        <UploadCloud className="h-5 w-5 text-indigo-500" />
                        <span className="font-medium">Upload PDF, MP3, WAV...</span>
                    </>
                )}
            </Button>
            {error && (
                <div className="mt-3 text-red-400 text-sm flex items-center gap-2 bg-red-950/20 p-2 rounded-lg border border-red-900/50">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
            <p className="text-[10px] text-zinc-600 font-medium text-center mt-2 uppercase tracking-wider">
                Max 15MB • Secured & Private to your band
            </p>
        </div>
    )
}
