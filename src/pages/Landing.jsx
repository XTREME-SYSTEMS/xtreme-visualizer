import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import {
  Camera, FileText, Users, CalendarClock, CreditCard, Mic,
  ArrowRight, Check, Sparkles,
} from "lucide-react";

const HERO_IMG_1 = "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/6274d99eb_generated_image.png";
const HERO_IMG_2 = "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/f3b1e05b5_generated_image.png";
const HERO_IMG_3 = "https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/6a1c44e3e_generated_image.png";

const FEATURES = [
  { icon: Camera, title: "AI Floor Visualizer", desc: "Scan a garage, drop in finishes, and show customers a real-time preview of their new floor — right from your phone." },
  { icon: FileText, title: "Bids & Proposals", desc: "Turn measurements into accurate bids and branded, e-signable proposals in minutes, not hours." },
  { icon: Users, title: "CRM & Lead Generation", desc: "Capture leads, auto-scrape local prospects, and run AI-drafted follow-up sequences that book jobs." },
  { icon: CalendarClock, title: "Scheduling", desc: "Sync site visits and consultations straight to your Google Calendar with AI prep briefings." },
  { icon: CreditCard, title: "Payments & Invoices", desc: "Collect deposits at signature, send invoices, and run maintenance subscriptions — all in-app." },
  { icon: Mic, title: "AI Voice Agent", desc: "An AI receptionist answers calls, qualifies callers, and books appointments 24/7." },
];

const STEPS = [
  { n: "01", title: "Scan & visualize", desc: "Walk the site, scan the floor, and preview finishes live with the customer." },
  { n: "02", title: "Bid & propose", desc: "Generate a priced bid and a branded proposal the customer can e-sign on the spot." },
  { n: "03", title: "Close & get paid", desc: "Collect the deposit automatically at signature, then schedule the crew and track the job." },
];

export default function Landing() {
  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Xtreme Floor Visualizer" style={{ height: 34, width: "auto", objectFit: "contain" }} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(255,214,10,.10), transparent 70%)" }} />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for coating contractors
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Close more coating jobs.<br /><span className="text-primary">From first scan to signed proposal.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                The all-in-one platform for surface coating pros — AI visualizer, bids, proposals, CRM, scheduling, and payments. Run your whole business from your phone.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline"><Link to="/login">See the demo</Link></Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card to start</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Works on any phone</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 overflow-hidden rounded-2xl border border-border shadow-xl">
                <Image src={HERO_IMG_1} alt="Metallic epoxy floor" className="h-56 w-full sm:h-72" fittingType="fill" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
                <Image src={HERO_IMG_2} alt="Flake epoxy floor" className="h-32 w-full sm:h-40" fittingType="fill" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
                <Image src={HERO_IMG_3} alt="Metallic epoxy detail" className="h-32 w-full sm:h-40" fittingType="fill" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run the job</h2>
            <p className="mt-4 text-muted-foreground">One app replaces the dozen tools you're juggling today.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From scan to signature in three steps</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold tracking-widest text-primary">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start free. Upgrade when you're growing.</h2>
          <p className="mt-4 text-muted-foreground">Create your account, connect your Google and payments, and start closing jobs today. Pricing plans unlock inside the app.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/register">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Log in</Link></Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <img src="/logo.png" alt="Xtreme Floor Visualizer" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Xtreme Floor Visualizer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}