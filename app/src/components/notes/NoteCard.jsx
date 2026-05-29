import { formatDistanceToNow } from 'date-fns';
import { Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Category config ────────────────────────────────────────────────────────
export const CATEGORY_CONFIG = {
  general:      { label: 'General',      className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  meeting:      { label: 'Meeting',      className: 'bg-blue-100  text-blue-700  dark:bg-blue-900/40 dark:text-blue-300' },
  architecture: { label: 'Architecture', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  todo:         { label: 'To‑Do',        className: 'bg-green-100 text-green-700  dark:bg-green-900/40 dark:text-green-300' },
  decision:     { label: 'Decision',     className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

function getInitials(fullname, username) {
  if (fullname) {
    return fullname
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (username?.charAt(0) || 'U').toUpperCase();
}

// Strip Markdown tokens for the card preview
function stripMarkdown(text = '') {
  return text
    .replace(/#{1,6}\s+/g, '')          // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // inline code / fenced
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[.*?\]\([^)]+\)/g, '')   // images
    .replace(/^\s*[-*+]\s+/gm, '')       // list bullets
    .replace(/^\s*\d+\.\s+/gm, '')       // numbered list
    .replace(/\n+/g, ' ')               // collapse newlines
    .trim();
}

// ── NoteCard ───────────────────────────────────────────────────────────────
export function NoteCard({ note, isSelected, onClick }) {
  const cat = CATEGORY_CONFIG[note.category] ?? CATEGORY_CONFIG.general;
  const author = note.createdBy;
  const updatedAuthor = note.updatedBy;

  const displayDate = note.updatedAt
    ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
    : note.createdAt
    ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border bg-card p-4 cursor-pointer',
        'transition-all duration-150 hover:border-foreground/25 hover:shadow-sm',
        isSelected && 'border-foreground/30 shadow-sm ring-1 ring-foreground/10',
      )}
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <span className="absolute top-3 right-3 text-amber-500">
          <Pin className="h-3.5 w-3.5 fill-amber-500" />
        </span>
      )}

      {/* Category + Title row */}
      <div className="flex items-start gap-2 pr-6">
        <Badge className={cn('shrink-0 text-[10px] px-1.5 py-0 font-medium border-0', cat.className)}>
          {cat.label}
        </Badge>
      </div>

      {note.title && (
        <p className="font-semibold text-sm leading-snug line-clamp-1">
          {note.title}
        </p>
      )}

      {/* Content preview — stripped of Markdown syntax */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {stripMarkdown(note.content)}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-1">
        <Avatar className="h-5 w-5">
          <AvatarImage src={author?.avatar?.url} alt={author?.fullname} className="object-cover" />
          <AvatarFallback className="text-[9px]">
            {getInitials(author?.fullname, author?.username)}
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-muted-foreground truncate">
          {updatedAuthor && updatedAuthor._id !== author?._id
            ? `Edited by ${updatedAuthor.fullname || updatedAuthor.username}`
            : (author?.fullname || author?.username || 'Unknown')}
        </span>
        {displayDate && (
          <>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{displayDate}</span>
          </>
        )}
      </div>
    </div>
  );
}
