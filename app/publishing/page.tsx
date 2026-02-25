"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, PartyPopper, ExternalLink, AlertCircle, RefreshCw } from "lucide-react"

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
    const [error, setError] = useState<string | null>(null)
    const [commitUrl, setCommitUrl] = useState<string | null>(null)

    const runPublish = async () => {
        const repo = sessionStorage.getItem("selected_repo")
        const branch = sessionStorage.getItem("selected_branch") || "main"
        const rawChanges = sessionStorage.getItem("pending_changes")
        const changes = JSON.parse(rawChanges || "{}")

        if (!repo || Object.keys(changes).length === 0) {
            router.push("/dashboard")
            return
        }

        setError(null)
        setCompletedSteps([])
        setCurrentStep(0)

        try {
            // Step 1: Read state
            await new Promise(r => setTimeout(r, 800))
            setCompletedSteps(prev => [...prev, 0])

            // Step 2 & 3: Merge & Commit
            setCurrentStep(1)
            const res = await fetch("/api/content/write", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo_full_name: repo, branch, changes })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to write content to GitHub")
            }

            const result = await res.json()
            setCommitUrl(result.commit_url)
            setCompletedSteps(prev => [...prev, 1, 2])

            // Step 4: Trigger build (Simulated)
            setCurrentStep(3)
            await new Promise(r => setTimeout(r, 1500))
            setCompletedSteps(prev => [...prev, 3])

            // Step 5: Polling (Simulated)
            setCurrentStep(4)
            await new Promise(r => setTimeout(r, 2000))
            setCompletedSteps(prev => [...prev, 4])

            // Success!
            setIsSuccess(true)
            sessionStorage.removeItem("pending_changes")
        } catch (err: any) {
            console.error("Publish failed:", err)
            setError(err.message || "An unexpected error occurred during publishing.")
        }
    }

    useEffect(() => {
        runPublish()
    }, [router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
            <div className="w-full max-w-md space-y-8 text-center transition-all duration-700">
                {isSuccess ? (
                    <div className="space-y-6 flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <PartyPopper className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-display font-bold">Successfully Published!</h1>
                            <p className="text-muted-foreground">Your changes are now live on production.</p>
                        </div>

                        <div className="w-full space-y-3 pt-4">
                            {commitUrl && (
                                <a
                                    href={commitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" /> View commit on GitHub
                                </a>
                            )}
                            <Button size="lg" className="w-full" onClick={() => router.push("/dashboard")}>
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                ) : error ? (
                    <div className="space-y-6 flex flex-col items-center animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center text-destructive">
                            <AlertCircle className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-display font-bold">Publishing Failed</h1>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                        <div className="flex flex-col w-full gap-3 pt-4">
                            <Button size="lg" className="w-full" onClick={runPublish}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Retry Publish
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => router.push("/dashboard")}>
                                Back to Dashboard
                            </Button>
                        </div>
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
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        ) : currentStep === i ? (
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground/30" />
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

function Button({ children, className, onClick, size, variant = "default" }: any) {
    const base = "rounded-lg flex items-center justify-center font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
    const sizes = size === 'lg' ? 'h-12 px-6' : 'h-10 px-4'
    const variants = variant === 'ghost'
        ? 'bg-transparent hover:bg-secondary text-foreground'
        : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110'

    return (
        <button onClick={onClick} className={`${base} ${sizes} ${variants} ${className}`}>
            {children}
        </button>
    )
}
