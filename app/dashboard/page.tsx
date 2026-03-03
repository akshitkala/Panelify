"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit3, ExternalLink, Globe, Layout, LogOut, Rocket, Settings, Plus, ChevronRight, Monitor, Layers, History, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Site, SiteVersion } from "@/types"

export default function DashboardPage() {
    const router = useRouter()
    const supabase = createClient()

    const [sites, setSites] = useState<Site[]>([])
    const [selectedSite, setSelectedSite] = useState<Site | null>(null)
    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})

    const [activeTab, setActiveTab] = useState<'structure' | 'history'>('structure')
    const [versions, setVersions] = useState<SiteVersion[]>([])
    const [rollbackLoading, setRollbackLoading] = useState<string | null>(null)

    const fetchContent = async (repoName: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/content/read?repo_full_name=${repoName}`)
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

    const handleSiteSwitch = (site: Site) => {
        setSelectedSite(site)
        sessionStorage.setItem("selected_repo", site.repo_full_name)
        fetchContent(site.repo_full_name)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        sessionStorage.removeItem("pending_changes")
        sessionStorage.removeItem("selected_repo")
        sessionStorage.removeItem("scanned_fields")
        router.push("/login")
    }

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }

                const { data: sitesData, error } = await supabase
                    .from('sites')
                    .select('*')
                    .order('updated_at', { ascending: false })

                if (error) throw error
                setSites(sitesData || [])

                // Try to restore selection from session or pick latest
                const savedRepo = sessionStorage.getItem("selected_repo")
                const initialSite = savedRepo
                    ? (sitesData?.find(s => s.repo_full_name === savedRepo) || sitesData?.[0])
                    : sitesData?.[0]

                if (initialSite) {
                    setSelectedSite(initialSite)
                    sessionStorage.setItem("selected_repo", initialSite.repo_full_name)
                    fetchContent(initialSite.repo_full_name)
                } else {
                    setLoading(false)
                }
            } catch (error) {
                console.error("Failed to fetch sites:", error)
                setLoading(false)
            }
        }

        fetchSites()

        const raw = sessionStorage.getItem("pending_changes") || "{}"
        setPendingChanges(JSON.parse(raw))
    }, [router, supabase])

    const fetchVersions = async (siteId: string) => {
        const { data, error } = await supabase
            .from('site_versions')
            .select('*')
            .eq('site_id', siteId)
            .order('created_at', { ascending: false })

        if (!error) setVersions(data || [])
    }

    const handleRollback = async (version: SiteVersion) => {
        if (!selectedSite) return
        if (!confirm("Are you sure you want to rollback to this version? This will create a new commit on GitHub.")) return

        setRollbackLoading(version.id)
        try {
            const res = await fetch("/api/content/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repo_full_name: selectedSite.repo_full_name,
                    branch: selectedSite.default_branch,
                    changes: version.content_json,
                    is_rollback: true
                })
            })

            if (res.ok) {
                alert("Successfully rolled back!")
                fetchContent(selectedSite.repo_full_name)
                fetchVersions(selectedSite.id)
                setActiveTab('structure')
            } else {
                throw new Error("Rollback failed")
            }
        } catch (error) {
            console.error(error)
            alert("Rollback failed. Please try again.")
        } finally {
            setRollbackLoading(null)
        }
    }



    const sections = content ? Object.keys(content) : []
    const hasPending = (sectionName: string) => !!pendingChanges[sectionName]
    const changeCount = Object.keys(pendingChanges).length

    if (sites.length === 0 && !loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Monitor className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h1 className="text-3xl font-display font-bold">No Sites Connected</h1>
                    <p className="text-muted-foreground">Transform your Next.js project into a CMS-powered site. Start by connecting a repository.</p>
                </div>
                <Button size="lg" className="gap-2 px-8" onClick={() => router.push("/connect")}>
                    <Plus className="h-5 w-5" /> Connect Site
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-72 border-r border-border bg-card/30 p-6 hidden md:flex flex-col gap-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">◈</span>
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight">Panelify</span>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Your Sites</h3>
                    <nav className="flex flex-col gap-1">
                        {sites.map(site => (
                            <button
                                key={site.id}
                                onClick={() => {
                                    handleSiteSwitch(site)
                                    setActiveTab('structure')
                                }}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${selectedSite?.id === site.id
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${selectedSite?.id === site.id ? "bg-primary animate-pulse" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"}`} />
                                <span className="truncate flex-1 text-left">{site.repo_full_name.split('/')[1]}</span>
                                {selectedSite?.id === site.id && <ChevronRight className="h-4 w-4 opacity-50" />}
                            </button>
                        ))}
                    </nav>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground hover:bg-primary/5 hover:text-primary mt-2 group border border-dashed border-border/50 hover:border-primary/30"
                        onClick={() => router.push("/connect")}
                    >
                        <Plus className="h-4 w-4" /> Connect Repository
                    </Button>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50 flex flex-col gap-1">
                    <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4" /> General Settings
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="justify-start gap-2 text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                {selectedSite ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px] py-0 px-2 uppercase tracking-wider">Active Workspace</Badge>
                                </div>
                                <h1 className="text-4xl font-display font-bold tracking-tight">{selectedSite.repo_full_name.split('/')[1]}</h1>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                        <Globe className="h-3.5 w-3.5" />
                                        <span className="text-xs font-mono">{selectedSite.repo_full_name}</span>
                                    </div>
                                    <Badge variant="outline" className="bg-secondary/30 text-muted-foreground h-6">{selectedSite.default_branch}</Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedSite.vercel_url && (
                                    <Button variant="outline" className="gap-2 h-11 px-5 border-border/60" asChild>
                                        <a href={selectedSite.vercel_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" /> View Live
                                        </a>
                                    </Button>
                                )}
                                <Button
                                    size="lg"
                                    className="gap-2 h-11 px-6 shadow-xl shadow-primary/10 transition-transform active:scale-95"
                                    disabled={changeCount === 0}
                                    onClick={() => router.push("/publishing")}
                                >
                                    {changeCount > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            <Rocket className="h-4 w-4" />
                                            Publish {changeCount} Changes
                                        </div>
                                    ) : "No Pending Changes"}
                                </Button>
                            </div>
                        </header>

                        {/* Tabs */}
                        <div className="flex border-b border-border/40 gap-8">
                            <button
                                onClick={() => setActiveTab('structure')}
                                className={`pb-4 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'structure' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" /> Edit Structure
                                </div>
                                {activeTab === 'structure' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-4 text-sm font-bold tracking-tight transition-all relative ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <History className="h-4 w-4" /> Activity & History
                                </div>
                                {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in" />}
                            </button>
                        </div>

                        {activeTab === 'structure' ? (
                            <section className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-display font-semibold flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Layers className="h-5 w-5 text-primary" />
                                        </div>
                                        Site Structure
                                    </h2>
                                    <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-border/50 to-transparent hidden lg:block" />
                                    <span className="text-sm font-medium text-muted-foreground">{sections.length} Editable Sections</span>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="h-48 rounded-2xl bg-white/[0.03] border border-border/40 overflow-hidden">
                                                <div className="p-6 space-y-4">
                                                    <div className="h-6 w-24 bg-white/5 rounded animate-shimmer" />
                                                    <div className="h-4 w-32 bg-white/5 rounded animate-shimmer" />
                                                </div>
                                                <div className="px-6 pb-6">
                                                    <div className="h-28 bg-white/5 rounded-xl animate-shimmer" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sections.length === 0 ? (
                                            <div className="col-span-full h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-3xl bg-card/5 text-muted-foreground space-y-4">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                                                    <Layout className="h-8 w-8 opacity-20" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-foreground">No sections found</p>
                                                    <p className="text-sm">We couldn't detect any editable components in this site.</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => router.push(`/scanning?repo=${selectedSite.repo_full_name}`)}>
                                                    Full Rescan
                                                </Button>
                                            </div>
                                        ) : sections.map(section => (
                                            <Card
                                                key={section}
                                                className="group cursor-pointer hover:border-primary/50 hover:bg-white/[0.02] transition-all bg-card/40 border-border/40 overflow-hidden relative"
                                                onClick={() => router.push(`/edit/${section}`)}
                                            >
                                                {hasPending(section) && (
                                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 animate-pulse-glow">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Changed</span>
                                                    </div>
                                                )}
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="capitalize text-lg">{section}</CardTitle>
                                                    <CardDescription className="font-medium">
                                                        {Object.keys(content[section]).length} dynamic field{Object.keys(content[section]).length === 1 ? '' : 's'}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="relative h-28 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="relative bg-background/50 p-2.5 rounded-lg border border-border shadow-sm transform group-hover:-translate-y-1 transition-transform">
                                                            <Edit3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : (
                            <section className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-display font-semibold flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <History className="h-5 w-5 text-primary" />
                                        </div>
                                        Publishing History
                                    </h2>
                                    <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-border/50 to-transparent hidden lg:block" />
                                    <span className="text-sm font-medium text-muted-foreground">{versions.length} Total Versions</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {versions.length === 0 ? (
                                        <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-card/10 text-muted-foreground space-y-2">
                                            <History className="h-8 w-8 opacity-20" />
                                            <p className="font-medium">No publishing history yet.</p>
                                        </div>
                                    ) : (
                                        versions.map(version => (
                                            <div key={version.id} className="flex items-center justify-between p-6 bg-card/40 border border-border/40 rounded-2xl hover:border-border/60 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                                                        <Rocket className="h-5 w-5 text-primary opacity-60" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-bold">Version {version.commit_sha.substring(0, 7)}</p>
                                                            <Badge variant="outline" className="font-mono text-[10px] bg-secondary/30">{new Date(version.created_at).toLocaleString()}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Modified: {version.changes_summary?.join(', ') || 'General updates'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {version.commit_url && (
                                                        <Button variant="ghost" size="sm" asChild className="gap-2">
                                                            <a href={version.commit_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4" /> GitHub
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => handleRollback(version)}
                                                        disabled={rollbackLoading === version.id}
                                                    >
                                                        {rollbackLoading === version.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                                        Rollback
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                ) : null}
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
