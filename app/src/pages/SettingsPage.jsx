import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Globe, Monitor, TestTube } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, isDark, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  
  // Load settings from localStorage
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('emailNotifications') === 'true';
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('pushNotifications') === 'true';
  });
  const [taskReminders, setTaskReminders] = useState(() => {
    const saved = localStorage.getItem('taskReminders');
    return saved === null ? true : saved === 'true';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('compactMode') === 'true';
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('emailNotifications', emailNotifications);
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('pushNotifications', pushNotifications);
    // Trigger manual notification refetch when toggled
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pushNotifications',
      newValue: String(pushNotifications),
    }));
  }, [pushNotifications]);

  useEffect(() => {
    localStorage.setItem('taskReminders', taskReminders);
  }, [taskReminders]);

  useEffect(() => {
    localStorage.setItem('compactMode', compactMode);
  }, [compactMode]);

  const generateTestNotification = () => {
    const notifications = [
      {
        _id: `test-${Date.now()}`,
        type: 'project',
        message: 'You were added to "Website Redesign" project',
        description: 'John Doe added you as a team member',
        projectId: '507f1f77bcf86cd799439011', // Sample project ID
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        _id: `test-${Date.now() + 1}`,
        type: 'task',
        message: 'New task assigned: "Update landing page"',
        description: 'Sarah Johnson assigned you a new task in Marketing Campaign',
        projectId: '507f1f77bcf86cd799439012',
        taskId: '507f1f77bcf86cd799439020',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        _id: `test-${Date.now() + 2}`,
        type: 'task',
        message: 'Task updated: "Fix navigation bug"',
        description: 'Mike Chen changed status to In Progress in Mobile App',
        projectId: '507f1f77bcf86cd799439013',
        taskId: '507f1f77bcf86cd799439021',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        _id: `test-${Date.now() + 3}`,
        type: 'member',
        message: 'Jane Smith joined your project',
        description: 'Mobile App Development has a new team member',
        projectId: '507f1f77bcf86cd799439013',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        _id: `test-${Date.now() + 4}`,
        type: 'task',
        message: 'Deadline approaching: "Complete API integration"',
        description: 'Due in 2 hours in Backend Development',
        projectId: '507f1f77bcf86cd799439014',
        taskId: '507f1f77bcf86cd799439022',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        _id: `test-${Date.now() + 5}`,
        type: 'task',
        message: 'Task completed: "Database migration"',
        description: 'Alex Rodriguez marked the task as done in Backend Development',
        projectId: '507f1f77bcf86cd799439014',
        taskId: '507f1f77bcf86cd799439023',
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    addNotification(randomNotification);
    
    toast({
      title: 'Test notification added',
      description: 'Click the bell icon to see it. You can click on it to navigate!',
    });
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold align-middle animate-slow-blink">BETA</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your projects
              </p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch 
              id="push-notifications" 
              checked={pushNotifications}
              onCheckedChange={(checked) => {
                setPushNotifications(checked);
                toast({
                  title: checked ? 'Notifications enabled' : 'Notifications disabled',
                  description: checked 
                    ? 'You will now receive push notifications' 
                    : 'Push notifications have been turned off',
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="task-reminders">Task Reminders
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold align-middle animate-slow-blink">BETA</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming task deadlines
              </p>
            </div>
            <Switch 
              id="task-reminders" 
              checked={taskReminders}
              onCheckedChange={setTaskReminders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks and feels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={setLightTheme}
                className="flex h-auto flex-col gap-2 p-4"
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={setDarkTheme}
                className="flex h-auto flex-col gap-2 p-4"
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={setSystemTheme}
                className="flex h-auto flex-col gap-2 p-4"
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
