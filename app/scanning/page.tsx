"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

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

    useEffect(() => {
        if (!repo) {
            router.push("/connect")
            return
        }

        const runScan = async () => {
            try {
                // Step 1 & 2: Fetch files
                setCurrentStep(0)
                const filesRes = await fetch("/api/scan/files", {
                    method: "POST",
                    body: JSON.stringify({ repo_full_name: repo })
                })
                const files = await filesRes.json()
                setCompletedSteps(prev => [...prev, 0, 1])
                setCurrentStep(2)

                // Step 3 & 4: Analyze
                const analyzeRes = await fetch("/api/scan/analyze", {
                    method: "POST",
                    body: JSON.stringify({ files, repo_full_name: repo })
                })
                const fields = await analyzeRes.json()
                setCompletedSteps(prev => [...prev, 2, 3])
                setCurrentStep(4)

                // Step 5: Finalize
                setCompletedSteps(prev => [...prev, 4])

                // Save fields to session storage for the confirmation screen
                sessionStorage.setItem("scanned_fields", JSON.stringify(fields))
                sessionStorage.setItem("selected_repo", repo)

                setTimeout(() => {
                    router.push("/confirm")
                }, 1000)
            } catch (error) {
                console.error("Scan failed:", error)
                // In a real app, show error state
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
                        {SCAN_STEPS.map((step, i) => (
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
                        ))}
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
