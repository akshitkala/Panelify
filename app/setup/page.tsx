"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react"

const SETUP_STEPS = [
    "Creating backup branch...",
    "Generating content.json...",
    "Refactoring JSX components...",
    "Committing changes to GitHub...",
    "Finalizing site configuration..."
]

export default function SetupPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const runSetup = async () => {
            setError(null)
            const repo = sessionStorage.getItem("selected_repo")
            const schemaData = sessionStorage.getItem("confirmed_schema")
            const defaultBranch = sessionStorage.getItem("default_branch") || "main"

            if (!repo || !schemaData) {
                router.push("/connect")
                return
            }

            let schema
            try {
                schema = JSON.parse(schemaData)
            } catch (e) {
                setError("Invalid schema found in session. Please start over.")
                return
            }

            try {
                // Step 1: Backup
                setCurrentStep(0)
                const backupRes = await fetch("/api/setup/backup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repo_full_name: repo, default_branch: defaultBranch })
                })
                if (!backupRes.ok) {
                    const text = await backupRes.text()
                    throw new Error(`Backup failed: ${text || backupRes.statusText}`)
                }
                setCompletedSteps(prev => [...prev, 0])

                // Step 2: Fetch files for refactoring
                setCurrentStep(1)
                const filesRes = await fetch("/api/scan/files", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repo_full_name: repo })
                })
                if (!filesRes.ok) {
                    const text = await filesRes.text()
                    throw new Error(`Failed to fetch files for refactoring: ${text || filesRes.statusText}`)
                }
                const files = await filesRes.json()
                setCompletedSteps(prev => [...prev, 1])

                // Step 3: Refactor
                setCurrentStep(2)
                const refactorRes = await fetch("/api/setup/refactor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ files, schema })
                })
                if (!refactorRes.ok) {
                    const text = await refactorRes.text()
                    throw new Error(`Refactoring failed: ${text || refactorRes.statusText}`)
                }
                const refactoredFiles = await refactorRes.json()
                setCompletedSteps(prev => [...prev, 2])

                // Step 4: Commit
                setCurrentStep(3)
                const commitRes = await fetch("/api/setup/commit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        repo_full_name: repo,
                        branch: defaultBranch,
                        files: refactoredFiles,
                        content_json: JSON.stringify(schema, null, 2)
                    })
                })
                if (!commitRes.ok) {
                    const text = await commitRes.text()
                    throw new Error(`Commit failed: ${text || commitRes.statusText}`)
                }
                setCompletedSteps(prev => [...prev, 3])

                // Step 5: Finalize
                setCurrentStep(4)
                setCompletedSteps(prev => [...prev, 4])

                setTimeout(() => {
                    router.push("/dashboard")
                }, 2000)
            } catch (error: any) {
                console.error("Setup failed:", error)
                setError(error.message || "An unexpected error occurred during setup.")
            }
        }

        runSetup()
    }, [router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-display font-bold">Setting up your panel</h1>
                    <p className="text-muted-foreground">We're connecting your code to the CMS editor.</p>
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
                                    onClick={() => router.push("/confirm")}
                                    className="w-full py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                                >
                                    Go back to confirmation
                                </button>
                            </div>
                        ) : (
                            SETUP_STEPS.map((step, i) => (
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

                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(completedSteps.length / SETUP_STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
