import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { intakeApi } from '@/api/intake';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FlowbaseLogo } from '@/components/shared/FlowbaseLogo';
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';

export default function IntakeFormPage() {
  const { batchId } = useParams();

  // Batch context
  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [batchError, setBatchError] = useState(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [memberRows, setMemberRows] = useState([{ name: '', email: '' }]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchBatch() {
      try {
        setLoadingBatch(true);
        const res = await intakeApi.getPublicBatchDetails(batchId);
        setBatch(res.data);
      } catch (err) {
        setBatchError(err.message || 'Failed to load batch details. This link may be invalid.');
      } finally {
        setLoadingBatch(false);
      }
    }
    if (batchId) fetchBatch();
  }, [batchId]);

  const addMemberRow = () => {
    setMemberRows((prev) => [...prev, { name: '', email: '' }]);
  };

  const removeMemberRow = (index) => {
    setMemberRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMemberRow = (index, field, value) => {
    setMemberRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!projectName.trim() || !description.trim() || !leaderEmail.trim()) {
      setSubmitError('Please fill in the project name, description, and team leader email.');
      return;
    }

    const payload = {
      name: projectName.trim(),
      description: description.trim(),
      leader: {
        name: leaderName.trim() || undefined,
        email: leaderEmail.trim(),
      },
      members: memberRows
        .filter((m) => m.email.trim())
        .map((m) => ({ name: m.name.trim() || undefined, email: m.email.trim() })),
      batchId,
      workspaceId: batch?.workspaceId || undefined,
    };

    try {
      setSubmitting(true);
      await intakeApi.submitIntakeForm(payload);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ───
  if (loadingBatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Loading intake form…</p>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (batchError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/30 shadow-lg animate-fade-in">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Invalid Intake Link</h2>
              <p className="text-sm text-muted-foreground">{batchError}</p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Success State ───
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="border-0 shadow-xl bg-gradient-to-b from-card to-card/80">
            <CardContent className="pt-10 pb-8 flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Project Submitted!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Check your emails for workspace invitations. All team members will receive an
                  onboarding link to join the project.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2 w-full">
                <Link to="/" className="w-full">
                  <Button className="w-full gap-2" variant="outline">
                    <Sparkles className="h-4 w-4" />
                    Explore Flowbase
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Form ───
  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <FlowbaseLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Student Intake</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-2xl">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
            <Building2 className="h-3.5 w-3.5" />
            <span>{batch?.workspaceName}</span>
            <span className="text-border">•</span>
            <span className="text-muted-foreground">{batch?.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Project Intake Form
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Register your project team for <strong className="text-foreground font-semibold">{batch?.name}</strong>.
            Fill in your project details and team members below.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="animate-slide-up">
          <Card className="border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Project Details
              </CardTitle>
              <CardDescription>Enter your project name and a brief description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Smart Attendance System"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe your project idea, objectives, and scope…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Leader Section */}
          <Card className="border shadow-lg mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Team Leader
              </CardTitle>
              <CardDescription>
                The team leader will have admin access to manage the project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaderName">Full Name</Label>
                  <Input
                    id="leaderName"
                    placeholder="John Doe"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaderEmail">Email Address *</Label>
                  <Input
                    id="leaderEmail"
                    type="email"
                    placeholder="leader@university.edu"
                    value={leaderEmail}
                    onChange={(e) => setLeaderEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Section */}
          <Card className="border shadow-lg mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Team Members
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Add your team members' names and email addresses.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMemberRow}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {memberRows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No team members added yet.</p>
                  <p className="text-xs mt-1">Click "Add Member" to include your teammates.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberRows.map((row, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 group animate-fade-in"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          placeholder="Member name"
                          value={row.name}
                          onChange={(e) => updateMemberRow(index, 'name', e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Input
                          type="email"
                          placeholder="member@university.edu"
                          value={row.email}
                          onChange={(e) => updateMemberRow(index, 'email', e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMemberRow(index)}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {submitError && (
            <div className="mt-5 flex items-center gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="gap-2 min-w-[180px] font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Project
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <Link to="/" className="text-primary hover:underline font-medium">
              Flowbase
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
