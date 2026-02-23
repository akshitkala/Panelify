"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

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

    useEffect(() => {
        const runSetup = async () => {
            const repo = sessionStorage.getItem("selected_repo")
            const schema = JSON.parse(sessionStorage.getItem("confirmed_schema") || "{}")
            const fields = JSON.parse(sessionStorage.getItem("scanned_fields") || "[]")

            if (!repo || !schema) {
                router.push("/connect")
                return
            }

            try {
                // Step 1: Backup
                setCurrentStep(0)
                await fetch("/api/setup/backup", {
                    method: "POST",
                    body: JSON.stringify({ repo_full_name: repo, default_branch: "main" })
                })
                setCompletedSteps(prev => [...prev, 0])

                // Step 2-3: Refactor (fetches files first, normally we'd pass them from scanning storage)
                setCurrentStep(1)
                const filesRes = await fetch("/api/scan/files", {
                    method: "POST",
                    body: JSON.stringify({ repo_full_name: repo })
                })
                const files = await filesRes.json()
                setCompletedSteps(prev => [...prev, 1])

                setCurrentStep(2)
                const refactorRes = await fetch("/api/setup/refactor", {
                    method: "POST",
                    body: JSON.stringify({ files, schema })
                })
                const refactoredFiles = await refactorRes.json()
                setCompletedSteps(prev => [...prev, 2])

                // Step 4: Commit
                setCurrentStep(3)
                await fetch("/api/setup/commit", {
                    method: "POST",
                    body: JSON.stringify({
                        repo_full_name: repo,
                        branch: "main",
                        files: refactoredFiles,
                        content_json: JSON.stringify(schema, null, 2),
                        schema: schema
                    })
                })
                setCompletedSteps(prev => [...prev, 3])

                // Step 5: Finalize
                setCurrentStep(4)
                setCompletedSteps(prev => [...prev, 4])

                setTimeout(() => {
                    router.push("/dashboard")
                }, 2000)
            } catch (error) {
                console.error("Setup failed:", error)
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
                        {SETUP_STEPS.map((step, i) => (
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
                        style={{ width: `${(completedSteps.length / SETUP_STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
