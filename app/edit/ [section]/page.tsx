"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Save, Undo2, Image as ImageIcon, Loader2 } from "lucide-react"

export default function SectionEditorPage() {
    const router = useRouter()
    const { section } = useParams()
    const [fields, setFields] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const repo = typeof window !== 'undefined' ? sessionStorage.getItem("selected_repo") : null

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const fetchSectionContent = async () => {
            try {
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

        fetchSectionContent()
    }, [repo, section, router])

    const handleFieldChange = (key: string, value: string) => {
        setFields((prev: any) => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = () => {
        setSaving(true)
        // Store in pending changes session storage for publish flow
        const pendingRaw = sessionStorage.getItem("pending_changes") || "{}"
        const pending = JSON.parse(pendingRaw)

        pending[section as string] = fields
        sessionStorage.setItem("pending_changes", JSON.stringify(pending))

        setTimeout(() => {
            setSaving(false)
            router.push("/dashboard")
        }, 800)
    }

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="h-16 border-b border-border bg-card/30 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Editing section:</span>
                        <span className="font-display font-bold capitalize">{section}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="gap-2" onClick={() => router.push("/dashboard")}>
                        <Undo2 className="h-4 w-4" /> Discard
                    </Button>
                    <Button className="gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor Panel */}
                <div className="w-full md:w-[400px] border-r border-border p-6 overflow-y-auto bg-card/10 space-y-8">
                    <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Controls</h3>

                    <div className="space-y-6">
                        {Object.entries(fields).map(([key, value]) => {
                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            const isImage = key.includes('image') || (value as string).match(/\.(jpg|jpeg|png|webp|svg)$/i)
                            const isLong = (value as string).length > 60

                            return (
                                <div key={key} className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{label}</label>
                                    {isImage ? (
                                        <div className="space-y-4">
                                            <div className="aspect-video rounded-lg bg-secondary/50 border border-border overflow-hidden flex items-center justify-center">
                                                {/* Fake preview */}
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <Input
                                                value={value as string}
                                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    ) : isLong ? (
                                        <Textarea
                                            value={value as string}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="min-h-[120px] resize-none"
                                        />
                                    ) : (
                                        <Input
                                            value={value as string}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="flex-1 bg-secondary/10 flex items-center justify-center p-12">
                    <Card className="w-full h-full border-border bg-card shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-8 border-b border-border bg-secondary/30 flex items-center px-4 gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-red/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-green/40" />
                            <div className="ml-4 h-4 w-64 bg-background/50 rounded-full border border-border" />
                        </div>
                        <CardContent className="h-full pt-20 flex flex-col items-center justify-center text-center space-y-6">
                            <Badge className="bg-primary/20 text-primary border-primary/20">LIVE PREVIEW</Badge>
                            <h4 className="text-4xl font-display font-bold max-w-2xl">
                                {fields.title || fields.name || "Preview Mode"}
                            </h4>
                            <p className="text-muted-foreground max-w-xl text-lg">
                                {fields.subtitle || fields.description || fields.body || "Your content changes appear here in real-time as you type."}
                            </p>
                            {fields.cta && <Button size="lg">{fields.cta}</Button>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
