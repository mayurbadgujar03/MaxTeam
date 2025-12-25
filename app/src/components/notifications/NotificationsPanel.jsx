import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, FolderKanban, CheckSquare, Users, Mail, UserPlus, UserMinus, Edit } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const notificationIcons = {
  project_added: FolderKanban,
  project_updated: Edit,
  member_joined: UserPlus,
  member_removed: UserMinus,
  task_assigned: CheckSquare,
  task_completed: CheckSquare,
  default: Bell,
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onNavigate }) => {
  const Icon = notificationIcons[notification.type] || notificationIcons.default;
  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
    
    // Navigate to relevant page
    // Convert ObjectId to string if needed
    const projectId = notification.projectId?._id || notification.projectId;
    const taskId = notification.taskId?._id || notification.taskId;
    
    if (taskId && projectId) {
      // For task notifications, navigate to project with task query param
      onNavigate(`/projects/${projectId}?taskId=${taskId}`);
    } else if (projectId) {
      // For project notifications, navigate to project page
      onNavigate(`/projects/${projectId}`);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 border-b p-4 transition-colors hover:bg-muted/50 cursor-pointer',
        !notification.read && 'bg-primary/5'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          notification.read ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        <Icon className={cn('h-5 w-5', notification.read ? 'text-muted-foreground' : 'text-primary')} />
      </div>
      
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm', !notification.read && 'font-medium')}>
          {notification.message || notification.title}
        </p>
        {notification.description && (
          <p className="text-xs text-muted-foreground">{notification.description}</p>
        )}
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>

      <div className="flex flex-shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification._id);
            }}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const handleNavigate = (path) => {
    setOpen(false); // Close dropdown
    navigate(path);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
