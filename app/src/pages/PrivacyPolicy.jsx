import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { XugiLogo } from '@/components/shared/XugiLogo';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">

      {/* Minimal Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-4xl">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <XugiLogo size="sm" />
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-16 sm:py-24 max-w-3xl">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Legal</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-10">
          Last updated: <span className="font-semibold">October 2026</span>
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Our Commitment to Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              XUGI is built for institutional use within engineering educational environments. We are
              committed to safeguarding the privacy and security of all users — including faculty,
              students, and institutional administrators — who interact with our platform. This Privacy
              Policy describes how we collect, use, and protect information in connection with your use
              of XUGI.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Data We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect only the data necessary to provide the XUGI platform, including:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground pl-4 list-disc list-outside">
              <li>Account information (name, institutional email) authenticated securely via Google OAuth.</li>
              <li>Project and task data you create within the platform (batch names, sprint tasks, notes, milestone records).</li>
              <li>Usage metadata to improve platform performance and reliability.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do <strong className="text-foreground font-semibold">not</strong> collect payment
              information, sell your data to third parties, or use your information for advertising purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">How We Secure Your Data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All institutional data stored on XUGI is protected using industry-standard security measures:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground pl-4 list-disc list-outside">
              <li>All data transmitted between your device and our servers is encrypted via SSL/TLS.</li>
              <li>Data stored at rest is encrypted using AES-256 standards.</li>
              <li>Access to institutional data is governed by strict role-based access controls — faculty, students, and admins each have clearly scoped permissions.</li>
              <li>Authentication is handled exclusively via Google OAuth APIs; we never store raw passwords.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Institutional data is retained for the duration of the institution's active subscription or
              agreement with XUGI. Upon termination, data may be exported on request and will be securely
              deleted within 90 days, unless otherwise required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users have the right to request access to, correction of, or deletion of their personal data at
              any time. To exercise these rights, please contact us at the address below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please reach out to us:
            </p>
            <a
              href="mailto:xugi.hq@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              xugi.hq@gmail.com
            </a>
          </section>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-card/40 py-6">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/70">
          <p>© 2026 XUGI. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
