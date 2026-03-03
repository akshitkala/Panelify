"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Settings } from "lucide-react"

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        sessionStorage.removeItem("pending_changes")
        router.push("/")
    }

    // Don't show header on landing page, login, or editor (immersive mode)
    if (pathname === "/" || pathname === "/login" || pathname?.startsWith("/edit")) return null

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border py-3">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                >
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">◈</span>
                    </div>
                    <span className="font-display font-bold text-lg tracking-tight">Panelify</span>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground gap-2"
                        onClick={() => router.push("/dashboard")}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Button>
                    <div className="h-4 w-[1px] bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive gap-2"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>
    )
}
