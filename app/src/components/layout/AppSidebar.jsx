import { Home, FolderKanban, Settings, User, LogOut, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { FlowbaseLogo } from '@/components/shared/FlowbaseLogo';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppSidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, logout } = useAuth();

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
    <>
      {/* Dark overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "group flex h-screen flex-col border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out w-64 md:w-16 md:hover:w-64 overflow-hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Link
          to="/dashboard"
          className="flex h-16 items-center justify-start border-b border-sidebar-border px-4 transition-opacity hover:opacity-80 whitespace-nowrap overflow-hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <FlowbaseLogo size="md" textClassName="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
        </Link>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent whitespace-nowrap'
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                {item.name}
              </span>
            </NavLink>
          ))}

          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent whitespace-nowrap'
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                Admin Panel
              </span>
            </NavLink>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3 px-2 whitespace-nowrap">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.avatar?.url} alt={user?.fullname || user?.username} className="object-cover" />
              <AvatarFallback className="text-sm font-medium text-muted-foreground bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.fullname || user?.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground whitespace-nowrap px-2"
            onClick={() => {
              setIsSidebarOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
              Sign out
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
}
