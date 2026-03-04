"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Music, Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

const authSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    fullName: z.string().optional(),
})

export function AuthForm() {
    const searchParams = useSearchParams()
    const inviteEmail = searchParams.get("email") || ""
    const hasInvite = searchParams.get("invite") !== null

    const [isLogin, setIsLogin] = useState(!hasInvite) // Default to Sign Up if invited
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<z.infer<typeof authSchema>>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: inviteEmail,
            password: "",
            fullName: "",
        },
    })

    async function onSubmit(values: z.infer<typeof authSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                })
                if (error) throw error
            } else {
                const { error } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        data: {
                            full_name: values.fullName,
                        },
                    },
                })
                if (error) throw error
            }

            router.refresh()
            router.push("/")
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md border-zinc-800 bg-black/60 backdrop-blur-xl text-white shadow-2xl">
            {hasInvite && (
                <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white rounded-t-xl">
                    You've been invited to join a band! Please sign in or create an account to accept.
                </div>
            )}
            <CardHeader className="space-y-1 text-center mt-2">
                <div className="flex justify-center mb-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                        <Music className="h-8 w-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    {isLogin ? "Welcome back" : "Create an account"}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    {isLogin
                        ? "Enter your credentials to access your band spaces"
                        : "Join BandFlow to start orchestrating your music"}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!isLogin && (
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-300">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                {...field}
                                                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-300">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="m@example.com"
                                            type="email"
                                            {...field}
                                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-300">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                {...field}
                                                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-indigo-500 focus:border-indigo-500 pr-10 transition-all"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-400 hover:text-white hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">
                                                    {showPassword ? "Hide password" : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <Alert variant="destructive" className="bg-red-950/30 border-red-900 text-red-200">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 text-lg rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            {isLogin ? "Sign In" : "Sign Up"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/0 px-2 text-zinc-500">Or continue with</span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                </Button>
            </CardFooter>
        </Card>
    )
}
