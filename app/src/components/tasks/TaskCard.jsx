import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, MessageSquare, Trash2, Link as LinkIcon, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';

export function TaskCard({ task, onClick, onDelete, isDragging, canManageTasks = false }) {
  const statusVariant = {
    todo: 'todo',
    in_progress: 'in-progress',
    done: 'done',
    cancelled: 'cancelled',
  }[task.status];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-foreground/20 hover:shadow-soft',
        isDragging && 'rotate-2 shadow-elevated'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight flex-1">{task.title}</h4>
            {canManageTasks && onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 -mt-1 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.subtasks?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                </div>
              )}
              {task.links && task.links.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  {task.links.length}
                </div>
              )}
            </div>
            {task.assignedTo && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignedTo.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignedTo.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              {(() => {
                const due = new Date(task.dueDate);
                const overdue = isPast(due) && !isToday(due) && task.status !== 'done';
                if (overdue) {
                  return (
                    <span className="flex items-center text-destructive font-medium">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {format(due, 'MMM d')}
                    </span>
                  );
                }
                return (
                  <span className="flex items-center text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(due, 'MMM d')}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
