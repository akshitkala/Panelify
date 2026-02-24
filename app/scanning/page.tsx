"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react"

const SCAN_STEPS = [
    "Connecting to GitHub...",
    "Fetching component tree...",
    "Analyzing JSX structure...",
    "Extracting editable fields...",
    "Preparing confirmation report..."
]

export default function ScanningPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const repo = searchParams.get("repo")
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const runScan = async () => {
            setError(null)
            try {
                // Step 1: Fetch files
                setCurrentStep(0)
                const filesRes = await fetch("/api/scan/files", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repo_full_name: repo })
                })

                if (!filesRes.ok) {
                    const text = await filesRes.text()
                    throw new Error(`Failed to fetch files: ${text || filesRes.statusText}`)
                }
                const files = await filesRes.json()
                setCompletedSteps(prev => [...prev, 0, 1])
                setCurrentStep(2)

                // Step 2: Analyze
                const analyzeRes = await fetch("/api/scan/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ files, repo_full_name: repo })
                })

                if (!analyzeRes.ok) {
                    const text = await analyzeRes.text()
                    throw new Error(`Analysis failed: ${text || analyzeRes.statusText}`)
                }
                const fields = await analyzeRes.json()
                setCompletedSteps(prev => [...prev, 2, 3])
                setCurrentStep(4)

                // Step 3: Finalize
                setCompletedSteps(prev => [...prev, 4])

                // Save fields to session storage for the confirmation screen
                sessionStorage.setItem("scanned_fields", JSON.stringify(fields))
                sessionStorage.setItem("selected_repo", repo)

                setTimeout(() => {
                    router.push("/confirm")
                }, 1000)
            } catch (error: any) {
                console.error("Scan failed:", error)
                setError(error.message || "An unexpected error occurred during the scan.")
            }
        }

        runScan()
    }, [repo, router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-display font-bold">Scanning your site</h1>
                    <p className="text-muted-foreground">AI is reading your components to identify editable content.</p>
                </div>

                <Card className="bg-card/50 border-border">
                    <CardContent className="p-6 space-y-6">
                        {error ? (
                            <div className="space-y-4">
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                                <button
                                    onClick={() => router.push("/connect")}
                                    className="w-full py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                                >
                                    Go back and try again
                                </button>
                            </div>
                        ) : (
                            SCAN_STEPS.map((step, i) => (
                                <div key={i} className="flex items-center gap-4 transition-all">
                                    {completedSteps.includes(i) ? (
                                        <CheckCircle2 className="h-6 w-6 text-accent-green" />
                                    ) : currentStep === i ? (
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted" />
                                    )}
                                    <span className={`text-base ${currentStep === i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {step}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Progress bar decoration */}
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(124,106,255,0.5)]"
                        style={{ width: `${(completedSteps.length / SCAN_STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
