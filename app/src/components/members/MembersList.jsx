import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/api/members';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Github,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ── Inline GitHub username editor ──────────────────────────────────────────
function GithubUsernameEditor({ member, projectId, canManage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(member.githubUsername || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (githubUsername) =>
      projectsApi.updateMemberGithub(projectId, member.user?._id, githubUsername),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['commits', projectId] });
      toast({ title: 'GitHub username saved' });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save GitHub username',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    mutation.mutate(value.trim());
  };

  const handleCancel = () => {
    setValue(member.githubUsername || '');
    setIsEditing(false);
  };

  if (!canManage) {
    // Read-only display
    return member.githubUsername ? (
      <a
        href={`https://github.com/${member.githubUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Github className="h-3 w-3" />
        {member.githubUsername}
      </a>
    ) : null;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <Github className="h-3 w-3 text-muted-foreground shrink-0" />
        <Input
          className="h-6 text-xs px-1.5 py-0 w-32"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          placeholder="github-username"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-green-600 hover:text-green-700"
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCancel}
          disabled={mutation.isPending}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 group"
      onClick={() => setIsEditing(true)}
      title="Set GitHub username"
    >
      <Github className="h-3 w-3" />
      <span>{member.githubUsername || 'Add GitHub username'}</span>
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
    </button>
  );
}

// ── Main MembersList ────────────────────────────────────────────────────────
export function MembersList({ projectId, members: propMembers, isAdmin = false, canManageProject = false }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only fetch if members not provided as prop
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => membersApi.getAll(projectId),
    enabled: !propMembers && !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: () => membersApi.add(projectId, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Member added' });
      setIsAddModalOpen(false);
      setEmail('');
      setRole('member');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }) =>
      membersApi.updateRole(projectId, memberId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Role updated' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => membersApi.remove(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['commits', projectId] });
      toast({ title: 'Member removed' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const members = propMembers || membersData?.data || [];

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'project_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'project_admin':
        return 'Project Admin';
      case 'member':
        return 'Member';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Team Members</h3>
        {canManageProject && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar>
                <AvatarImage
                  src={member.user?.avatar?.url}
                  alt={member.user?.fullname || member.user?.username}
                  className="object-cover"
                />
                <AvatarFallback>
                  {member.user?.fullname
                    ? member.user.fullname
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                    : member.user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {member.user?.fullname || member.user?.username}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {member.user?.fullname ? `@${member.user.username}` : member.user?.email}
                </p>
                {/* GitHub username inline editor */}
                <GithubUsernameEditor
                  member={member}
                  projectId={projectId}
                  canManage={canManageProject}
                />
              </div>

              <Badge variant={getRoleBadgeVariant(member.role)}>
                {getRoleLabel(member.role)}
              </Badge>

              {isAdmin && member.role !== 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role !== 'project_admin' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRoleMutation.mutate({
                            memberId: member.user?._id,
                            newRole: 'project_admin',
                          })
                        }
                      >
                        Make Project Admin
                      </DropdownMenuItem>
                    )}
                    {member.role !== 'member' && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateRoleMutation.mutate({
                            memberId: member.user?._id,
                            newRole: 'member',
                          })
                        }
                      >
                        Make Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => removeMutation.mutate(member.user?._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No team members yet</p>
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              Invite someone to collaborate on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_admin">Project Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Project Admin can manage tasks and notes. Members have view and contribute access.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !email}>
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
