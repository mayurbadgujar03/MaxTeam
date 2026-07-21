import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '@/api/projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  LayoutGrid,
  List,
  FolderKanban,
  Users,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scopeTab, setScopeTab] = useState('my'); // 'my' or 'all'
  const { activeWorkspace, workspaces, user } = useAuth();

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleNotification = () => {
        queryClient.invalidateQueries(["projects", activeWorkspace]);
      };

      socket.on("notification_received", handleNotification);

      return () => {
        socket.off("notification_received", handleNotification);
      };
    }
  }, [socket, queryClient, activeWorkspace]);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', activeWorkspace],
    queryFn: () => projectsApi.getAll(activeWorkspace),
  });

  const projects = projectsData?.data || [];

  const isHod = workspaces?.find(ws => ws._id === activeWorkspace)?.isHod || false;
  // User is coordinator/admin if they see projects where they are not a member
  const isWorkspaceAdmin = activeWorkspace !== 'PERSONAL' && (
    isHod || projects.some(p => !p.members?.some(m => m.user?._id === user?._id))
  );

  // Filter projects by direct membership if 'My Projects' tab is active
  const isMember = (project) => project.members?.some(m => m.user?._id === user?._id);
  const displayedProjects = isWorkspaceAdmin && scopeTab === 'my'
    ? projects.filter(isMember)
    : projects;

  // Group projects by Batch profile
  const groupedProjects = displayedProjects.reduce((acc, project) => {
    const batchName = project.batchId?.name || "Uncategorized Projects";
    if (!acc[batchName]) {
      acc[batchName] = {
        name: batchName,
        department: project.batchId?.department || null,
        projects: [],
      };
    }
    acc[batchName].projects.push(project);
    return acc;
  }, {});

  const groupedArray = Object.values(groupedProjects);
  const sortedGroups = groupedArray.sort((a, b) => {
    if (a.name === "Uncategorized Projects") return 1;
    if (b.name === "Uncategorized Projects") return -1;
    return a.name.localeCompare(b.name);
  });

  // Helper to render project list/grid card
  const renderProjectCard = (project) => {
    if (viewMode === 'grid') {
      return (
        <Link key={project._id} to={`/projects/${project._id}`}>
          <Card className="h-full cursor-pointer hover-lift border border-slate-200 dark:border-slate-800 bg-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FolderKanban className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="mt-3 text-base text-slate-900 dark:text-slate-50">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-slate-500 dark:text-slate-400">
                {project.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {project.members?.length || 0} {project.members?.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {formatDistanceToNow(new Date(project.updatedAt || project.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    }

    return (
      <Link key={project._id} to={`/projects/${project._id}`}>
        <Card className="cursor-pointer hover-lift border border-slate-200 dark:border-slate-800 bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{project.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {project.description || 'No description'}
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span>
                  {project.members?.length || 0} {project.members?.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  {formatDistanceToNow(new Date(project.updatedAt || project.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground">Manage and organize your work</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(viewMode === 'grid' && 'bg-background shadow-sm')}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(viewMode === 'list' && 'bg-background shadow-sm')}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {(activeWorkspace === 'PERSONAL' || isHod) && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Scope Selector Tabs for HOD/Coordinators */}
      {isWorkspaceAdmin && (
        <div className="flex items-center border-b pb-[1px] space-x-1">
          <Button
            variant="ghost"
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-none border-b-2 transition-all relative",
              scopeTab === 'my'
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setScopeTab('my')}
          >
            My Projects
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-none border-b-2 transition-all relative",
              scopeTab === 'all'
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setScopeTab('all')}
          >
            All Workspace Projects
          </Button>
        </div>
      )}

      {/* Main Body */}
      {isLoading ? (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-2'
        )}>
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : projects.length > 0 ? (
        activeWorkspace === 'PERSONAL' ? (
          /* PERSONAL workspace projects render flat */
          viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedProjects.map(renderProjectCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedProjects.map(renderProjectCard)}
            </div>
          )
        ) : (
          /* Institutional Workspace projects render grouped inside Accordions */
          <Accordion type="multiple" defaultValue={sortedGroups.map(g => g.name)} className="w-full space-y-4">
            {sortedGroups.map((group) => (
              <AccordionItem key={group.name} value={group.name} className="border border-slate-200 dark:border-slate-800 rounded-lg bg-card px-4 py-1">
                <AccordionTrigger className="hover:no-underline font-semibold py-4">
                  <div className="flex flex-wrap items-center gap-3 text-left">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{group.name}</span>
                    {group.department && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400">
                        {group.department}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({group.projects.length} {group.projects.length === 1 ? 'Project' : 'Projects'})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-3">
                  {viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {group.projects.map(renderProjectCard)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.projects.map(renderProjectCard)}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      ) : (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 font-medium">No projects yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {activeWorkspace === 'PERSONAL' || isHod
                ? 'Create your first project to get started'
                : 'You have not been assigned to any projects in this workspace yet.'}
            </p>
            {(activeWorkspace === 'PERSONAL' || isHod) && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
