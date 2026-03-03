"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, Save, Undo2, Image as ImageIcon, Loader2, Globe, Monitor, Smartphone, RotateCcw } from "lucide-react"
import { sendPreviewUpdate } from "@/lib/preview-bridge"
import { Site } from "@/types"

export default function SectionEditorPage() {
    const router = useRouter()
    const { section } = useParams()
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [site, setSite] = useState<Site | null>(null)
    const [fields, setFields] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

    const repo = typeof window !== 'undefined' ? sessionStorage.getItem("selected_repo") : null

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const fetchData = async () => {
            try {
                // 1. Fetch site settings (for vercel_url)
                const { data: siteData } = await createClient()
                    .from('sites')
                    .select('*')
                    .eq('repo_full_name', repo)
                    .single()

                setSite(siteData)

                // 2. Fetch current content
                const res = await fetch(`/api/content/read?repo_full_name=${repo}`)
                const data = await res.json()
                if (data.content && data.content[section as string]) {
                    setFields(data.content[section as string])
                }
            } catch (error) {
                console.error("Editor load failed:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [repo, section, router])

    const handleFieldChange = (key: string, value: string) => {
        const newFields = {
            ...fields,
            [key]: value
        }
        setFields(newFields)

        // Send update to iframe
        if (iframeRef.current) {
            sendPreviewUpdate(iframeRef.current, section as string, newFields)
        }
    }

    const [lastSaved, setLastSaved] = useState<string | null>(null)

    const handleSave = () => {
        setSaving(true)
        const pendingRaw = sessionStorage.getItem("pending_changes") || "{}"
        const pending = JSON.parse(pendingRaw)

        pending[section as string] = fields
        sessionStorage.setItem("pending_changes", JSON.stringify(pending))

        setTimeout(() => {
            setSaving(false)
            setLastSaved(new Date().toLocaleTimeString())
            setTimeout(() => setLastSaved(null), 3000)
        }, 600)
    }

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/dashboard")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-[1px] bg-border mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Editing Section</span>
                        <span className="font-display font-bold capitalize leading-none">{section}</span>
                    </div>
                    {lastSaved && (
                        <Badge variant="outline" className="ml-4 bg-accent-green/5 text-accent-green border-accent-green/20 animate-in fade-in zoom-in duration-500 py-1">
                            Draft Saved at {lastSaved}
                        </Badge>
                    )}
                </div>

                {/* Device Switcher */}
                <div className="hidden md:flex items-center bg-secondary/50 p-1 rounded-xl border border-border">
                    <Button
                        variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-3 rounded-lg gap-2"
                        onClick={() => setPreviewMode('desktop')}
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Desktop</span>
                    </Button>
                    <Button
                        variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-3 rounded-lg gap-2"
                        onClick={() => setPreviewMode('mobile')}
                    >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Mobile</span>
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => router.push("/dashboard")}>
                        Done
                    </Button>
                    <Button className="gap-2 min-w-[140px] rounded-xl shadow-lg shadow-primary/10" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Saving..." : "Save Draft"}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor Panel */}
                <div className="w-full md:w-[420px] border-r border-border p-8 overflow-y-auto bg-card/20 space-y-10 custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Controls</h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => window.location.reload()}>
                            <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="space-y-8 pb-12">
                        {Object.entries(fields).map(([key, value]) => {
                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            const isImage = key.includes('image') || (typeof value === 'string' && value.match(/\.(jpg|jpeg|png|webp|svg)$/i))
                            const isLong = typeof value === 'string' && value.length > 60

                            return (
                                <div key={key} className="space-y-3 group animate-in fade-in slide-in-from-left-2 duration-300">
                                    <label className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors block">{label}</label>
                                    {isImage ? (
                                        <div className="space-y-4">
                                            <div className="aspect-video rounded-2xl bg-secondary/30 border border-border/50 overflow-hidden relative group/img flex items-center justify-center">
                                                {value ? (
                                                    <img src={value as string} alt={label} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button size="sm" variant="secondary" className="gap-2 text-xs">
                                                        Change Image
                                                    </Button>
                                                </div>
                                            </div>
                                            <Input
                                                value={value as string}
                                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                                className="font-mono text-[10px] h-9 bg-card/50 border-border/40"
                                            />
                                        </div>
                                    ) : isLong ? (
                                        <Textarea
                                            value={value as string}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="min-h-[140px] resize-none bg-card/50 border-border/40 focus:border-primary/50 transition-all rounded-xl p-4 text-sm leading-relaxed"
                                        />
                                    ) : (
                                        <Input
                                            value={value as string}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="h-11 bg-card/50 border-border/40 focus:border-primary/50 transition-all rounded-xl px-4"
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="flex-1 bg-secondary/20 flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary-muted)_0%,_transparent_70%)] opacity-10 pointer-events-none" />

                    <div className={`transition-all duration-500 ease-in-out bg-card shadow-[0_0_100px_rgba(0,0,0,0.1)] border border-border/60 overflow-hidden relative flex flex-col ${previewMode === 'mobile' ? 'w-[375px] h-[760px] rounded-[3rem] border-[12px] border-card' : 'w-full h-full rounded-2xl'
                        }`}>
                        {/* Browser Top Bar (only desktop) */}
                        {previewMode === 'desktop' && (
                            <div className="h-10 border-b border-border bg-card flex items-center px-4 gap-6 shrink-0">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="h-6 w-[400px] bg-secondary/50 rounded-lg border border-border flex items-center px-3 gap-2">
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground font-mono truncate">{site?.vercel_url || "preview.panelify.app"}</span>
                                    </div>
                                </div>
                                <div className="w-16" />
                            </div>
                        )}

                        {/* Actual Iframe */}
                        <div className="flex-1 relative bg-white">
                            {site?.vercel_url ? (
                                <iframe
                                    ref={iframeRef}
                                    src={`${site.vercel_url}?preview=true`}
                                    className="w-full h-full border-none"
                                    onLoad={() => {
                                        // Send initial fields once loaded
                                        if (iframeRef.current) {
                                            sendPreviewUpdate(iframeRef.current, section as string, fields)
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-center p-12">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse">
                                        <Globe className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-display font-bold text-xl">Connecting Preview...</h4>
                                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">Make sure your site is deployed to Vercel to see live changes here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
