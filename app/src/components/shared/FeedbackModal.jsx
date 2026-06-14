import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { feedbackApi } from '@/api/feedback';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';

export function FeedbackModal({ open, onOpenChange }) {
  const [type, setType] = useState('General');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const feedbackMutation = useMutation({
    mutationFn: () => feedbackApi.create({ type, message }),
    onSuccess: () => {
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you! Your feedback helps us improve Flowbase.',
      });
      setMessage('');
      setType('General');
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    feedbackMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-slate-200 dark:border-slate-800 shadow-card bg-card text-card-foreground">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
            <MessageSquare className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            Give Feedback
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
            Found a bug, want a new feature, or have a suggestion? We'd love to hear from you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-type" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Category
              </Label>
              <select
                id="feedback-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-slate-50 transition-base cursor-pointer"
              >
                <option value="General">General Suggestion</option>
                <option value="Bug">Bug Report</option>
                <option value="Feature">Feature Request</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-message" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Message
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="Please describe your thoughts or the issue you encountered..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="resize-none text-slate-900 dark:text-slate-50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 transition-base"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-base border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={feedbackMutation.isPending || !message.trim()}
              className="transition-base bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {feedbackMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin animate-fade-in" />
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
