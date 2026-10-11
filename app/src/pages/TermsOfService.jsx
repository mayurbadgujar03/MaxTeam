import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Mail } from 'lucide-react';
import { XugiLogo } from '@/components/shared/XugiLogo';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
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
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Legal</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Terms of Service</h1>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-10">
          Last updated: <span className="font-semibold">October 2026</span>
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using the XUGI platform, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the platform. Use of XUGI constitutes
              your acceptance of any changes or revisions to these terms going forward.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Authorized Use Only</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              XUGI is an institutional platform intended exclusively for use within authorized educational
              or engineering organizations. By using XUGI, you agree to:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground pl-4 list-disc list-outside">
              <li>Use the platform solely for legitimate institutional or educational purposes, including project management, capstone tracking, and faculty-student collaboration.</li>
              <li>Not access, modify, or share data belonging to other institutions or users without explicit authorization.</li>
              <li>Comply with all applicable laws, regulations, and your institution's acceptable use policies.</li>
              <li>Not use the platform for any unlawful, harmful, or malicious activities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Account Responsibility</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activity that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:xugi.hq@gmail.com" className="text-primary font-semibold hover:underline">
                xugi.hq@gmail.com
              </a>{' '}
              if you suspect unauthorized access to your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content, design, code, and features of the XUGI platform are the intellectual property
              of XUGI and its developers. You may not reproduce, distribute, or create derivative works
              from any part of the platform without prior written consent.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Content you create within the platform (projects, tasks, notes) remains your intellectual
              property. By using XUGI, you grant us a limited license to store and display that content
              solely for the purpose of providing the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              XUGI is provided "as is" without warranties of any kind. To the maximum extent permitted by
              applicable law, XUGI and its developers shall not be liable for any indirect, incidental,
              or consequential damages arising from your use of, or inability to use, the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Modifications</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to update these Terms of Service at any time. Continued use of the
              platform after changes are posted constitutes your acceptance of the updated terms. We
              encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us:
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
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors font-medium">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
