"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit3, ExternalLink, Globe, Layout, Rocket, Settings } from "lucide-react"

export default function DashboardPage() {
    const router = useRouter()
    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const repo = typeof window !== 'undefined' ? sessionStorage.getItem("selected_repo") : null

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/content/read?repo_full_name=${repo}`)
                const data = await res.json()
                if (data.content) {
                    setContent(data.content)
                }
            } catch (error) {
                console.error("Dashboard load failed:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchContent()
    }, [repo, router])

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>

    const sections = content ? Object.keys(content) : []

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/30 p-6 hidden md:flex flex-col gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">◈</span>
                    </div>
                    <span className="font-display font-bold text-xl">Panelify</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <Button variant="secondary" className="justify-start gap-2">
                        <Layout className="h-4 w-4" /> Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2 text-muted-foreground">
                        <Settings className="h-4 w-4" /> Settings
                    </Button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 space-y-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-display font-bold">Your Panel</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm font-mono truncate max-w-[200px]">{repo}</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase">Vercel</Badge>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" /> View Site
                        </Button>
                        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => router.push("/preview")}>
                            <Rocket className="h-4 w-4" /> Review & Publish
                        </Button>
                    </div>
                </header>

                <section className="space-y-6">
                    <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-primary" /> Editable Sections
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.map(section => (
                            <Card
                                key={section}
                                className="group cursor-pointer hover:border-primary/50 transition-all bg-card/50"
                                onClick={() => router.push(`/edit/${section}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="capitalize">{section}</CardTitle>
                                    <CardDescription>
                                        {Object.keys(content[section]).length} editable fields
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="h-32 rounded-lg bg-secondary/50 border border-dashed border-border flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                                        <Edit3 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
