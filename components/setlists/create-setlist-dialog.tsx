"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Loader2, ListMusic } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const setlistSchema = z.object({
    name: z.string().min(2, { message: "Setlist name must be at least 2 characters" }),
})

export function CreateSetlistDialog({
    groupId,
    variant = "primary"
}: {
    groupId: string,
    variant?: "primary" | "secondary"
}) {
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm<z.infer<typeof setlistSchema>>({
        resolver: zodResolver(setlistSchema),
        defaultValues: {
            name: "",
        },
    })

    async function onSubmit(values: z.infer<typeof setlistSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const { data, error: setlistError } = await supabase
                .from("setlists")
                .insert({
                    name: values.name,
                    group_id: groupId
                })
                .select()
                .single()

            if (setlistError) throw setlistError

            router.refresh()
            setOpen(false)
            form.reset()
            router.push(`/${groupId}/setlists/${data.id}`)
        } catch (err: any) {
            setError(err.message || "Failed to create setlist")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === "primary" ? (
                    <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 h-auto py-4 px-6 font-bold">
                        <Plus className="h-5 w-5 mr-2" /> New Setlist
                    </Button>
                ) : (
                    <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-white rounded-xl px-8 h-12 hover:bg-zinc-700 transition-colors">
                        Create your first setlist
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white p-6 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Create Setlist</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Give your setlist a name. You can assign it to a concert later.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Setlist Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <ListMusic className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                placeholder="Live at Madison Square Garden"
                                                {...field}
                                                className="bg-zinc-900 border-zinc-800 text-white pl-10 focus:ring-indigo-500 h-12"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <div className="text-sm font-medium text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/50">
                                {error}
                            </div>
                        )}

                        <DialogFooter className="sm:justify-start">
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/10"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Create & Start Building
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
