import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
  Layers,
  Check,
  Shield,
  X,
  ChevronDown,
  BookOpen,
  Briefcase,
  GraduationCap,
  Clock,
  Eye,
  TrendingUp,
  Quote,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { feedbackApi } from '@/api/feedback';
import { FeedbackModal } from '@/components/shared/FeedbackModal';
import { XugiLogo } from '@/components/shared/XugiLogo';

// ─── Static data ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    id: 1,
    quote: 'XUGI saved our department hours of manual tracking. Total visibility.',
    name: 'Dr. Makarand Shahade',
    role: 'HOD & Associate Professor, Computer Engineering',
    initials: 'MS',
    color: 'bg-indigo-500',
  },
  {
    id: 2,
    quote: 'Students are finally getting recognized for their specific project contributions.',
    name: 'Dr. Ashish Awate',
    role: 'Assistant Professor',
    initials: 'AA',
    color: 'bg-emerald-500',
  },
  {
    id: 3,
    quote: 'Milestone tracking and automated intake forms have completely changed how we run capstone season.',
    name: 'Dr. Bhushan Nandwalkar',
    role: 'Faculty, Computer Engineering',
    initials: 'BN',
    color: 'bg-violet-500',
  },
];

// ─── Sub-component: Batches page CSS mockup ─────────────────────────────────

function BatchesMockup() {
  const batches = [
    { name: 'B.Tech CSE — Batch 2025', count: 14, progress: 72, color: 'bg-indigo-500' },
    { name: 'M.Tech IT — Batch 2026', count: 8, progress: 48, color: 'bg-violet-500' },
    { name: 'B.Tech CE — Batch 2025', count: 11, progress: 89, color: 'bg-emerald-500' },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden select-none text-left w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold text-foreground">Batches Overview</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          AY 2025-26
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: 'Batches', value: '3' },
          { label: 'Projects', value: '33' },
          { label: 'Students', value: '124' },
        ].map((s) => (
          <div key={s.label} className="py-3 text-center">
            <p className="text-base font-extrabold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {batches.map((b) => (
          <div key={b.name} className="flex items-center gap-3 px-4 py-3">
            <span className={`h-2 w-2 rounded-full shrink-0 ${b.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">{b.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.progress}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground font-mono shrink-0">{b.progress}%</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{b.count} groups</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-muted/10 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Eye className="h-3 w-3" /> Faculty-only live view — updated in real time
        </p>
      </div>
    </div>
  );
}

// ─── Sub-component: Student Kanban CSS mockup ────────────────────────────────

function StudentKanbanMockup() {
  const cols = [
    {
      title: 'To Do',
      dot: 'bg-muted-foreground/50',
      cards: [{ title: 'Setup CI/CD pipeline', tag: 'DevOps', owner: 'RS' }],
    },
    {
      title: 'In Progress',
      dot: 'bg-indigo-500',
      cards: [{ title: 'Auth middleware', tag: 'Backend', owner: 'PK' }],
    },
    {
      title: 'Done',
      dot: 'bg-emerald-500',
      cards: [{ title: 'DB Schema design', tag: 'Database', owner: 'AM' }],
    },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden select-none text-left w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <span className="text-xs font-bold text-foreground">Sprint 3 — Smart Attendance App</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          Active
        </span>
      </div>
      <div className="flex gap-2 p-3">
        {cols.map((col) => (
          <div key={col.title} className="flex-1 min-w-0 rounded-xl bg-muted/30 border border-border/40 p-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{col.title}</span>
            </div>
            {col.cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-border bg-background/80 p-2.5 space-y-2">
                <p className="text-[10px] font-bold text-foreground leading-snug">{card.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {card.tag}
                  </span>
                  <div className="h-4 w-4 rounded-full bg-primary text-[7px] text-primary-foreground flex items-center justify-center font-bold">
                    {card.owner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-muted/10 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" /> 3 tasks completed this sprint · 1 in progress
        </p>
      </div>
    </div>
  );
}

// ─── Sub-component: Industry talent view CSS mockup ──────────────────────────

function IndustryMockup() {
  const students = [
    { name: 'Priya Kulkarni', skills: ['Backend', 'Node.js'], tasks: 14, score: 92 },
    { name: 'Rahul Shah', skills: ['ML', 'Python'], tasks: 11, score: 88 },
    { name: 'Amit Desai', skills: ['DevOps', 'Docker'], tasks: 9, score: 85 },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden select-none text-left w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">Top Contributors — CSE 2026</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Industry View
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {students.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3 px-4 py-3">
            <span className="text-[10px] font-bold text-muted-foreground/60 w-4 shrink-0">{i + 1}</span>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] text-white font-bold flex items-center justify-center shrink-0">
              {s.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">{s.name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {s.skills.map((sk) => (
                  <span key={sk} className="text-[7px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{s.score}</p>
              <p className="text-[9px] text-muted-foreground">{s.tasks} tasks</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-muted/10 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3 text-amber-500" /> Verified by SVKM NMIMS Global University
        </p>
      </div>
    </div>
  );
}

// ─── Role tab data (defined after mockup components) ────────────────────────

const ROLE_TABS = [
  {
    id: 'faculty',
    label: 'For Faculty',
    icon: BookOpen,
    tagline: 'Save Time & Gain Visibility',
    headline: 'See every batch, every project, in one place.',
    body: 'Reclaim your weekend. Automated intake forms and milestone tracking eliminate manual spreadsheets. Get a real-time bird-eye view of every student batch, their progress, blockers, and contribution — without sending a single follow-up email.',
    bullets: [
      'Automated digital intake forms for each batch cohort',
      'Milestone dashboards with live completion rates',
      'One-click faculty overviews across all batches',
      'Instant alerts when projects go off-track',
    ],
    pillColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    checkColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    Visual: BatchesMockup,
  },
  {
    id: 'students',
    label: 'For Students',
    icon: GraduationCap,
    tagline: 'Boost Skills & Build a Portfolio',
    headline: 'Get credit for every task you actually do.',
    body: 'No more invisible contributions. XUGI tracks exactly which tasks each student owns, completed, and delivered — building a verifiable, chronological portfolio of real engineering work that speaks louder than any resume line.',
    bullets: [
      'Task-level ownership tracked per student',
      'Kanban boards to visualise sprint progress',
      'Verifiable contribution history for placements',
      'Peer collaboration through shared project workspaces',
    ],
    pillColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    checkColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    Visual: StudentKanbanMockup,
  },
  {
    id: 'industry',
    label: 'For Industry',
    icon: Briefcase,
    tagline: 'Discover Future Talent',
    headline: 'Spot top engineers before they graduate.',
    body: "Hiring based on a GPA is guesswork. XUGI gives industry partners access to real, executed project data — see who shipped features, who resolved blockers, and who led their team under pressure.",
    bullets: [
      'Real project execution records per student',
      'Skill tagging across domains (Backend, ML, DevOps)',
      'Institutional batch insights for campus partnerships',
      'Direct engagement pathway through the institution',
    ],
    pillColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    checkColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    Visual: IndustryMockup,
  },
];

// ─── Sub-component: Floating testimonial widget ──────────────────────────────

function FloatingTestimonial() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TESTIMONIALS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const t = TESTIMONIALS[index];

  return (
    <div
      className={`
        hidden md:flex fixed bottom-6 left-5 z-40 flex-col gap-0 max-w-[260px]
        rounded-2xl border border-border bg-card/95 backdrop-blur-md
        shadow-[var(--shadow-elevated)] p-4 transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss testimonial"
        className="absolute top-2.5 right-2.5 text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <Quote className="h-5 w-5 text-primary/50 mb-2 shrink-0" />
      <p className="text-[11px] font-semibold text-foreground leading-relaxed pr-4 mb-3">
        "{t.quote}"
      </p>
      <div className="flex items-center gap-2.5">
        <div className={`h-7 w-7 rounded-full ${t.color} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
          {t.initials}
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground leading-tight">{t.name}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">{t.role}</p>
        </div>
      </div>

      <div className="flex gap-1 mt-3 justify-center">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIndex(i); setVisible(true); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5'}`}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-component: Cookie Consent banner ───────────────────────────────────

function CookieBanner() {
  const [accepted, setAccepted] = useState(() => {
    try { return localStorage.getItem('xugi_cookie_accepted') === '1'; } catch { return false; }
  });

  if (accepted) return null;

  const accept = () => {
    try { localStorage.setItem('xugi_cookie_accepted', '1'); } catch {}
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 md:px-6">
      <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          🍪 We use cookies to improve your experience on XUGI. By continuing, you agree to our{' '}
          <Link to="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={accept} className="h-7 text-xs px-3 border-border hover:bg-muted">
            Decline
          </Button>
          <Button size="sm" onClick={accept} className="h-7 text-xs px-4">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Role tabs section ───────────────────────────────────────

function RoleSection() {
  const [activeTab, setActiveTab] = useState('faculty');
  const [openAccordion, setOpenAccordion] = useState('faculty');
  const activeRole = ROLE_TABS.find((t) => t.id === activeTab);

  return (
    <section id="features" className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl">
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
        <Badge
          variant="outline"
          className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full"
        >
          <Layers className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium">Built for Every Stakeholder</span>
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          One Platform, Three Superpowers
        </h2>
        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
          XUGI is designed to serve the full institutional ecosystem — faculty, students, and industry partners — with purpose-built workflows.
        </p>
      </div>

      {/* Desktop: Vertical tab layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
        <div className="flex flex-col gap-2 sticky top-24">
          {ROLE_TABS.map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-all duration-200 group
                  ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-card)]'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <span className={`shrink-0 ${activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  <IconComp className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight">{tab.label}</span>
                  <span className={`text-[10px] font-medium leading-tight mt-0.5 ${activeTab === tab.id ? 'text-primary-foreground/75' : 'text-muted-foreground/70'}`}>
                    {tab.tagline}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {activeRole && (
          <div key={activeRole.id} className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center animate-fade-in">
            <div className="space-y-5 order-2 lg:order-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${activeRole.pillColor}`}>
                <activeRole.icon className="h-3.5 w-3.5" />
                {activeRole.tagline}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {activeRole.headline}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {activeRole.body}
              </p>
              <ul className="space-y-2.5 pt-1">
                {activeRole.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${activeRole.checkColor}`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 transition-all duration-300 hover:-translate-y-1">
              <activeRole.Visual />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Accordion layout */}
      <div className="md:hidden space-y-3">
        {ROLE_TABS.map((tab) => {
          const isOpen = openAccordion === tab.id;
          const IconComp = tab.icon;
          return (
            <div
              key={tab.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}
            >
              <button
                onClick={() => setOpenAccordion(isOpen ? '' : tab.id)}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                    <IconComp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${isOpen ? 'text-primary' : 'text-foreground'}`}>{tab.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tab.tagline}</p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 space-y-4 animate-slide-up">
                  <div className="transition-all hover:-translate-y-0.5 duration-200">
                    <tab.Visual />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tab.body}</p>
                  <ul className="space-y-2">
                    {tab.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${tab.checkColor}`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Main page component ─────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: publicStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => feedbackApi.getPublicStats(),
  });

  const totalUsers =
    publicStats?.data?.totalUsers && publicStats.data.totalUsers > 0
      ? publicStats.data.totalUsers
      : 100;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background select-none font-sans overflow-x-hidden font-normal">

      {/* ════════════════════════════════════════
          1. STICKY NAVIGATION BAR
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-6xl">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <XugiLogo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Security', id: 'security' },
              { label: 'Testimonials', id: 'testimonials' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors uppercase bg-transparent border-0 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                <a
                  href="mailto:xugi@svkmnmimsgu.ac.in?subject=Institutional%20Access%20Request"
                  className="hidden sm:block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Book a Demo
                </a>
                <Link to={isAuthenticated ? '/dashboard' : '/auth/login'}>
                  <Button className="font-semibold px-5 h-9 gap-1.5 transition-base">
                    {isAuthenticated ? (
                      <span className="flex items-center gap-1.5">
                        <Home className="h-4 w-4" /> Dashboard
                      </span>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ════════════════════════════════════════
            2. HERO SECTION
        ════════════════════════════════════════ */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 sm:pt-28 sm:pb-20 flex flex-col items-center justify-center text-center max-w-6xl">
          <div className="absolute left-1/2 top-1/3 -z-10 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/8 blur-[120px] sm:blur-[160px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-4xl space-y-6">
            <Badge
              className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full animate-fade-in"
              variant="outline"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-xs font-medium tracking-tight">
                B2B Institutional Engineering Platform
              </span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] pb-2 animate-slide-up">
              Bring{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                Total Visibility
              </span>{' '}
              to Engineering Projects.
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in">
              Empower faculty, boost student skills, and save hours of administrative
              tracking every week. The unified workspace for institutional project management.
            </p>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              {[
                { icon: Clock, text: 'Save admin hours' },
                { icon: Eye, text: 'Total faculty visibility' },
                { icon: TrendingUp, text: 'Boost student skills' },
              ].map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/60 rounded-full px-3 py-1.5"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {text}
                </span>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
              <Link
                to={isAuthenticated ? '/dashboard' : '/auth/login'}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto font-semibold px-8 h-12 gap-2 shadow-[var(--shadow-elevated)] transition-base"
                >
                  {isAuthenticated ? (
                    <>
                      <Home className="h-4 w-4" /> Go to Dashboard
                    </>
                  ) : (
                    <>
                      Login / Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </Link>

              <a
                href="mailto:xugi@svkmnmimsgu.ac.in?subject=Institutional%20Access%20Request"
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-semibold px-8 h-12 gap-2 border-border hover:bg-muted transition-base"
                >
                  <Briefcase className="h-4 w-4" />
                  Request Institutional Access
                </Button>
              </a>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground/70 font-medium">
                Institutional access only · No credit card required
              </p>
            )}

            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="py-1 px-3 border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1.5 rounded-full font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {totalUsers}+ engineers optimizing their workflow
              </Badge>
            </div>
          </div>

          {/* Dashboard window mockup */}
          <div className="w-full max-w-5xl mx-auto rounded-xl border border-border shadow-[var(--shadow-elevated)] overflow-hidden bg-muted/20 backdrop-blur-sm relative mt-16 md:mt-20 transition-base hover:border-foreground/15 select-none">
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/75">xugi.in/dashboard</div>
              <div className="w-12" />
            </div>

            <div className="flex h-52 sm:h-72 w-full text-left font-sans">
              <div className="w-1/5 border-r border-border bg-card p-4 hidden sm:block space-y-4">
                <div className="h-7 w-full rounded-md bg-muted/40" />
                <div className="space-y-2">
                  {[{ w: 'w-12', active: true }, { w: 'w-16', active: false }, { w: 'w-10', active: false }, { w: 'w-14', active: false }].map((item, i) => (
                    <div
                      key={i}
                      className={`h-6 w-full rounded flex items-center px-2 gap-1.5 ${item.active ? 'bg-primary/10' : 'bg-transparent'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className={`h-2 ${item.w} rounded ${item.active ? 'bg-primary/20' : 'bg-muted-foreground/20'}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-background/40 p-4 sm:p-6 space-y-5 overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-foreground/80" />
                    <div className="h-2.5 w-44 rounded bg-muted-foreground/30" />
                  </div>
                  <div className="h-7 w-20 rounded bg-primary/20 flex items-center justify-center">
                    <div className="h-2.5 w-10 rounded bg-primary/40 animate-pulse" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Batches', val: '3', color: 'text-indigo-500' },
                    { label: 'Active Projects', val: '33', color: 'text-emerald-500' },
                    { label: 'Students', val: '124', color: 'text-amber-500' },
                  ].map((c) => (
                    <div key={c.label} className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)] space-y-1">
                      <p className={`text-sm font-extrabold ${c.color}`}>{c.val}</p>
                      <div className="h-2 w-full rounded bg-muted-foreground/15" />
                      <div className="h-1.5 w-2/3 rounded bg-muted-foreground/10" />
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {[72, 48, 89].map((pct, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2.5 w-24 rounded bg-muted-foreground/20 shrink-0" />
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            3. SVKM TRUST BANNER
        ════════════════════════════════════════ */}
        <section className="border-y border-border/60 bg-muted/15 py-8 sm:py-10">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-5">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Trusted by the visionary engineering teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <a
                href="https://www.svkmnmimsgu.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2.5 group"
              >
                <img
                  src="https://www.svkmnmimsgu.ac.in/images/sngu_logo_new.jpg"
                  alt="SVKM NMIMS Global University logo"
                  className="max-h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.classList.remove('hidden');
                    }
                  }}
                />
                <span className="hidden font-extrabold tracking-widest text-sm text-muted-foreground/60 group-hover:text-foreground/80 transition-colors font-mono">
                  SVKM NMIMS GLOBAL UNIVERSITY
                </span>
                <span className="text-[11px] text-muted-foreground/60 group-hover:text-foreground/70 transition-colors font-medium">
                  SVKM NMIMS Global University
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            4. ROLE-BASED FEATURES
        ════════════════════════════════════════ */}
        <RoleSection />

        {/* ════════════════════════════════════════
            5. IMPACT STATS STRIP
        ════════════════════════════════════════ */}
        <section className="border-y border-border/60 bg-gradient-to-r from-primary/5 via-background to-primary/5 py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              {[
                { value: '100+', label: 'Engineers on platform', Icon: Users, color: 'text-primary' },
                { value: '3x', label: 'Faster admin workflows', Icon: Clock, color: 'text-emerald-500' },
                { value: '33+', label: 'Active capstone projects', Icon: CheckSquare, color: 'text-indigo-500' },
                { value: '100%', label: 'Institutional data privacy', Icon: Shield, color: 'text-amber-500' },
              ].map(({ value, label, Icon, color }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground font-medium leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            6. TESTIMONIALS GRID
        ════════════════════════════════════════ */}
        <section id="testimonials" className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
            <Badge
              variant="outline"
              className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full"
            >
              <Quote className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">What Faculty Say</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Loved by the people who use it most
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                quote: 'XUGI saved our department hours of manual tracking. Total visibility.',
                name: 'Dr. Makarand Shahade',
                role: 'HOD & Associate Professor, Computer Engineering',
                initials: 'MS',
                gradient: 'from-indigo-500 to-blue-600',
              },
              {
                quote: 'Students are finally getting recognized for their specific project contributions.',
                name: 'Dr. Ashish Awate',
                role: 'Assistant Professor',
                initials: 'AA',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                quote: 'The automated intake forms alone removed an entire week of email back-and-forth.',
                name: 'Dr. Bhushan Nandwalkar',
                role: 'Faculty, Computer Engineering',
                initials: 'BN',
                gradient: 'from-violet-500 to-purple-600',
              },
              {
                quote: 'Milestone tracking makes it easy to know exactly where each batch stands.',
                name: 'Khalid Alfatmi',
                role: 'Assistant Professor, IT / Computer Engineering',
                initials: 'KA',
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                quote: 'Finally, a platform that treats student contributions as the valuable data they are.',
                name: 'Dr. Mayuri Kulkarni',
                role: 'Faculty',
                initials: 'MK',
                gradient: 'from-rose-500 to-pink-600',
              },
              {
                quote: 'The Kanban boards give students a real taste of industry-grade project management.',
                name: 'Dr. Kavita Patil',
                role: 'Faculty',
                initials: 'KP',
                gradient: 'from-cyan-500 to-sky-600',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] flex flex-col gap-4 hover:shadow-[var(--shadow-soft)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Quote className="h-5 w-5 text-primary/40 shrink-0" />
                <p className="text-sm text-foreground font-medium leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.gradient} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            7. SECURITY SECTION
        ════════════════════════════════════════ */}
        <section id="security" className="border-t border-border bg-muted/15 py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <div className="space-y-3 max-w-2xl mx-auto">
              <Badge
                className="py-1 px-3 border-border/50 bg-secondary/80 text-muted-foreground gap-1.5 rounded-full"
                variant="outline"
              >
                <Shield className="h-3 w-3 text-primary" />
                Enterprise Grade Security
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Your Institutional Data, Fully Protected
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Security is not an afterthought. We implement industry-leading encryption and
                authorization to keep your capstone project files and student data safe.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3 text-left max-w-3xl mx-auto">
              {[
                {
                  title: 'Encryption',
                  body: 'All data — notes, task records, and user tokens — are encrypted in transit via SSL and at rest using AES-256 standards.',
                },
                {
                  title: 'Role-Based Access',
                  body: 'Faculty, students, and admins each see only what they need. Granular project memberships prevent unauthorized access.',
                },
                {
                  title: 'OAuth Authorization',
                  body: 'XUGI authenticates via official Google OAuth APIs — no password databases, no credential leaks.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            8. BOTTOM CTA BANNER
        ════════════════════════════════════════ */}
        <section className="relative border-t border-border/60 bg-muted/10 py-24 sm:py-32 overflow-hidden select-none">
          <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-primary/6 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute right-0 top-0 -z-10 h-48 w-48 bg-violet-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
            <Badge
              variant="outline"
              className="py-1 px-3 border-primary/20 bg-primary/5 text-primary gap-1.5 rounded-full"
            >
              <Zap className="h-3 w-3" />
              Ready to transform your department?
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Give your faculty full visibility.{' '}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                Starting today.
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
              Ditch the spreadsheets and email chains. Move your entire institution into the
              unified collaborative workspace built for engineering education.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              {!isLoading && (
                <Link to={isAuthenticated ? '/dashboard' : '/auth/login'} className="w-full sm:w-auto">
                  <Button size="lg" className="font-semibold px-10 h-12 gap-2 shadow-[var(--shadow-elevated)] transition-base w-full">
                    {isAuthenticated ? 'Go to Dashboard' : 'Login / Go to Dashboard'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <a href="mailto:xugi@svkmnmimsgu.ac.in?subject=Institutional%20Access%20Request" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="font-semibold px-8 h-12 gap-2 border-border hover:bg-muted transition-base w-full">
                  <Briefcase className="h-4 w-4" />
                  Book a Demo
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════
          9. FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/40 py-12 select-none text-left">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <XugiLogo size="sm" />
            </div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Security', id: 'security' },
                { label: 'Testimonials', id: 'testimonials' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider bg-transparent border-0 cursor-pointer p-0"
              >
                Feedback
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/80">
            <p>© 2026 XUGI. All rights reserved. Built for SVKM NMIMS Global University.</p>
            <div className="flex gap-6">
              <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global overlays */}
      <FloatingTestimonial />
      <CookieBanner />
      <FeedbackModal open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </div>
  );
}
