"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Github, Zap, Shield, Sparkles, Layout, Code2, Globe } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-white overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] -right-[10%] w-[400px] h-[400px] bg-accent-green/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-border py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(124,106,255,0.4)]">
              <span className="text-white font-bold">◈</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Panelify</span>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="hidden md:flex text-muted-foreground hover:text-white" onClick={() => router.push("/login")}>Sign In</Button>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => router.push("/login")}>
              Get Started <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
          <Badge variant="outline" className="py-1 px-4 border-primary/20 bg-primary/5 text-primary rounded-full animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <Sparkles className="mr-2 h-3 w-3" /> Zero-Config CMS for Next.js
          </Badge>

          <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tight max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Make your static sites <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent-green">dynamic.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Connect your GitHub repository. AI scans your JSX. We generate a visual CMS panel instantly. No database or credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/20" onClick={() => router.push("/login")}>
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-card/20 border-border hover:bg-card/40">
              <Github className="mr-2 h-5 w-5" /> View on GitHub
            </Button>
          </div>

          {/* Premium Terminal / Mockup */}
          <div className="w-full max-w-5xl mt-20 relative animate-in zoom-in duration-1000 delay-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-green opacity-20 blur-2xl rounded-[2rem]" />
            <div className="relative bg-[#0d0d0d] border border-border rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-8 border-b border-border bg-[#1a1a1a] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                </div>
                <div className="mx-auto text-[10px] uppercase tracking-widest text-[#555] font-mono">Panelify Virtual Engine</div>
              </div>
              <div className="p-8 font-mono text-sm space-y-2 text-left">
                <div className="flex gap-3">
                  <span className="text-primary">$</span>
                  <span className="text-white">panelify init blog-nextjs</span>
                </div>
                <div className="text-accent-green">✔ Authenticated via GitHub (OAuth 2.0)</div>
                <div className="text-accent-green">✔ Repository scan complete: Found 12 components</div>
                <div className="flex gap-3">
                  <span className="text-primary">⠋</span>
                  <span className="text-muted-foreground">AI analyzing components for editable content...</span>
                </div>
                <div className="text-white pl-6">⚡ Found section: <span className="text-primary">Hero</span> (Title, Subtitle, CTA)</div>
                <div className="text-white pl-6">⚡ Found section: <span className="text-primary">About</span> (Description, ProfileImage)</div>
                <div className="text-accent-green">✔ Babel refactoring complete: components/Header.jsx → content.json</div>
                <div className="text-accent-green pt-4">🚀 Panel ready at: panelify.io/dashboard</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Proof / Features */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Zero Config"
            description="We read your code and build the UI automatically. No manual field mapping required."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-primary" />}
            title="Git-Native"
            description="Your content stays in your repository. We commit changes directly to your branches."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6 text-primary" />}
            title="Free Tier Forever"
            description="Run on Vercel or Netlify free tiers. No credit card or database setup needed."
          />
        </div>
      </section>

      <footer className="py-12 border-t border-border text-center text-muted-foreground text-sm">
        <p>© 2026 Panelify Engine. Built for the non-technical superpower.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-card/10 border border-border/50 hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
