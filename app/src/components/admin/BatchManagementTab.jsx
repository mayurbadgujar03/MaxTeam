import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { batchesApi } from '@/api/batches';
import { workspaceApi } from '@/api/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, School, Library, Loader2, ClipboardCheck, UserPlus, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function BatchManagementTab() {
  const { activeWorkspace, workspaces } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [coordinatorEmails, setCoordinatorEmails] = useState('');
  
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const isPersonal = activeWorkspace === 'PERSONAL';
  const isHod = workspaces?.find((ws) => ws._id === activeWorkspace)?.isHod || false;

  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['batches', activeWorkspace],
    queryFn: () => batchesApi.getWorkspaceBatches(activeWorkspace),
    enabled: !isPersonal,
  });

  const createMutation = useMutation({
    mutationFn: (data) => batchesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches', activeWorkspace] });
      toast({
        title: 'Batch created',
        description: 'New batch has been created successfully.',
      });
      setIsCreateOpen(false);
      setName('');
      setDepartment('');
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create batch',
        variant: 'destructive',
      });
    },
  });

  const updateCoordinatorsMutation = useMutation({
    mutationFn: ({ batchId, emails }) => batchesApi.updateBatchCoordinators(batchId, emails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches', activeWorkspace] });
      toast({
        title: 'Coordinators updated',
        description: 'Batch coordinators have been updated successfully.',
      });
      setIsAssignOpen(false);
      setSelectedBatch(null);
      setCoordinatorEmails('');
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update coordinators',
        variant: 'destructive',
      });
    },
  });

  const handleOpenAssignDialog = (batch) => {
    setSelectedBatch(batch);
    setCoordinatorEmails(batch.coordinators?.map(c => c.email).join(', ') || '');
    setIsAssignOpen(true);
  };

  const handleUpdateCoordinators = (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const emailsArray = coordinatorEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    updateCoordinatorsMutation.mutate({ batchId: selectedBatch._id, emails: emailsArray });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) return;
    createMutation.mutate({
      name,
      department,
      workspaceId: activeWorkspace,
    });
  };

  const inviteMutation = useMutation({
    mutationFn: ({ workspaceId, email }) => workspaceApi.addWorkspaceHod(workspaceId, email),
    onSuccess: (data) => {
      toast({
        title: 'HOD Invited',
        description: `${data?.data?.data?.inviteeName || 'User'} has been added as an HOD to this workspace.`,
      });
      setIsInviteOpen(false);
      setInviteEmail('');
    },
    onError: (err) => {
      toast({
        title: 'Invitation Failed',
        description: err?.response?.data?.message || err.message || 'Could not invite HOD.',
        variant: 'destructive',
      });
    },
  });

  const handleInviteHod = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ workspaceId: activeWorkspace, email: inviteEmail });
  };

  const handleCopyLink = (batchId) => {
    const intakeUrl = `${window.location.origin}/intake/${batchId}`;
    navigator.clipboard.writeText(intakeUrl)
      .then(() => {
        setCopiedId(batchId);
        toast({
          title: 'Link Copied',
          description: 'Intake form link copied to clipboard.',
        });
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to copy link.',
          variant: 'destructive',
        });
      });
  };

  if (isPersonal) {
    return (
      <Card className="border-dashed border-slate-300 dark:border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <School className="h-12 w-12 text-slate-400 dark:text-slate-600 animate-pulse" />
          <CardTitle className="text-slate-900 dark:text-slate-50 text-xl font-bold">
            No Workspace Scoped
          </CardTitle>
          <CardDescription className="max-w-md text-slate-500 dark:text-slate-400">
            Batches and Student Intake Forms are an institutional feature. Please select your Institution Workspace from the top dropdown in the sidebar to configure batches.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const batches = batchesData?.data?.data || batchesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Batch Profiles & Student Registration Links
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Provision batches, design registration templates, and copy self-registration magic links.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Invite HOD Dialog */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                <UserPlus className="h-4 w-4" />
                Invite HOD
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Co-Administrator</DialogTitle>
                <DialogDescription>
                  Grant another faculty member HOD-level access to this workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteHod} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hod-email">Faculty Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hod-email"
                      type="email"
                      placeholder="e.g. professor@university.edu"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    The user must already have a registered account on the platform.
                  </p>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending || !inviteEmail.trim()} className="gap-2">
                    {inviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Batch Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Batch Profile</DialogTitle>
              <DialogDescription>
                Configure a new batch workspace under your current institutional scope.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="batch-name">Batch name</Label>
                <Input
                  id="batch-name"
                  placeholder="e.g. B.Tech Computer Science 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Input
                  id="dept"
                  placeholder="e.g. Computer Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !name.trim() || !department.trim()}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Batch'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card className="border-dashed border-slate-300 dark:border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Library className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No batches provisioned yet
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Get started by creating your first batch profile to activate self-service intake links.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch._id} className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
              <Link to={`/batches/${batch._id}`} className="block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50 truncate hover:text-indigo-500 transition-colors">
                    {batch.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-500 font-semibold truncate">
                    {batch.department}
                  </CardDescription>
                </CardHeader>
              </Link>
              <CardContent className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                  onClick={() => handleCopyLink(batch._id)}
                >
                  {copiedId === batch._id ? (
                    <>
                      <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      Copy self-intake magic link
                    </>
                  )}
                </Button>

                {isHod && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800"
                    onClick={() => handleOpenAssignDialog(batch)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign Coordinators
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Assign Coordinators Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Batch Coordinators</DialogTitle>
            <DialogDescription>
              Assign faculty members to manage the batch dashboard and registrations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCoordinators} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coordinator-emails">Coordinators Emails (comma-separated)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="coordinator-emails"
                  placeholder="co1@uni.edu, co2@uni.edu"
                  value={coordinatorEmails}
                  onChange={(e) => setCoordinatorEmails(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Assigned users must already have registered accounts to be added.
              </p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCoordinatorsMutation.isPending} className="gap-2">
                {updateCoordinatorsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Assignments'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
