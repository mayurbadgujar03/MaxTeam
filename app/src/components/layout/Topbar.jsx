import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();

  const initials = user?.fullname
    ? user.fullname
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 shrink-0"
          onClick={onMenuClick}
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9"
          />
        </div>

        <NotificationsPanel />

        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatar?.url} alt={user?.fullname || user?.username} className="object-cover" />
          <AvatarFallback className="text-sm font-medium text-muted-foreground bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
