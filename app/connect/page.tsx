"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Github, RefreshCw, CheckCircle2 } from "lucide-react"

interface Repo {
    name: string
    full_name: string
    description: string | null
    platform?: 'vercel' | 'netlify' | 'unknown'
}

export default function ConnectRepoPage() {
    const router = useRouter()
    const [repos, setRepos] = useState<Repo[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
    const [detecting, setDetecting] = useState(false)

    useEffect(() => {
        fetchRepos()
    }, [])

    const fetchRepos = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/repos")
            const data = await res.json()
            if (Array.isArray(data)) {
                setRepos(data)
            }
        } catch (error) {
            console.error("Failed to fetch repos:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = async (repo: Repo) => {
        setSelectedRepo(repo)
        setDetecting(true)

        try {
            // In a real app, we'd fetch the repo tree to check for vercel.json/netlify.toml
            // For this demo, we'll call detection with an empty file list for now
            // which will trigger the deployment check in our API.
            const res = await fetch("/api/platform/detect", {
                method: "POST",
                body: JSON.stringify({ repo_full_name: repo.full_name, repo_files: [] })
            })
            const { platform } = await res.json()

            setSelectedRepo(prev => prev ? { ...prev, platform } : null)
        } catch (error) {
            console.error("Platform detection failed:", error)
        } finally {
            setDetecting(false)
        }
    }

    const filteredRepos = repos.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-display font-bold">Connect your repo</h1>
                        <p className="text-muted-foreground">Select the Next.js repository you want to edit.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchRepos} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </header>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories..."
                        className="pl-10 h-12 bg-card/50 border-border"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="animate-pulse bg-card/50 border-border">
                                <div className="h-24" />
                            </Card>
                        ))
                    ) : filteredRepos.length > 0 ? (
                        filteredRepos.map((repo) => (
                            <Card
                                key={repo.full_name}
                                className={`group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden ${selectedRepo?.full_name === repo.full_name ? 'border-primary ring-1 ring-primary' : 'bg-card/50 border-border'}`}
                                onClick={() => handleSelect(repo)}
                            >
                                <CardHeader className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Github className="h-4 w-4 text-muted-foreground" />
                                            <CardTitle className="text-base truncate max-w-[200px]">{repo.name}</CardTitle>
                                        </div>
                                        {selectedRepo?.full_name === repo.full_name && !detecting && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-1 h-5">{repo.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                {selectedRepo?.full_name === repo.full_name && (
                                    <div className="px-4 pb-4 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {detecting ? (
                                                <Badge variant="secondary" className="animate-pulse">Detecting...</Badge>
                                            ) : repo.platform ? (
                                                <Badge variant={repo.platform === 'unknown' ? 'destructive' : 'default'} className="capitalize bg-primary/20 text-primary border-primary/20">
                                                    {repo.platform}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        {!detecting && (
                                            <Button size="sm" onClick={(e) => {
                                                e.stopPropagation()
                                                router.push("/scanning")
                                            }}>
                                                Continue
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto">
                                <Github className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No repositories found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
