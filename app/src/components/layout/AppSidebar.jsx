import { Home, FolderKanban, Settings, User, LogOut, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
          "flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link
          to="/dashboard"
          className="flex h-16 items-center justify-center border-b border-sidebar-border px-6 transition-opacity hover:opacity-80"
          onClick={() => setIsSidebarOpen(false)}
        >
          <img src="/logo.png" alt="Flowbase" className="h-14 w-auto" />
        </Link>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent'
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}

          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent'
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Shield className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar?.url} alt={user?.fullname || user?.username} className="object-cover" />
              <AvatarFallback className="text-sm font-medium text-muted-foreground bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.fullname || user?.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsSidebarOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
