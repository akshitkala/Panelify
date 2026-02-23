"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Rocket, Eye, Monitor, Smartphone, CheckCircle2 } from "lucide-react"

export default function PreviewPage() {
    const router = useRouter()
    const [pendingChanges, setPendingChanges] = useState<any>(null)
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
    const repo = typeof window !== 'undefined' ? sessionStorage.getItem("selected_repo") : null

    useEffect(() => {
        const data = sessionStorage.getItem("pending_changes")
        if (data) {
            setPendingChanges(JSON.parse(data))
        }
    }, [])

    const handlePublish = () => {
        router.push("/publishing")
    }

    const changeCount = pendingChanges ? Object.values(pendingChanges).reduce((acc: number, section: any) => acc + Object.keys(section).length, 0) : 0

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="h-16 border-b border-border bg-card/30 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="font-display font-bold">Review Changes</span>
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
                            {changeCount} changes pending
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-border">
                    <Button
                        variant={device === 'desktop' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setDevice('desktop')}
                    >
                        <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={device === 'mobile' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setDevice('mobile')}
                    >
                        <Smartphone className="h-4 w-4" />
                    </Button>
                </div>

                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={handlePublish}>
                    <Rocket className="h-4 w-4" /> Publish Now
                </Button>
            </header>

            <div className="flex-1 bg-secondary/10 p-6 md:p-12 flex items-center justify-center">
                <div className={`transition-all duration-500 bg-white shadow-2xl rounded-xl overflow-hidden border border-border relative ${device === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-6xl h-full'}`}>
                    <div className="absolute top-0 left-0 right-0 h-10 bg-secondary/20 border-b border-border flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-red/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-green/40" />
                        </div>
                        <div className="mx-auto h-5 w-[60%] bg-background/50 rounded flex items-center px-3">
                            <span className="text-[10px] text-muted-foreground font-mono truncate">{repo}.vercel.app</span>
                        </div>
                    </div>

                    <div className="h-full pt-10 flex flex-col items-center justify-center text-center p-12 text-slate-900">
                        <div className="space-y-6">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">PREVIEW SUCCESSFUL</Badge>
                            <h2 className="text-4xl font-bold tracking-tight">Your changes are ready.</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                All {changeCount} modifications have been staged for deployment. Review the snapshot above and click publish to push to production.
                            </p>
                            <div className="flex flex-col items-center gap-3">
                                {Object.keys(pendingChanges || {}).map(section => (
                                    <div key={section} className="flex items-center gap-2 text-sm text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="capitalize">{section} updated</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
