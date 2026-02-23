"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, PartyPopper } from "lucide-react"

const PUBLISH_STEPS = [
    "Reading latest repository state...",
    "Merging pending changes...",
    "Committing to main branch...",
    "Triggering platform build...",
    "Polling for deployment live..."
]

export default function PublishingPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        const runPublish = async () => {
            const repo = sessionStorage.getItem("selected_repo")
            const changes = JSON.parse(sessionStorage.getItem("pending_changes") || "{}")

            if (!repo || Object.keys(changes).length === 0) {
                router.push("/dashboard")
                return
            }

            try {
                // Step 1: Read state
                setCurrentStep(0)
                await new Promise(r => setTimeout(r, 1000)) // Simulate fast read
                setCompletedSteps(prev => [...prev, 0])

                // Step 2 & 3: Merge & Commit
                setCurrentStep(1)
                const res = await fetch("/api/content/write", {
                    method: "POST",
                    body: JSON.stringify({ repo_full_name: repo, branch: "main", changes })
                })
                setCompletedSteps(prev => [...prev, 1, 2])

                // Step 4 & 5: Build & Poll
                setCurrentStep(3)
                await new Promise(r => setTimeout(r, 2000))
                setCompletedSteps(prev => [...prev, 3])

                setCurrentStep(4)
                // In dummy mode, we wait 3 seconds for "deploy"
                await new Promise(r => setTimeout(r, 3000))
                setCompletedSteps(prev => [...prev, 4])

                // Success!
                setIsSuccess(true)
                sessionStorage.removeItem("pending_changes")
            } catch (error) {
                console.error("Publish failed:", error)
            }
        }

        runPublish()
    }, [router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 text-center transition-all duration-700">
                {isSuccess ? (
                    <div className="space-y-6 flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center">
                            <PartyPopper className="h-10 w-10 text-accent-green" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-display font-bold">Successfully Published!</h1>
                            <p className="text-muted-foreground">Your changes are now live on production.</p>
                        </div>
                        <Button size="lg" className="w-full" onClick={() => router.push("/dashboard")}>
                            Return to Dashboard
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-display font-bold">Publishing your changes</h1>
                            <p className="text-muted-foreground">We're updating your GitHub repo and deploying to production.</p>
                        </div>

                        <Card className="bg-card/50 border-border">
                            <CardContent className="p-6 space-y-6 text-left">
                                {PUBLISH_STEPS.map((step, i) => (
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

                        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${(completedSteps.length / PUBLISH_STEPS.length) * 100}%` }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function Button({ children, className, onClick, size }: any) {
    return (
        <button
            onClick={onClick}
            className={`bg-primary text-white rounded-lg flex items-center justify-center font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${size === 'lg' ? 'h-12' : 'h-10'} ${className}`}
        >
            {children}
        </button>
    )
}
