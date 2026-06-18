import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { notesApi } from '@/api/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Save,
  Trash2,
  X,
  Pin,
  Lock,
  Eye,
  Pencil,
} from 'lucide-react';
import { CATEGORY_CONFIG } from '@/components/notes/NoteCard';

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'img'],
  attributes: {
    ...(defaultSchema.attributes || {}),
    img: ['src', 'alt', 'width', 'height', 'data'],
  },
  protocols: {
    ...(defaultSchema.protocols || {}),
    src: [...(defaultSchema.protocols?.src || []), 'http', 'https', 'data'],
  }
};

// ── NoteEditor ──────────────────────────────────────────────────────────────
// Props:
//   projectId     – current project's ID
//   note          – note object (null when creating new)
//   currentUserId – logged-in user's _id
//   canManage     – true if ADMIN or PROJECT_ADMIN (can edit any note)
//   onClose       – callback to close the panel
//   onNoteChange  – callback with updated note after save
// ───────────────────────────────────────────────────────────────────────────
export function NoteEditor({
  projectId,
  note,
  currentUserId,
  canManage = false,
  onClose,
  onNoteChange,
}) {
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [category, setCategory] = useState('general');
  const [isPinned, setIsPinned] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prevNoteId = useRef(null);
  const { isDark } = useTheme();
  const colorMode = isDark ? 'dark' : 'light';

  // ── Permissions ─────────────────────────────────────────────────────────
  const isOwner = currentUserId && note?.createdBy?._id === currentUserId;
  const isCreatingNew = !note;
  const canEdit = isCreatingNew || canManage || isOwner;
  const readOnly = !canEdit;

  // ── Sync state when selected note changes ────────────────────────────────
  useEffect(() => {
    if (note?._id !== prevNoteId.current) {
      setIsSwitching(true);
      const timer = setTimeout(() => {
        setTitle(note?.title ?? '');
        setContent(note?.content ?? '');
        setCategory(note?.category ?? 'general');
        setIsPinned(note?.isPinned ?? false);
        setIsPreview(false);
        setIsSwitching(false);
        prevNoteId.current = note?._id ?? null;
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [note]);

  // Reset when deselected (new note mode)
  useEffect(() => {
    if (!note) {
      setTitle('');
      setContent('');
      setCategory('general');
      setIsPinned(false);
      setIsPreview(false);
      prevNoteId.current = null;
    }
  }, [note]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      notesApi.create(projectId, {
        title: title.trim(),
        content,
        category,
        isPinned,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note created' });
      onNoteChange?.(data?.data);
      onClose?.();
    },
    onError: (err) =>
      toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      notesApi.update(projectId, note._id, {
        title: title.trim(),
        content,
        category,
        isPinned,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note saved' });
      onNoteChange?.(data?.data);
    },
    onError: (err) =>
      toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.delete(projectId, note._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
      toast({ title: 'Note deleted' });
      onClose?.();
    },
    onError: (err) =>
      toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add some content before saving.',
        variant: 'destructive',
      });
      return;
    }
    note ? updateMutation.mutate() : createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Skeleton while switching notes ───────────────────────────────────────
  if (isSwitching) {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.general;

  return (
    // data-color-mode drives @uiw/react-md-editor's internal theming
    <div className="flex flex-col h-full overflow-hidden" data-color-mode={colorMode}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b px-4 py-2 shrink-0">

        {/* Category */}
        {canEdit ? (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0', catConfig.className)}>
            {catConfig.label}
          </Badge>
        )}

        {/* Pin toggle */}
        {canEdit && (
          <Toggle
            size="sm"
            pressed={isPinned}
            onPressedChange={setIsPinned}
            aria-label="Pin note"
            className={cn('h-7 px-2 text-xs gap-1', isPinned && 'text-amber-500')}
          >
            <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-amber-500')} />
            {isPinned ? 'Pinned' : 'Pin'}
          </Toggle>
        )}

        {/* Read-only indicator */}
        {readOnly && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
            <Lock className="h-3 w-3" />
            Read-only
          </span>
        )}

        <div className="flex-1" />

        {/* Delete */}
        {canEdit && note && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        )}

        {/* Preview Toggle */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs gap-1.5 flex items-center"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        )}

        {/* Save */}
        {canEdit && (
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <><Save className="h-3.5 w-3.5" /> Save</>}
          </Button>
        )}

        {/* Close */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-1 shrink-0">
        {canEdit ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title…"
            className="border-0 p-0 text-xl font-bold shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
          />
        ) : (
          <h2 className="text-xl font-bold text-foreground">
            {title || <span className="text-muted-foreground/40 font-normal">Untitled</span>}
          </h2>
        )}
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {isPreview || !canEdit ? (
          // Read-only or Preview mode: clean rendered Markdown preview, no toolbars
          <div className="h-full overflow-y-auto px-5 py-3 prose dark:prose-invert max-w-none">
            <MDEditor.Markdown
              source={content || '_No content yet._'}
              style={{ whiteSpace: 'pre-wrap', background: 'transparent' }}
              rehypePlugins={[[rehypeSanitize, customSchema]]}
            />
          </div>
        ) : (
          // Full MDEditor with toolbar + edit/preview split — Ctrl+B, Ctrl+I, etc. all work
          <MDEditor
            value={content}
            onChange={(val) => setContent(val ?? '')}
            height="100%"
            preview="edit"
            visibleDragbar={false}
            commands={[
              commands.title,
              commands.bold,
              commands.italic,
              commands.link,
              commands.image,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.codeBlock,
            ]}
            extraCommands={[]}
            previewOptions={{
              rehypePlugins: [[rehypeSanitize, customSchema]],
            }}
            style={{
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              flex: 1,
              height: '100%',
            }}
            textareaProps={{
              placeholder: 'Write your note in Markdown…\n\n# Heading\n**Bold**, _italic_, `code`, > blockquote',
            }}
          />
        )}
      </div>
    </div>
  );
}
