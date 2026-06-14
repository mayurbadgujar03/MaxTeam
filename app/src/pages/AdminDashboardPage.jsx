import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FolderKanban, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  const resolveMutation = useMutation({
    mutationFn: (feedbackId) => adminApi.resolveFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Feedback Resolved',
        description: 'The feedback has been marked as resolved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update feedback status.',
        variant: 'destructive',
      });
    }
  });

  const stats = statsData?.data || {};
  const feedbackList = stats.recentFeedback || [];

  const getFeedbackTypeStyles = (type) => {
    switch (type) {
      case 'Bug':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Feature':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-24 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Operational Failure</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          {error.message || 'We encountered an error fetching administrative metrics. Please try again later.'}
        </p>
        <Link to="/dashboard">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Super Admin Observability
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Monitor engine activities, users, project statistics, and process incoming feedback loops.
        </p>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Users */}
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total Platform Users
            </CardTitle>
            <div className="rounded-lg p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {stats.totalUsers ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Registered accounts in database</p>
          </CardContent>
        </Card>

        {/* Card 2: Active Projects */}
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Active Project Workspaces
            </CardTitle>
            <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {stats.activeProjects ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Kanban & Spec environments</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Feedback */}
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total Feedback Logs
            </CardTitle>
            <div className="rounded-lg p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {stats.totalFeedback ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">User suggestions & reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split: Feedback Logs */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-card shadow-card">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-5">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Recent Feedback Feed
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Incoming suggestions and bug reports sorted by creation date.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {feedbackList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No feedback logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {feedbackList.map((item) => {
                const isResolving = resolveMutation.isPending && resolveMutation.variables === item._id;
                
                return (
                  <div key={item._id} className="p-6 transition-base hover:bg-slate-50/50 dark:hover:bg-slate-900/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge variant="outline" className={getFeedbackTypeStyles(item.type)}>
                          {item.type}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.user ? (
                          <>
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.user.fullname}</span> ({item.user.username})
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {item.user.email}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-400 italic">Anonymous Reporter</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center self-start shrink-0">
                      {item.status === 'resolved' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 gap-1.5 py-1 px-3.5 rounded-full font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Resolved
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-1 px-3.5 rounded-full font-semibold gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                          <Button
                            size="sm"
                            disabled={isResolving}
                            onClick={() => resolveMutation.mutate(item._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-base h-8"
                          >
                            {isResolving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Mark Resolved'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
