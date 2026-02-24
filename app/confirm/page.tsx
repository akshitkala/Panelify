"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, ArrowRight, FileCode } from "lucide-react"

interface ScannedField {
    component: string
    field_id: string
    label: string
    type: 'text' | 'textarea' | 'image'
    current_value: string
    confidence: number
    confirmed?: boolean
}

export default function ConfirmPage() {
    const router = useRouter()
    const [fields, setFields] = useState<ScannedField[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const data = sessionStorage.getItem("scanned_fields")
        if (data) {
            try {
                const parsed = JSON.parse(data).map((f: any) => ({ ...f, confirmed: true }))
                setFields(parsed)
            } catch (e) {
                console.error("Failed to parse scanned fields:", e)
                setError("Failed to load scan results. Please try scanning again.")
            }
        } else {
            router.push("/connect")
        }
    }, [router])

    const toggleField = (index: number) => {
        setFields(prev => {
            const next = [...prev]
            next[index].confirmed = !next[index].confirmed
            return next
        })
    }

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)
        const confirmed = fields.filter(f => f.confirmed)
        const repo = sessionStorage.getItem("selected_repo")

        try {
            const res = await fetch("/api/scan/prepare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmed_fields: confirmed, repo_full_name: repo })
            })

            if (!res.ok) {
                const text = await res.text()
                console.error("Preparation failed:", res.status, text)
                throw new Error(`Server returned ${res.status}: ${text || 'Unknown error'}`)
            }

            const text = await res.text()
            if (!text) {
                throw new Error("API returned empty response")
            }

            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                console.error("JSON parse failed:", text)
                throw new Error("Invalid response format from server")
            }

            const { schema } = data
            if (!schema) {
                throw new Error("API response missing schema")
            }

            sessionStorage.setItem("confirmed_schema", JSON.stringify(schema))
            router.push("/setup")
        } catch (err: any) {
            console.error("Preparation failed:", err)
            setError(err.message || "Failed to prepare your setup. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const confirmedCount = fields.filter(f => f.confirmed).length

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-display font-bold">Review detected fields</h1>
                        <p className="text-muted-foreground">We found {fields.length} editable areas across your site. Uncheck any you want to skip.</p>
                    </div>
                    <Button
                        size="lg"
                        disabled={confirmedCount === 0 || loading}
                        onClick={handleConfirm}
                        className="shadow-lg shadow-primary/20"
                    >
                        Confirm {confirmedCount} Fields <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </header>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {fields.map((field, i) => (
                        <Card
                            key={`${field.component}-${field.field_id}-${i}`}
                            className={`transition-all ${field.confirmed ? 'bg-card/50 border-primary/30' : 'bg-secondary/20 border-border opacity-60'}`}
                            onClick={() => toggleField(i)}
                        >
                            <CardContent className="p-4 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${field.confirmed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <FileCode className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{field.label}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">{field.component}</Badge>
                                            {field.confidence < 0.85 && (
                                                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-medium">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Low confidence
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate max-w-[300px] md:max-w-md">
                                            Current: <span className="text-foreground/80">"{field.current_value}"</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant="secondary" className="hidden md:inline-flex capitalize">{field.type}</Badge>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${field.confirmed ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                                        {field.confirmed && <CheckCircle2 className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
