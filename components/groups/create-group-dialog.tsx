"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Loader2, Music } from "lucide-react"

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

const groupSchema = z.object({
    name: z.string().min(2, { message: "Group name must be at least 2 characters" }),
})

export function CreateGroupDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<z.infer<typeof groupSchema>>({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: "",
        },
    })

    async function onSubmit(values: z.infer<typeof groupSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Create the group
            const { data: group, error: groupError } = await supabase
                .from("groups")
                .insert({
                    name: values.name,
                    created_by: user.id
                })
                .select()
                .single()

            if (groupError) throw groupError

            // 2. Create the membership as admin
            const { error: memberError } = await supabase
                .from("memberships")
                .insert({
                    user_id: user.id,
                    group_id: group.id,
                    role: 'admin'
                })

            if (memberError) throw memberError

            router.refresh()
            setOpen(false)
            form.reset()
            router.push(`/${group.id}`)
        } catch (err: any) {
            setError(err.message || "Failed to create group")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                    <Plus className="h-4 w-4 mr-2" /> Create New Group
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">New Band Space</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Create a workspace for your music group to collaborate.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-300">Band Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                placeholder="The Rolling Stones"
                                                {...field}
                                                className="bg-zinc-900 border-zinc-800 text-white pl-10 focus:ring-indigo-500"
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

                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-xl font-bold text-lg"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Launch Workspace
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
