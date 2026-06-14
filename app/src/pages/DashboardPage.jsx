import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '@/api/projects';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus, ArrowRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const projects = projectsData?.data || [];
  const recentProjects = Array.isArray(projects) ? projects.slice(0, 4) : [];
  const stats = statsData?.data || {};
  const priorityTasks = stats.priorityTasks || [];

  const isUrgent = stats.activeTasks > 10;
  const isOverdue = stats.overdueTasks > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Welcome back, {user?.fullname || user?.username}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Projects */}
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isStatsLoading ? '—' : stats.totalProjects || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Active workspaces</p>
          </CardContent>
        </Card>

        {/* Card 2: My Active Tasks */}
        <Card className={cn(
          "hover-lift border transition-base bg-card",
          isUrgent ? "border-destructive/30 bg-destructive/[0.01]" : "border-slate-200 dark:border-slate-800"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              My Active Tasks
            </CardTitle>
            <Clock className={cn("h-4 w-4", isUrgent ? "text-destructive" : "text-slate-400")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold text-slate-900 dark:text-slate-50", isUrgent && "text-destructive")}>
              {isStatsLoading ? '—' : stats.activeTasks || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-400">Assigned to you</p>
              {isUrgent && (
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider animate-pulse">
                  Urgent Action
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tasks Completed */}
        <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Tasks Completed (7 Days)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isStatsLoading ? '—' : stats.completedTasks || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Completed by you</p>
          </CardContent>
        </Card>

        {/* Card 4: Overdue Tasks */}
        <Card className={cn(
          "hover-lift border transition-base bg-card",
          isOverdue ? "border-destructive/30 bg-destructive/[0.01]" : "border-slate-200 dark:border-slate-800"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Overdue Tasks
            </CardTitle>
            <AlertTriangle className={cn("h-4 w-4", isOverdue ? "text-destructive" : "text-slate-400")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold text-slate-900 dark:text-slate-50", isOverdue && "text-destructive")}>
              {isStatsLoading ? '—' : stats.overdueTasks || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Split Content layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: My Priorities (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">My Priorities</h2>
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
              {priorityTasks.length} Urgent {priorityTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          {isStatsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-slate-200 dark:border-slate-800">
                  <CardHeader className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : priorityTasks.length > 0 ? (
            <div className="space-y-3">
              {priorityTasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/projects/${task.project?._id}?taskId=${task._id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-card transition-base hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:translate-x-1 cursor-pointer block"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
                        {task.title}
                      </h4>
                      {task.project?.name && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50">
                          {task.project.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          task.status === 'in_progress' ? "bg-blue-500 animate-pulse" : "bg-slate-400"
                        )} />
                        {task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                      </span>
                    </div>
                  </div>
                  {task.priority && (
                    <div className="shrink-0">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-md",
                        task.priority === 'High' || task.priority === 'high' ? "text-rose-600 bg-rose-500/10" : "text-amber-600 bg-amber-500/10"
                      )}>
                        {task.priority}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center px-4">
                <CheckCircle className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">All caught up!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                  You have no pending tasks assigned to you.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Recent Projects sidebar (1/3 width) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Recent Projects</h2>
            <Link to="/projects">
              <Button variant="ghost" size="sm" className="text-xs transition-base">
                View all
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-slate-200 dark:border-slate-800">
                  <CardHeader className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link key={project._id} to={`/projects/${project._id}`} className="block">
                  <Card className="hover-lift border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
                    <CardHeader className="p-4 space-y-1">
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-none">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center px-4">
                <FolderKanban className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">No projects yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[150px]">
                  Create your first project to get started.
                </p>
                <Link to="/projects">
                  <Button size="sm" className="transition-base">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
