"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2, AlertCircle, Globe, Layout, ChevronRight, Search, Play } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ScanningPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const repo = searchParams.get("repo")

    const [pages, setPages] = useState<string[]>([])
    const [selectedPages, setSelectedPages] = useState<string[]>(['/'])
    const [scanning, setScanning] = useState(false)
    const [step, setStep] = useState<'detecting' | 'selecting' | 'scanning'>('detecting')
    const [error, setError] = useState<string | null>(null)
    const [siteUrl, setSiteUrl] = useState<string | null>(null)
    const [scannedResults, setScannedResults] = useState<any[]>([])

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const initialDetect = async () => {
            try {
                // 1. Get site URL if exists
                const { data: siteData } = await createClient()
                    .from('sites')
                    .select('vercel_url')
                    .eq('repo_full_name', repo)
                    .single()

                setSiteUrl(siteData?.vercel_url || null)

                // 2. Detect pages
                const res = await fetch("/api/scan/pages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repo_full_name: repo })
                })
                const data = await res.json()
                if (data.pages) {
                    setPages(data.pages)
                    setStep('selecting')
                } else {
                    throw new Error(data.error || "Failed to detect pages")
                }
            } catch (err: any) {
                setError(err.message)
            }
        }

        initialDetect()
    }, [repo, router])

    const startScan = async () => {
        setScanning(true)
        setStep('scanning')
        try {
            // In V2, we scan all files but group them by page in the next step
            // or we could filter files by page here. 
            // For now, let's stick to the bulk scan but improve the transition.

            const filesRes = await fetch("/api/scan/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo_full_name: repo })
            })
            const files = await filesRes.json()

            const analyzeRes = await fetch("/api/scan/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files, repo_full_name: repo })
            })
            const fields = await analyzeRes.json()

            sessionStorage.setItem("scanned_fields", JSON.stringify(fields))
            sessionStorage.setItem("selected_repo", repo!)

            setTimeout(() => router.push("/confirm"), 1000)
        } catch (err: any) {
            setError(err.message)
            setScanning(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
                    <CardContent className="p-8 text-center space-y-6">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Detection Failed</h2>
                            <p className="text-muted-foreground text-sm">{error}</p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">◈</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg leading-none">Smart Scanner v2</h1>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{repo}</p>
                    </div>
                </div>
                {step === 'selecting' && (
                    <Button className="gap-2 px-6 rounded-xl shadow-lg shadow-primary/20" onClick={startScan}>
                        <Play className="h-4 w-4 fill-current" />
                        Start Analysis
                    </Button>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Page Selection / Status */}
                <div className="w-[400px] border-r border-border bg-card/10 p-8 overflow-y-auto space-y-8">
                    {step === 'detecting' ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="relative">
                                <Search className="h-12 w-12 text-primary animate-pulse" />
                                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">Mapping Repository</h3>
                                <p className="text-sm text-muted-foreground max-w-[240px]">We're analyzing your project structure to find all available routes.</p>
                            </div>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Select Pages to Scan</h3>
                                <p className="text-xs text-muted-foreground">Pick the routes you want Panelify to make editable.</p>
                            </div>

                            <div className="space-y-2">
                                {pages.map(p => (
                                    <button
                                        key={p}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${selectedPages.includes(p)
                                            ? "bg-primary/10 border-primary/40"
                                            : "bg-white/5 border-border/40 hover:border-primary/30"
                                            }`}
                                        onClick={() => {
                                            if (selectedPages.includes(p)) setSelectedPages(selectedPages.filter(x => x !== p))
                                            else setSelectedPages([...selectedPages, p])
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedPages.includes(p) ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                                                }`}>
                                                <Layout className="h-4 w-4" />
                                            </div>
                                            <span className="font-mono text-sm font-medium">{p}</span>
                                        </div>
                                        {selectedPages.includes(p) ? (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground/20 group-hover:text-muted-foreground/40" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4 pt-4 border-t border-border/40">
                                <Button
                                    className="w-full gap-2 py-6 rounded-2xl shadow-lg shadow-primary/20 text-md font-bold"
                                    onClick={startScan}
                                    disabled={selectedPages.length === 0 || scanning}
                                >
                                    <Play className="h-5 w-5 fill-current" />
                                    Start Full Analysis
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                                    Scanning {selectedPages.length} routes
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="flex-1 bg-secondary/10 p-8 flex flex-col">
                    <div className="flex-1 rounded-2xl border border-border bg-white overflow-hidden shadow-2xl relative">
                        {scanning && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-6 text-white text-center">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">AI Analysis in Progress</h3>
                                    <p className="text-white/60 text-sm max-w-xs">Extracting content nodes using Gemini 1.5 Flash...</p>
                                </div>
                            </div>
                        )}

                        {siteUrl ? (
                            <div className="h-full flex flex-col">
                                <div className="h-10 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="h-6 w-[400px] bg-secondary/50 rounded-lg border border-border flex items-center px-3 gap-2">
                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground font-mono truncate">{siteUrl}{selectedPages[0]}</span>
                                        </div>
                                    </div>
                                </div>
                                <iframe
                                    src={`${siteUrl}${selectedPages[0] || '/'}`}
                                    className="flex-1 w-full border-none"
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center p-12">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                                    <Globe className="h-10 w-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">No Preview Available</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">Deploy your site to Vercel to see a live preview during scanning.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
