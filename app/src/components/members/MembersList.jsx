import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/api/members';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function MembersList({ projectId, members: propMembers, isAdmin = false }) {
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

  // Use prop members if provided, otherwise use fetched data
  const members = propMembers || membersData?.data || [];

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'default';  // Creator - primary color
      case 'project_admin':
        return 'secondary';  // Project Admin - secondary color
      default:
        return 'outline';  // Member - outline
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
        {isAdmin && (
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
                <AvatarImage src={member.user?.avatar} />
                <AvatarFallback>
                  {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.user?.username}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {member.user?.fullname || member.user?.email}
                </p>
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
