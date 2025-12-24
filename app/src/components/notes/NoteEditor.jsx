import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/api/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NoteEditor({ projectId, note, onClose, className, isAdmin = false }) {
  const [content, setContent] = useState(note?.content || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (note) {
      setContent(note.content);
    } else {
      setContent('');
    }
  }, [note]);

  const createMutation = useMutation({
    mutationFn: () => notesApi.create(projectId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note created' });
      setContent('');
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: () => notesApi.update(projectId, note._id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note saved' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: () => notesApi.delete(projectId, note._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note deleted' });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add some content for your note.',
        variant: 'destructive',
      });
      return;
    }

    if (note) {
      updateNoteMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateNoteMutation.isPending;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold">Note Editor</h3>
        <div className="flex items-center gap-2">
          {isAdmin && note && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteNoteMutation.mutate()}
              disabled={deleteNoteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isAdmin ? "Start writing..." : "View only"}
          className="min-h-full resize-none border-0 focus-visible:ring-0"
          readOnly={!isAdmin}
        />
      </div>
    </div>
  );
}
