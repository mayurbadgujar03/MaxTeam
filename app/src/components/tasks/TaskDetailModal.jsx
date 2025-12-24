import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { subtasksApi } from '@/api/subtasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskDetailModal({ task, projectId, open, onOpenChange, canManageTasks = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [newSubtask, setNewSubtask] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (data) =>
      tasksApi.update(projectId, task._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({ title: 'Task updated' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.delete(projectId, task._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({ title: 'Task deleted' });
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: (title) => subtasksApi.create(projectId, task._id, { title }),
    onSuccess: () => {
      // Refetch active queries to update UI immediately
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
      setNewSubtask('');
      toast({ title: 'Subtask added' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subtask',
        variant: 'destructive',
      });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, isCompleted }) =>
      subtasksApi.update(projectId, task._id, subtaskId, { isCompleted }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subtask',
        variant: 'destructive',
      });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId) => subtasksApi.delete(projectId, task._id, subtaskId),
    onSuccess: () => {
      // Refetch active queries to update UI immediately
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
      toast({ title: 'Subtask deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subtask',
        variant: 'destructive',
      });
    },
  });

  if (!task) return null;

  const handleSave = () => {
    updateMutation.mutate({ title, description, status });
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtaskMutation.mutate(newSubtask.trim());
  };

  const statusVariant = {
    todo: 'todo',
    in_progress: 'in-progress',
    done: 'done',
    cancelled: 'cancelled',
  }[status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant={statusVariant}>
              {status.replace('_', ' ')}
            </Badge>
          </div>
          <SheetTitle className="text-left">{task.title}</SheetTitle>
          <SheetDescription className="text-left">
            Created by {task.assignedBy?.username || 'Unknown'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={task.title}
              disabled={!canManageTasks}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={task.description || "Add a description..."}
              disabled={!canManageTasks}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)} disabled={!canManageTasks}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          {task.assignedTo && (
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={task.assignedTo.avatar} />
                  <AvatarFallback>
                    {task.assignedTo.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignedTo.username}</span>
              </div>
            </div>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{attachment.filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Subtasks</Label>
              <span className="text-xs text-muted-foreground">
                {task.subtasks?.filter(s => s.isCompleted).length || 0} / {task.subtasks?.length || 0} completed
              </span>
            </div>
            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask._id}
                    className="flex items-center gap-2 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={subtask.isCompleted}
                      onCheckedChange={(checked) =>
                        toggleSubtaskMutation.mutate({
                          subtaskId: subtask._id,
                          isCompleted: checked,
                        })
                      }
                      disabled={!canManageTasks}
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      subtask.isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {subtask.title}
                    </span>
                    {canManageTasks && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 text-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteSubtaskMutation.mutate(subtask._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                No subtasks yet. Add one below.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {canManageTasks ? 'Cancel' : 'Close'}
            </Button>
            {canManageTasks && (
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save changes'
                )}
              </Button>
            )}
          </div>

          {/* Delete Task Section */}
          {canManageTasks && (
            <div className="border-t pt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                <p className="text-xs text-muted-foreground">
                  Deleting this task will also remove all subtasks and cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Subtask Form at Bottom */}
        {canManageTasks && (
          <div className="border-t pt-3 pb-2 bg-background">
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newSubtask.trim() || addSubtaskMutation.isPending}
              >
                {addSubtaskMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action will also remove all subtasks and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskMutation.mutate()}
              disabled={deleteTaskMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
