import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar?.url} alt={user?.fullname || user?.username} className="object-cover" />
              <AvatarFallback className="text-2xl font-semibold">
                {user?.fullname
                  ? user.fullname
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  : user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user?.fullname || user?.username}</h3>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>

          {user?.fullname && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <Input value={user.fullname} disabled />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
