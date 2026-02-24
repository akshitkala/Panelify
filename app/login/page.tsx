"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
    const supabase = createClient()

    const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${window.location.origin}/api/auth/callback`,
            scopes: 'repo user:email',
        },
    })

    if (error) {
        console.error("Login failed:", error.message)
    }
}

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl relative z-10">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,106,255,0.4)]">
                        <span className="text-2xl font-bold text-white">◈</span>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-display font-bold tracking-tight">Panelify</CardTitle>
                        <CardDescription className="text-muted-foreground text-base">
                            Give your clients a superpower. <br /> Connect your GitHub to begin.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <Button
                        onClick={handleLogin}
                        className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        <Github className="mr-2 h-5 w-5" />
                        Sign in with GitHub
                    </Button>

                    <p className="mt-8 text-center text-xs text-muted-foreground/60">
                        By signing in, you agree to our Terms of Service <br /> and Privacy Policy.
                    </p>
                </CardContent>
            </Card>

            {/* Beta badge decoration */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">Now in beta — Vercel + Netlify</span>
            </div>
        </div>
    )
}
