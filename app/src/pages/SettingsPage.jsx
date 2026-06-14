import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Moon, Sun, Monitor, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, isDark, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const { toast } = useToast();

  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('pushNotifications') === 'true';
  });

  const [permission, setPermission] = useState(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pushNotifications', pushNotifications);
    // Trigger notification refetch in context
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pushNotifications',
      newValue: String(pushNotifications),
    }));
  }, [pushNotifications]);

  const handlePushToggle = async (checked) => {
    if (checked) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          setPushNotifications(true);
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications in this browser.',
          });
        } else {
          setPushNotifications(false);
          toast({
            title: 'Permission Denied',
            description: 'Please enable notifications in your browser settings to receive updates.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Not Supported',
          description: 'Push notifications are not supported by this browser.',
          variant: 'destructive',
        });
      }
    } else {
      setPushNotifications(false);
      toast({
        title: 'Notifications Disabled',
        description: 'Push notifications have been turned off.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalize your system preferences and toggle integrations.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-card bg-card overflow-hidden">
        <CardContent className="divide-y divide-slate-200 dark:divide-slate-800 p-0">
          
          {/* Section 1: Appearance */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                )}
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Appearance</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose how Flowbase looks on your device. Sync with your system or choose a custom mode.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Light Option */}
              <button
                type="button"
                onClick={setLightTheme}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 text-center transition-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                  theme === 'light'
                    ? "border-primary bg-primary/[0.04] text-primary"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "rounded-lg p-2 transition-base",
                  theme === 'light' ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <Sun className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-wide uppercase">Light</span>
              </button>

              {/* Dark Option */}
              <button
                type="button"
                onClick={setDarkTheme}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 text-center transition-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                  theme === 'dark'
                    ? "border-primary bg-primary/[0.04] text-primary"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "rounded-lg p-2 transition-base",
                  theme === 'dark' ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <Moon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-wide uppercase">Dark</span>
              </button>

              {/* System Option */}
              <button
                type="button"
                onClick={setSystemTheme}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 text-center transition-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                  theme === 'system'
                    ? "border-primary bg-primary/[0.04] text-primary"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "rounded-lg p-2 transition-base",
                  theme === 'system' ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <Monitor className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-wide uppercase">System</span>
              </button>
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Notifications</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose how you receive important alerts, task assignments, and progress updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 transition-base hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <div className="space-y-1">
                <Label htmlFor="push-notifications" className="text-base font-semibold text-slate-900 dark:text-slate-50 cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Receive browser-level alerts when tasks are assigned to you or updated.
                </p>
              </div>
              <div className="flex items-center">
                <Switch 
                  id="push-notifications" 
                  checked={pushNotifications}
                  onCheckedChange={handlePushToggle}
                  className="transition-base"
                />
              </div>
            </div>

            {/* Permission feedback alerts */}
            {pushNotifications && permission === 'granted' && (
              <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 animate-slide-up">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    System Notifications Active
                  </h4>
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90">
                    Browser notification permission is GRANTED. You are successfully configured to receive real-time dashboard notifications.
                  </p>
                </div>
              </div>
            )}

            {!pushNotifications && permission === 'denied' && (
              <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 animate-slide-up">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                    Browser Blocked Notifications
                  </h4>
                  <p className="text-xs text-rose-700/90 dark:text-rose-400/90">
                    Notifications are blocked by your browser. Please reset site permissions in your browser's address bar to enable push notifications.
                  </p>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
