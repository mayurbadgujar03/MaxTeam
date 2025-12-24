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
  Target,
  Clock,
  TrendingUp,
  Shield,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            className="transition-opacity hover:opacity-80"
          >
            <img src="/logo_tab_icon.png" alt="Flowbase" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button className="gap-2">
                      <Home className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth/login">
                      <Button variant="ghost">Sign in</Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button>Get Started</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              Trusted by teams worldwide
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Where teams turn
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ideas into reality
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-2xl text-xl text-muted-foreground sm:text-2xl">
              Stop juggling tools. Start shipping projects.
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
              The all-in-one workspace where your team plans, tracks, and delivers 
              exceptional work—without the chaos of scattered tools and endless meetings.
            </p>
            {!isLoading && (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="w-full gap-2 px-8 sm:w-auto">
                      <Home className="h-5 w-5" />
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth/register" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full gap-2 px-8">
                        Start free today
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/auth/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full px-8">
                        Sign in
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required · Free forever for small teams
              </p>
            )}
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="border-y bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 text-center md:grid-cols-3">
              <div>
                <div className="mb-2 text-4xl font-bold">10,000+</div>
                <div className="text-sm text-muted-foreground">Active teams</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold">500K+</div>
                <div className="text-sm text-muted-foreground">Projects completed</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground">Customer satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section - How It Works */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              From chaos to clarity in minutes
            </h2>
            <p className="mb-16 text-lg text-muted-foreground">
              We've reimagined project management from the ground up. 
              Here's how we help teams work better together.
            </p>
          </div>

          <div className="mx-auto max-w-5xl space-y-24">
            {/* Step 1 */}
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <Target className="h-4 w-4" />
                  Step 1: Organize
                </div>
                <h3 className="mb-4 text-3xl font-bold">
                  Capture every idea, never lose track
                </h3>
                <p className="mb-6 text-lg text-muted-foreground">
                  Create projects in seconds. Break them down into actionable tasks. 
                  Add notes, files, and context—everything your team needs lives in one place. 
                  No more scattered information across emails, chats, and docs.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">Unlimited projects and tasks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">Rich text notes and documentation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">Subtasks for granular planning</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-12 shadow-xl">
                  <LayoutDashboard className="mx-auto h-32 w-32 text-primary" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <div className="rounded-2xl border bg-gradient-to-br from-blue-500/5 to-blue-500/10 p-12 shadow-xl">
                  <Users className="mx-auto h-32 w-32 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-600">
                  <Users className="h-4 w-4" />
                  Step 2: Collaborate
                </div>
                <h3 className="mb-4 text-3xl font-bold">
                  Work together, even when apart
                </h3>
                <p className="mb-6 text-lg text-muted-foreground">
                  Invite your team with a click. Assign tasks, set priorities, and watch 
                  progress happen in real-time. Everyone stays in sync without the constant 
                  "What's the status?" messages.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-muted-foreground">Seamless team invitations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-muted-foreground">Task assignments and ownership</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-muted-foreground">Real-time updates across devices</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Step 3: Deliver
                </div>
                <h3 className="mb-4 text-3xl font-bold">
                  Ship faster with visual clarity
                </h3>
                <p className="mb-6 text-lg text-muted-foreground">
                  Track progress with intuitive Kanban boards. Move tasks from "To Do" to "Done" 
                  with satisfying simplicity. See bottlenecks before they become problems. 
                  Celebrate wins together.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-muted-foreground">Drag-and-drop Kanban boards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-muted-foreground">Progress tracking at a glance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-muted-foreground">Custom workflows that fit your process</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <div className="rounded-2xl border bg-gradient-to-br from-green-500/5 to-green-500/10 p-12 shadow-xl">
                  <TrendingUp className="mx-auto h-32 w-32 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Everything you need. Nothing you don't.
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features wrapped in a beautiful, intuitive interface.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <CheckSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Smart Task Management</h3>
                <p className="text-muted-foreground">
                  Organize with Kanban boards, create subtasks, set priorities, and never 
                  miss a deadline with our intuitive task system.
                </p>
              </div>

              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Invite unlimited team members, assign roles, and work together 
                  seamlessly on projects that matter.
                </p>
              </div>

              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                  <FileText className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Rich Documentation</h3>
                <p className="text-muted-foreground">
                  Keep project notes, meeting minutes, and important docs right 
                  where you need them—no external tools required.
                </p>
              </div>

              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <Zap className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Built for speed. No lag, no loading—just instant access to your 
                  work, exactly when you need it.
                </p>
              </div>

              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 transition-colors group-hover:bg-orange-500/20">
                  <Clock className="h-7 w-7 text-orange-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Time Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor progress with deadlines, track task completion rates, 
                  and keep projects moving forward on schedule.
                </p>
              </div>

              <div className="group rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 transition-colors group-hover:bg-red-500/20">
                  <Shield className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted and protected. We take security seriously 
                  so you can focus on building great things.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold sm:text-5xl">
              {isAuthenticated 
                ? "Your workspace awaits" 
                : "Ready to transform how your team works?"}
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              {isAuthenticated
                ? "Continue building great things with your team."
                : "Join thousands of teams who've ditched complexity for clarity. Start free, upgrade when you need more."}
            </p>
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="gap-2 px-8">
                      <Home className="h-5 w-5" />
                      Open Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link to="/auth/register" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full gap-2 px-8">
                        Get started free
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/auth/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full px-8">
                        Sign in
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
            {!isAuthenticated && (
              <p className="mt-6 text-sm text-muted-foreground">
                Free forever for small teams · No credit card required
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4">
                <img src="/logo.png" alt="Flowbase" className="h-10 w-auto" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Where work flows naturally. Built for teams who value clarity, 
                speed, and getting things done.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground">Features</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-foreground">Pricing</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-foreground">Security</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground">About</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-foreground">Blog</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-foreground">Contact</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Flowbase. Built with passion for better teamwork.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
