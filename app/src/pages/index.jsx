import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckSquare, 
  Users, 
  FileText, 
  Zap, 
  Home,
  Sparkles,
  Calendar,
  CheckCircle,
  Smartphone,
  Layers,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background select-none font-sans overflow-x-hidden font-normal">
      {/* 1. Sticky Navigation Bar (Top) */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <img src="/logo_tab_icon.png" alt="Flowbase Logo" className="h-8 w-auto" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Flowbase
            </span>
          </Link>

          {/* Navigation Links with smooth scroll (Pricing Removed) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="#features" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
              Features
            </Link>
            <Link 
              to="#security" 
              onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} 
              className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
              Security
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <Link to={isAuthenticated ? "/dashboard" : "/auth/login"}>
                <Button className="font-medium px-5 transition-base">
                  {isAuthenticated ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-4 w-4" /> Go to Dashboard
                    </span>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section (Top) */}
        <section className="relative container mx-auto px-4 py-20 sm:py-32 flex flex-col items-center justify-center text-center">
          {/* Subtle absolute positioned blurred gradient blob */}
          <div className="absolute left-1/2 top-1/3 -z-10 h-[350px] w-[350px] sm:h-[450px] sm:w-[450px] -translate-x-1/2 -translate-y-1/2 bg-primary/10 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-4xl space-y-6">
            <Badge className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full" variant="outline">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-xs font-medium tracking-tight">The Modern Project Engine for Engineers</span>
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] pb-2">
              Engineering Project
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Management, Simplified.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              The unified workspace where your developer team plans sprints, maps tasks with real-time Kanban boards, documents specs in rich Markdown, and ships high-quality code.
            </p>

            {/* Tightened Single High-Converting CTA */}
            <div className="pt-4 flex justify-center">
              <Link to={isAuthenticated ? "/dashboard" : "/auth/login"} className="w-full sm:w-auto flex justify-center">
                <Button size="lg" className="w-full sm:w-auto font-semibold px-8 h-12 gap-2 shadow-elevated transition-base">
                  {isAuthenticated ? "Go to Dashboard" : "Start for free"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground/80 font-medium">
                Free for small teams · Built with react & fast sync
              </p>
            )}
          </div>

          {/* Floating app dashboard window mockup */}
          <div className="w-full max-w-5xl mx-auto rounded-xl border border-border shadow-elevated overflow-hidden aspect-video bg-muted/20 backdrop-blur-sm relative mt-16 md:mt-24 transition-base hover:border-foreground/15 hover:shadow-elevated/10 select-none">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/75">flowbase.io/dashboard</div>
              <div className="w-12" />
            </div>

            {/* Window workspace simulation */}
            <div className="flex h-[calc(100%-41px)] w-full text-left font-sans">
              {/* Mock Sidebar */}
              <div className="w-1/5 border-r border-border bg-card p-4 hidden sm:block space-y-4">
                <div className="h-7 w-full rounded-md bg-muted/40" />
                <div className="space-y-2">
                  <div className="h-6 w-full rounded bg-primary/10 flex items-center px-2 gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="h-2 w-12 rounded bg-primary/20" />
                  </div>
                  <div className="h-6 w-full rounded bg-transparent flex items-center px-2 gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-2 w-16 rounded bg-muted-foreground/20" />
                  </div>
                  <div className="h-6 w-full rounded bg-transparent flex items-center px-2 gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-2 w-10 rounded bg-muted-foreground/20" />
                  </div>
                  <div className="h-6 w-full rounded bg-transparent flex items-center px-2 gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-2 w-14 rounded bg-muted-foreground/20" />
                  </div>
                </div>
              </div>

              {/* Mock Content area */}
              <div className="flex-1 bg-background/40 p-4 sm:p-6 space-y-5 overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-foreground/80" />
                    <div className="h-2.5 w-40 rounded bg-muted-foreground/30" />
                  </div>
                  <div className="h-7 w-20 rounded bg-primary/20 flex items-center justify-center">
                    <div className="h-2.5 w-10 rounded bg-primary/40 animate-pulse" />
                  </div>
                </div>

                {/* Simulated Columns */}
                <div className="flex gap-4 h-full">
                  <div className="w-1/2 sm:w-1/3 rounded-xl bg-muted/30 border border-border/20 p-2.5 space-y-2.5">
                    <div className="h-3 w-12 rounded bg-muted-foreground/45" />
                    <div className="rounded-lg border border-border bg-card p-3 shadow-card space-y-2">
                      <div className="h-3 w-full rounded bg-foreground/75" />
                      <div className="h-2 w-3/4 rounded bg-muted-foreground/25" />
                      <div className="flex justify-between items-center pt-1.5">
                        <div className="h-3.5 w-6 rounded bg-primary/10" />
                        <div className="h-4 w-4 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>

                  <div className="w-1/2 sm:w-1/3 rounded-xl bg-muted/30 border border-border/20 p-2.5 space-y-2.5">
                    <div className="h-3 w-16 rounded bg-muted-foreground/45" />
                    <div className="rounded-lg border border-border bg-card p-3 shadow-card space-y-2">
                      <div className="h-3 w-full rounded bg-foreground/75" />
                      <div className="h-2 w-1/2 rounded bg-muted-foreground/25" />
                      <div className="flex justify-between items-center pt-1.5">
                        <div className="h-3.5 w-8 rounded bg-blue-500/10" />
                        <div className="h-4 w-4 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>

                  <div className="w-1/3 rounded-xl bg-muted/30 border border-border/20 p-2.5 space-y-2.5 hidden sm:block">
                    <div className="h-3 w-8 rounded bg-muted-foreground/45" />
                    <div className="rounded-lg border border-border bg-card p-3 shadow-card space-y-2">
                      <div className="h-3 w-full rounded bg-foreground/75" />
                      <div className="h-2 w-2/3 rounded bg-muted-foreground/25" />
                      <div className="flex justify-between items-center pt-1.5">
                        <div className="h-3.5 w-10 rounded bg-green-500/10" />
                        <div className="h-4 w-4 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The Social Proof Strip */}
        <section className="border-y border-border/60 bg-muted/15 py-10">
          <div className="container mx-auto px-4 max-w-6xl text-center space-y-4">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Trusted by engineering students and developers from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-2 font-mono text-sm tracking-widest text-muted-foreground/60">
              <span className="font-extrabold hover:text-foreground/80 transition-colors">STANFORD UNI</span>
              <span className="font-extrabold hover:text-foreground/80 transition-colors">MIT MATH</span>
              <span className="font-extrabold hover:text-foreground/80 transition-colors">UC BERKELEY</span>
              <span className="font-extrabold hover:text-foreground/80 transition-colors">GEORGIA TECH</span>
            </div>
          </div>
        </section>

        {/* 4. Alternating Feature Sections (The Z-Pattern) */}
        <section id="features" className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl space-y-24 sm:space-y-36">
          {/* Feature 1 (Kanban) */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5 text-left max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
                <Layers className="h-4 w-4" />
                <span>Productive Boards</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Visual Sprint Planning
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Empower your team with a drag-and-drop Kanban board built specifically for technical sprint iteration. Track bugs, categorize features, assign owners, and manage state in real-time.
              </p>
              <ul className="space-y-2.5 pt-2">
                {["Real-time synchronization across developers", "Tag and scope issues dynamically", "Subtask tracking with inline progress bars"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Visual element on right */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-base hover:shadow-soft hover:-translate-y-1 select-none text-left">
              <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="font-bold text-sm">In Progress</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">2</span>
                </div>
              </div>
              <div className="space-y-3">
                {/* Task Card 1 */}
                <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 uppercase tracking-wider">High</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> June 12</span>
                  </div>
                  <h4 className="text-sm font-bold leading-snug">Integrate Redis Session Cache</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">Cache session state and dashboard statistics query results to decrease latency.</p>
                  <div className="flex items-center justify-between pt-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <div className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-muted text-[9px] flex items-center justify-center font-bold">JD</div>
                      <div className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">EL</div>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground border border-border px-2 py-0.5 rounded-md">Backend</span>
                  </div>
                </div>
                {/* Task Card 2 */}
                <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 uppercase tracking-wider">Medium</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> June 15</span>
                  </div>
                  <h4 className="text-sm font-bold leading-snug">Auth Filter Unit Tests</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">Write integration mock filters for JWT authentication token validation.</p>
                  <div className="flex items-center justify-between pt-1.5">
                    <div className="h-6 w-6 rounded-full bg-orange-500 text-[9px] text-white flex items-center justify-center font-bold">AS</div>
                    <span className="text-[10px] font-semibold text-muted-foreground border border-border px-2 py-0.5 rounded-md">Testing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 (Notes) */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Visual element on left */}
            <div className="order-2 lg:order-1 rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-base hover:shadow-soft hover:-translate-y-1 select-none text-left">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs font-semibold font-mono text-foreground/80">deploy_check.md</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-semibold uppercase tracking-wider">Saved</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border h-64 text-left font-sans">
                {/* Left raw editor mockup */}
                <div className="p-4 bg-muted/15 font-mono text-[10px] sm:text-[11px] leading-relaxed space-y-2.5 overflow-hidden text-muted-foreground">
                  <div><span className="text-primary font-bold"># Sprint Deploy Checklist</span></div>
                  <div><span className="text-muted-foreground">- [x] Run db migrations</span></div>
                  <div><span className="text-muted-foreground">- [x] Flush session cache</span></div>
                  <div><span className="text-muted-foreground">- [ ] Deploy build to vercel</span></div>
                  <div><span className="text-muted-foreground">- [ ] Trigger webhooks</span></div>
                  <div><br /></div>
                  <div><span className="text-primary font-bold">## Verification</span></div>
                  <div>Validate SSL status keys.</div>
                </div>
                {/* Right rendered markdown mockup */}
                <div className="p-4 bg-background overflow-hidden space-y-3">
                  <h4 className="text-sm font-bold tracking-tight text-foreground border-b border-border pb-1.5">Sprint Deploy Checklist</h4>
                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    <li className="flex items-center gap-2 text-foreground/80"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> <span>Run db migrations</span></li>
                    <li className="flex items-center gap-2 text-foreground/80"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> <span>Flush session cache</span></li>
                    <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border border-border shrink-0" /> <span className="opacity-65">Deploy build to vercel</span></li>
                    <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border border-border shrink-0" /> <span className="opacity-65">Trigger webhooks</span></li>
                  </ul>
                  <h5 className="text-[11px] font-bold text-foreground mt-3">Verification</h5>
                  <p className="text-[10px] text-muted-foreground leading-normal">Validate SSL status keys.</p>
                </div>
              </div>
            </div>

            {/* Text details on right */}
            <div className="order-1 lg:order-2 space-y-5 text-left max-w-lg lg:ml-auto">
              <div className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
                <FileText className="h-4 w-4" />
                <span>Markdown Docs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Integrated Notes & Specs
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Centralize documentation where the action takes place. Draft clean tech specs, sprint plans, and deployment logs directly inside your workspace. Our inline split-view editor renders Markdown instantly.
              </p>
              <ul className="space-y-2.5 pt-2">
                {["Dual pane Markdown formatting side-by-side", "Code snippet syntax formatting support", "Cross-link docs and tasks effortlessly"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 (PWA) */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5 text-left max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
                <Smartphone className="h-4 w-4" />
                <span>Always Connected</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                PWA & Mobile Ready
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Never fall out of sync. Install Flowbase directly onto your smartphone as a Progressive Web App. Enjoy fluid responsiveness, tap-focused interactive controls, and swift sync times.
              </p>
              <ul className="space-y-2.5 pt-2">
                {["Installable direct from major mobile browsers", "Optimized 40px touch interaction areas", "Intelligent push-alert notification panel"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual element on right */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition-base hover:shadow-soft hover:-translate-y-1 flex justify-center items-center select-none">
              <div className="w-56 h-[320px] rounded-[32px] border-[5px] border-foreground bg-background overflow-hidden relative shadow-elevated flex flex-col">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-foreground rounded-b-xl z-20 flex justify-center items-center">
                  <div className="w-7 h-1 bg-muted/30 rounded-full" />
                </div>
                {/* Screen Header */}
                <div className="bg-card pt-6 pb-2.5 px-4 border-b border-border flex justify-between items-center text-left">
                  <span className="font-extrabold text-[9px] tracking-tight text-foreground">Flowbase Mobile</span>
                  <Badge className="text-[7px] h-3.5 px-1 py-0" variant="secondary">PWA</Badge>
                </div>
                {/* Screen content */}
                <div className="flex-1 p-3 bg-muted/20 space-y-2.5 overflow-hidden text-left">
                  <div className="bg-card p-2.5 rounded-lg border border-border shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-semibold text-primary">Assigned to you</span>
                      <span className="text-[7px] text-muted-foreground font-mono">Today</span>
                    </div>
                    <h5 className="text-[10px] font-bold leading-tight">Index Database Clusters</h5>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-4 rounded-full bg-primary text-[7px] text-primary-foreground flex items-center justify-center font-bold">JD</div>
                      <span className="text-[8px] text-status-in-progress font-medium">In Progress</span>
                    </div>
                  </div>
                  
                  {/* Toast Mockup */}
                  <div className="bg-foreground text-background p-2.5 rounded-xl shadow-lg border border-border/10 space-y-1.5">
                    <div className="text-[8px] font-extrabold flex items-center gap-1 text-primary-foreground uppercase tracking-wider">
                      <Zap className="h-2.5 w-2.5 fill-primary text-primary" />
                      <span>New Notification</span>
                    </div>
                    <p className="text-[8px] text-background/80 leading-relaxed font-medium">David assigned you the task: "Write API Gateway Logger Middleware"</p>
                  </div>
                </div>
                {/* Mobile Tabbar Mockup */}
                <div className="h-9 border-t border-border bg-card px-6 flex justify-between items-center shrink-0">
                  <div className="h-3.5 w-3.5 rounded bg-primary/20" />
                  <div className="h-3.5 w-3.5 rounded bg-muted" />
                  <div className="h-3.5 w-3.5 rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Scrollable Section: Security (Pricing Removed) */}
        <section id="security" className="border-t border-border bg-muted/15 py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <div className="space-y-3 max-w-2xl mx-auto">
              <Badge className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full" variant="outline">
                Enterprise Grade Security
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Your Project Data, Fully Protected
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Security isn't an afterthought. We implement industry-leading encryption and authorization to keep your Capstone project files safe.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 text-left max-w-3xl mx-auto">
              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-card transition-base hover:shadow-soft">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Encryption</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">All database items, markdown notes, and user tokens are encrypted in transit via SSL and at rest using AES-256 standards.</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-card transition-base hover:shadow-soft">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Access Controls</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Control exactly who can view, create, move, or delete tasks on your Kanban boards with granular project memberships.</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-card transition-base hover:shadow-soft">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">OAuth Authorization</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Flowbase authenticates users securely via official Google OAuth APIs, preventing credential database leaks.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Bottom CTA */}
        <section className="relative border-t border-border/60 bg-muted/10 py-24 sm:py-32 overflow-hidden select-none">
          <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-primary/5 blur-[90px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Ready to streamline your workflow?
            </h2>
            <p className="mx-auto max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ditch the noise and heavy spreadsheets. Move into the unified collaborative dashboard built for developers.
            </p>
            <div className="pt-4">
              {!isLoading && (
                <Link to={isAuthenticated ? "/dashboard" : "/auth/login"}>
                  <Button size="lg" className="font-semibold px-10 h-12 gap-2 shadow-elevated transition-base">
                    {isAuthenticated ? "Go to Dashboard" : "Start For Free"}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Simplified Clean Footer (Pricing Removed) */}
      <footer className="border-t border-border bg-card/40 py-12 select-none text-left">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo_tab_icon.png" alt="Flowbase Logo" className="h-7 w-auto" />
              <span className="font-bold text-lg tracking-tight text-foreground">Flowbase</span>
            </div>
            
            {/* Elegant single row matching navigation */}
            <div className="flex flex-wrap justify-center gap-8">
              <Link 
                to="#features" 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                Features
              </Link>
              <Link 
                to="#security" 
                onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                Security
              </Link>
            </div>
          </div>
          
          <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/80">
            <p>© 2026 Flowbase. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
