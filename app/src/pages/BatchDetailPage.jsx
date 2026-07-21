import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { batchesApi } from '@/api/batches';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Download,
  Users,
  FolderKanban,
  Copy,
  ClipboardCheck,
  UserCheck,
  Mail,
  ArrowLeft,
  Building,
  GraduationCap,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const { activeWorkspace, workspaces } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [copiedLink, setCopiedLink] = useState(false);
  const [coordinatorEmails, setCoordinatorEmails] = useState('');
  const [isUpdatingCoordinators, setIsUpdatingCoordinators] = useState(false);

  // 1. Fetch Batch Details
  const { data: batchData, isLoading: isLoadingBatch, error: batchError } = useQuery({
    queryKey: ['batch-details', batchId],
    queryFn: () => batchesApi.getBatchDetails(batchId),
    enabled: !!batchId,
  });

  // 2. Fetch Batch Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['batch-stats', batchId],
    queryFn: () => batchesApi.getBatchStats(batchId),
    enabled: !!batchId,
  });

  // 3. Fetch All Workspace Projects (filtered locally by batchId)
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', activeWorkspace],
    queryFn: () => projectsApi.getAll(activeWorkspace),
    enabled: !!activeWorkspace,
  });

  const batch = batchData?.data?.data || batchData?.data || null;
  const stats = statsData?.data?.data || statsData?.data || null;
  const projects = projectsData?.data || [];

  // Filter projects associated with this batch
  const batchProjects = projects.filter(
    (p) => p.batchId?._id === batchId || p.batchId === batchId
  );

  const isHod = workspaces?.find((ws) => ws._id === activeWorkspace)?.isHod || false;

  useEffect(() => {
    if (batch?.coordinators) {
      setCoordinatorEmails(batch.coordinators.map((c) => c.email).join(', '));
    }
  }, [batch]);

  // Coordinator Update Mutation
  const updateCoordinatorsMutation = useMutation({
    mutationFn: (emails) => batchesApi.updateBatchCoordinators(batchId, emails),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['batch-details', batchId] });
      toast({
        title: 'Coordinators updated',
        description: 'Batch coordinators have been updated successfully.',
      });
      setIsUpdatingCoordinators(false);
    },
    onError: (err) => {
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update coordinators',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateCoordinators = (e) => {
    e.preventDefault();
    const emailsArray = coordinatorEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    updateCoordinatorsMutation.mutate(emailsArray);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/intake/${batchId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedLink(true);
        toast({
          title: 'Intake link copied',
          description: 'Students registration URL copied to clipboard.',
        });
        setTimeout(() => setCopiedLink(false), 2000);
      });
  };

  const handleExportCSV = async () => {
    try {
      const blob = await batchesApi.exportBatchCSV(batchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${batch?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Export successful',
        description: 'Batch spreadsheet report generated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err.message || 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingBatch) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <div className="space-y-4 text-center py-16">
        <div className="text-destructive font-semibold">Failed to load batch details</div>
        <p className="text-sm text-muted-foreground">The batch profile might not exist or you lack authorization.</p>
        <Link to="/batches">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-1">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link to="/batches" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="h-3 w-3" />
            Back to Batches
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {batch.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-medium">
              <GraduationCap className="h-3.5 w-3.5" />
              {batch.department}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              Institutional Workspace
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 border-slate-200 dark:border-slate-800">
            <Download className="h-4 w-4" />
            Export CSV Data
          </Button>
          <Button onClick={handleCopyLink} variant="indigo" className="gap-2 shadow-sm">
            {copiedLink ? (
              <>
                <ClipboardCheck className="h-4 w-4 animate-pulse" />
                Intake Link Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Intake Magic Link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total Teams / Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isLoadingStats ? '—' : stats?.totalProjects || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Registered teams in this batch</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total Students Involved
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isLoadingStats ? '—' : stats?.totalMembers || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Leaders and collaborators</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Project Access Status
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              {isLoadingStats ? '—' : `${stats?.frozenProjects || 0} Frozen`}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active projects: {isLoadingStats ? '—' : stats?.activeProjects || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Projects Table & HOD Controls */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects Table (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-card shadow-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Registered Projects</CardTitle>
              <CardDescription>All project proposals processed through this batch's intake flow.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingProjects ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : batchProjects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No projects registered yet</p>
                  <p className="text-xs mt-1">Students can register by visiting the magic self-intake link.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b text-xs font-semibold text-slate-500">
                        <th className="p-4">Project Name</th>
                        <th className="p-4">Faculty Mentor</th>
                        <th className="p-4">Team Leader</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batchProjects.map((project) => {
                        const leader = project.members?.find((m) => m.role === 'project_admin');
                        const mentor = project.members?.find((m) => m.role === 'admin');

                        return (
                          <tr key={project._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                              {project.name}
                            </td>
                            <td className="p-4 max-w-[150px] truncate">
                              {mentor ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{mentor.user?.fullname || mentor.user?.username}</span>
                                  <span className="text-[10px] text-muted-foreground">{mentor.user?.email}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                              )}
                            </td>
                            <td className="p-4 max-w-[150px] truncate">
                              {leader ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{leader.user?.fullname || leader.user?.username}</span>
                                  <span className="text-[10px] text-muted-foreground">{leader.user?.email}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                project.isFrozen 
                                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400' 
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
                              }`}>
                                {project.isFrozen ? (
                                  <>
                                    <Lock className="h-2.5 w-2.5" />
                                    Frozen
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-2.5 w-2.5" />
                                    Active
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Link to={`/projects/${project._id}`}>
                                <Button variant="ghost" size="sm">
                                  View Files
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Batch Info & Administration Sidebar (Right 1 column) */}
        <div className="space-y-6">
          {/* Coordinator Management (HOD only) */}
          {isHod && (
            <Card className="border border-slate-200 dark:border-slate-800 bg-card shadow-card">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-4.5 w-4.5 text-indigo-500" />
                  Batch Management
                </CardTitle>
                <CardDescription>Assign faculty members to manage registrations and evaluations.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleUpdateCoordinators} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coordinators">Coordinators Emails (comma-separated)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="coordinators"
                        placeholder="co1@uni.edu, co2@uni.edu"
                        value={coordinatorEmails}
                        onChange={(e) => setCoordinatorEmails(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Faculty members must already have registered accounts on the platform to be assigned.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={updateCoordinatorsMutation.isPending}
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    {updateCoordinatorsMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating Assignments…
                      </>
                    ) : (
                      'Update Coordinators List'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Coordinators List Card (Always visible) */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-card shadow-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Designated Coordinators</CardTitle>
              <CardDescription>Users authorized to oversee and freeze evaluations for this batch.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {batch.coordinators?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">No coordinators assigned to this batch profile.</p>
              ) : (
                <div className="space-y-3">
                  {batch.coordinators?.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                        {c.fullname?.charAt(0).toUpperCase() || c.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.fullname || c.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
