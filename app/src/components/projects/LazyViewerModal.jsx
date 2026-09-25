import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/api/comments';
import { membersApi } from '@/api/members';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, FileText, Loader2, Navigation } from 'lucide-react';
import { getPremiumAvatarUrl } from '@/utils/avatar';

export function LazyViewerModal({ open, onOpenChange, documentId, documentUrl, documentName, projectId, docType }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const iframeRef = useRef(null);

  const [newComment, setNewComment] = useState('');
  const [pageNumber, setPageNumber] = useState('');

  // Fetch comments query
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', documentId],
    queryFn: () => commentsApi.getDocumentComments(documentId),
    enabled: !!documentId,
  });

  const comments = commentsData?.data?.data || commentsData?.data || [];

  const { data: membersData } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => membersApi.getAll(projectId),
    enabled: !!projectId,
  });

  const projectMembers = membersData?.data || [];
  console.log("Project Members for Mentions:", projectMembers);

  // Create comment mutation
  const commentMutation = useMutation({
    mutationFn: (payload) => commentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
      setNewComment('');
      setPageNumber('');
      toast({
        title: 'Annotation Added',
        description: 'Your comment has been pinned to the document.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit comment.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    commentMutation.mutate({
      content: newComment,
      pageNumber: pageNumber ? parseInt(pageNumber, 10) : null,
      documentId,
      projectId,
      entityType: docType || 'report',
    });
  };

  const handlePageJump = (pageNum) => {
    if (iframeRef.current && pageNum) {
      // Native PDF deep-linking syntax is URL#page=N
      // Splitting by '#' to prevent growing the hash chain repeatedly
      const baseUrl = documentUrl.split('#')[0];
      iframeRef.current.src = `${baseUrl}#page=${pageNum}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col md:flex-row p-0 overflow-hidden bg-background border border-border">
        {/* Left Panel: PDF Viewer (70% width) */}
        <div className="w-full md:w-[70%] h-1/2 md:h-full border-r border-border bg-slate-950 flex flex-col relative">
          <div className="h-12 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">
                {documentName || 'Document Viewer'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Interactive PDF Evaluator
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <iframe
              ref={iframeRef}
              src={documentUrl}
              title={documentName || 'Project Report'}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
            />
          </div>
        </div>

        {/* Right Panel: Comments/Evaluator (30% width) */}
        <div className="w-full md:w-[30%] h-1/2 md:h-full flex flex-col bg-card">
          <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-bold">Annotations</span>
            </div>
            <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold">
              {comments.length}
            </span>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-2">Loading annotations...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 space-y-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs font-semibold text-muted-foreground">No annotations yet</p>
                <p className="text-[10px] text-muted-foreground/80 max-w-[180px]">
                  Submit review comments or spec annotations linked to specific page numbers.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const initials = comment.author?.fullname
                  ? comment.author.fullname.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : comment.author?.username?.charAt(0).toUpperCase() || 'U';

                return (
                  <div key={comment._id} className="p-3 rounded-lg border bg-background space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getPremiumAvatarUrl(comment.author?.avatar?.url, comment.author?.fullname || comment.author?.username)} className="object-cover" />
                          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold truncate">
                          {comment.author?.fullname || comment.author?.username}
                        </span>
                      </div>

                      {comment.pageNumber != null && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handlePageJump(comment.pageNumber)}
                          className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 py-0.5 px-1.5 h-auto w-auto rounded gap-1 font-semibold flex items-center shrink-0 border border-indigo-500/10"
                        >
                          <Navigation className="h-2.5 w-2.5" />
                          Page {comment.pageNumber}
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="page-input" className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  Page Link (Optional)
                </Label>
                <Input
                  id="page-input"
                  type="number"
                  placeholder="e.g. 5"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="h-8 text-xs"
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="annotation-input" className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                New Annotation
              </Label>
              <Textarea
                id="annotation-input"
                placeholder="Enter review feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none h-16 text-xs"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={commentMutation.isPending || !newComment.trim()}
              className="w-full h-8 text-xs font-semibold gap-1.5"
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Post Annotation
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
