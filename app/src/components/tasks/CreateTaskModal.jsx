import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronsUpDown, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreateTaskModal({ 
  projectId,
  members = [],
  defaultStatus = 'todo', 
  open, 
  onOpenChange 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [assignedTo, setAssignedTo] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentLink, setCurrentLink] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => tasksApi.create(projectId, { title, description, status, assignedTo: assignedTo || undefined, links }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({
        title: 'Task created',
        description: 'Your new task has been created successfully.',
      });
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setStatus('todo');
      setAssignedTo('');
      setLinks([]);
      setCurrentLink('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create task',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  const isValidUrl = (url) => {
    return /^https?:\/\//i.test(url);
  };

  const handleAddLink = () => {
    const trimmed = currentLink.trim();
    if (!trimmed || !isValidUrl(trimmed)) return;
    setLinks((prev) => [...prev, trimmed]);
    setCurrentLink('');
  };

  const handleRemoveLink = (idx) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader><form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to (optional)</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={members.find(m => m.user?._id === assignedTo)?.user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {members.find(m => m.user?._id === assignedTo)?.user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {members.find(m => m.user?._id === assignedTo)?.user?.fullname || 
                           members.find(m => m.user?._id === assignedTo)?.user?.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select member...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="unassigned"
                          onSelect={() => {
                            setAssignedTo('');
                            setComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !assignedTo ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <UserX className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Unassigned</span>
                        </CommandItem>
                        {members.map((member) => (
                          <CommandItem
                            key={member.user?._id}
                            value={`${member.user?.username} ${member.user?.fullname || ''}`}
                            onSelect={() => {
                              setAssignedTo(member.user?._id);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                assignedTo === member.user?._id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <Avatar className="mr-2 h-6 w-6">
                              <AvatarImage src={member.user?.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.user?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{member.user?.fullname || member.user?.username}</span>
                              {member.user?.fullname && (
                                <span className="text-xs text-muted-foreground">@{member.user?.username}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resources / Links</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste URL here..."
                  value={currentLink}
                  onChange={e => setCurrentLink(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddLink} disabled={!isValidUrl(currentLink)}>
                  Add
                </Button>
              </div>
              {links.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {links.map((link, idx) => (
                    <li key={link + idx} className="flex items-center gap-2 text-sm">
                      <span className="truncate max-w-xs" title={link}>{link}</span>
                      <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveLink(idx)} aria-label="Remove link">
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
