import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { projectsApi } from "@/api/projects";
import { tasksApi } from "@/api/tasks";
import { notesApi } from "@/api/notes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteCard, CATEGORY_CONFIG } from "@/components/notes/NoteCard";
import { MembersList } from "@/components/members/MembersList";
import { CodeTrackTab } from "@/components/projects/CodeTrackTab";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Settings,
  FileText,
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Loader2,
  GitBranch,
  Search,
  Pin,
  Presentation,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Sanitizes embed URLs for Canva and Overleaf.
 * - Canva HTML blob: extracts the src URL from pasted <iframe> markup.
 * - Canva shortlink (canva.link): returns 'INVALID_SHORTLINK' — CORS blocks resolution.
 * - Canva standard/edit link: strips query params, forces /view?embed format.
 * - Overleaf: passes through unchanged (fully iframe-friendly).
 */
const sanitizeEmbedUrl = (url, type) => {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (type === 'canva') {
    // Scenario 1: They pasted the entire HTML embed blob
    if (cleanUrl.includes('<iframe')) {
      const match = cleanUrl.match(/src="([^"]+)"/);
      if (match && match[1]) return match[1];
    }

    // Scenario 2: They pasted the blocked shortlink
    if (cleanUrl.includes('canva.link')) {
      return 'INVALID_SHORTLINK';
    }

    // Scenario 3: Standard View or Edit link
    if (cleanUrl.includes('canva.com/design')) {
      const baseUrl = cleanUrl.split('?')[0]; // Strip existing tracking parameters

      // Force it into the proper embed format
      if (baseUrl.endsWith('/view') || baseUrl.endsWith('/edit')) {
        return baseUrl.replace('/edit', '/view') + '?embed';
      }
      return baseUrl + '/view?embed'; // Fallback
    }
  }

  if (type === 'overleaf') {
    return cleanUrl; // Overleaf handles itself
  }

  return cleanUrl;
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const taskIdFromUrl = searchParams.get("taskId");

  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState("todo");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteCategory, setNoteCategory] = useState("all");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGithubRepoUrl, setProjectGithubRepoUrl] = useState("");
  const [projectCanvaUrl, setProjectCanvaUrl] = useState("");
  const [projectOverleafUrl, setProjectOverleafUrl] = useState("");

  const {
    data: projectData,
    isLoading: isProjectLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Access Revoked",
        description: error?.message || "You have been removed from this project.",
        variant: "destructive",
      });
      navigate("/projects");
    }
  }, [isError, error, navigate, toast]);

  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksApi.getAll(projectId),
    enabled: !!projectId,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: notesData, isLoading: isNotesLoading } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => notesApi.getAll(projectId),
    enabled: !!projectId,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const updateProjectMutation = useMutation({
    mutationFn: () => {
      if (!projectName?.trim()) {
        throw new Error("Project name is required");
      }
      if (projectCanvaUrl && projectCanvaUrl.includes('canva.link')) {
        throw new Error(
          "Canva shortlinks are not allowed. Please use the Smart URL from the Embed menu."
        );
      }
      return projectsApi.update(projectId, {
        name: projectName.trim(),
        description: projectDescription.trim(),
        githubRepoUrl: projectGithubRepoUrl.trim(),
        canvaUrl: projectCanvaUrl.trim(),
        overleafUrl: projectOverleafUrl.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project updated" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast({ title: "Project deleted" });
      navigate("/projects");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const project = projectData?.data?.project;
  const projectMembers = projectData?.data?.projectMembers || [];
  const tasks = tasksData?.data || [];
  const notes = notesData?.data || [];

  const currentUserRole = projectMembers.find(
    (m) => m.user?._id === user?._id,
  )?.role;
  const isAdmin = currentUserRole === "admin";
  // Both Mentor (admin) and Team Leader (project_admin) can manage the project
  const canManageProject = isAdmin || currentUserRole === "project_admin";
  const canManageTasks = canManageProject;

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
      setProjectGithubRepoUrl(project.githubRepoUrl || "");
      setProjectCanvaUrl(project.canvaUrl || "");
      setProjectOverleafUrl(project.overleafUrl || "");
    }
  }, [project]);

  const handleCreateTask = (status) => {
    setDefaultTaskStatus(status);
    setIsCreateTaskOpen(true);
  };

  if (isProjectLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button variant="link" onClick={() => navigate("/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="tasks" className="gap-2 shrink-0">
            <CheckSquare className="h-4 w-4" />
            Task Board
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2 shrink-0">
            <FileText className="h-4 w-4" />
            Project Notes
          </TabsTrigger>
          <TabsTrigger value="presentations" className="gap-2 shrink-0">
            <Presentation className="h-4 w-4" />
            Presentations
          </TabsTrigger>
          <TabsTrigger value="documentation" className="gap-2 shrink-0">
            <BookOpen className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="codetrack" className="gap-2 shrink-0">
            <GitBranch className="h-4 w-4" />
            Code & Commits
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 shrink-0">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          {canManageProject && (
            <TabsTrigger value="settings" className="gap-2 shrink-0">
              <Settings className="h-4 w-4" />
              Project Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          {isTasksLoading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-80 flex-shrink-0">
                  <Skeleton className="h-96 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              projectId={projectId}
              onCreateTask={handleCreateTask}
              canManageTasks={canManageTasks}
              currentUserId={user?._id}
              currentUserRole={currentUserRole}
              initialTaskId={taskIdFromUrl}
              onTaskModalClose={() => setSearchParams({})}
            />
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-6">
            {/* ── Left panel: list + search + filters ── */}
            <div className="flex flex-col gap-3 h-[300px] lg:h-[calc(100vh-200px)] overflow-y-auto lg:overflow-visible min-h-0 shrink-0 border-b pb-6 lg:border-b-0 lg:pb-0">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Notes</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedNote(null);
                    setIsCreatingNote(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Note
                </Button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="notes-search"
                  placeholder="Search notes…"
                  className="pl-8 h-8 text-sm"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                />
              </div>

              {/* Category filter chips */}
              <div className="flex flex-wrap gap-1.5 font-sans">
                {['all', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoteCategory(cat)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors ${noteCategory === cat
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
                      }`}
                  >
                    {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label}
                  </button>
                ))}
              </div>

              {/* Note list */}
              {isNotesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-14 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filtered = notes.filter((n) => {
                  const matchCat = noteCategory === 'all' || n.category === noteCategory;
                  const q = noteSearch.toLowerCase();
                  const matchSearch =
                    !q ||
                    n.title?.toLowerCase().includes(q) ||
                    n.content?.toLowerCase().includes(q);
                  return matchCat && matchSearch;
                });

                return filtered.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {filtered.map((note) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        isSelected={selectedNote?._id === note._id}
                        onClick={() => {
                          setSelectedNote(note);
                          setIsCreatingNote(false);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {noteSearch || noteCategory !== 'all'
                        ? 'No notes match your filters'
                        : 'No notes yet — create the first one!'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* ── Right panel: editor ── */}
            <Card className="min-h-[500px] lg:h-[calc(100vh-200px)] flex flex-col overflow-hidden">
              {selectedNote || isCreatingNote ? (
                <NoteEditor
                  projectId={projectId}
                  note={selectedNote}
                  currentUserId={user?._id}
                  canManage={canManageProject}
                  onClose={() => {
                    setSelectedNote(null);
                    setIsCreatingNote(false);
                  }}
                  onNoteChange={(updated) => {
                    if (updated) setSelectedNote(updated);
                  }}
                />
              ) : (
                <CardContent className="flex h-full flex-col items-center justify-center gap-2">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presentations" className="mt-6">
          {project?.canvaUrl ? (
            sanitizeEmbedUrl(project.canvaUrl, 'canva') === 'INVALID_SHORTLINK' ? (
              <Card className="border-destructive/30">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="rounded-full bg-destructive/10 p-4">
                    <Presentation className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-destructive">Shortlink Blocked by Canva</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Canva does not allow shortlinks (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">canva.link</code>) in external apps.
                    Please go to{" "}
                    {canManageProject ? (
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        Project Settings
                      </button>
                    ) : (
                      <span className="font-medium">Project Settings</span>
                    )}{" "}
                    and paste the full "View Only" link instead.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    In Canva: <strong>Share → Collaboration Link → Anyone with the link: Can view</strong> → Copy the full URL.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-0 w-full overflow-hidden">
                  <iframe
                    src={sanitizeEmbedUrl(project.canvaUrl, 'canva')}
                    title="Canva Presentation"
                    className="w-full max-w-full border-0 rounded-lg"
                    style={{ height: '600px' }}
                    allowFullScreen
                  />
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="rounded-full bg-muted p-4">
                  <Presentation className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No Presentation Linked Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Add a Canva presentation URL in{" "}
                  {canManageProject ? (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Project Settings
                    </button>
                  ) : (
                    <span className="font-medium">Project Settings</span>
                  )}{" "}
                  to embed your slides here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          {project?.overleafUrl ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="rounded-full bg-primary/10 p-5">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Overleaf Documentation</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Your project documentation is hosted on Overleaf and will open securely in a new tab.
                </p>
                <Button asChild size="lg" className="mt-2 gap-2">
                  <a
                    href={project.overleafUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="h-4 w-4" />
                    Open in Overleaf
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="rounded-full bg-muted p-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No Documentation Linked Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Add an Overleaf read-only URL in{" "}
                  {canManageProject ? (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Project Settings
                    </button>
                  ) : (
                    <span className="font-medium">Project Settings</span>
                  )}{" "}
                  to link your document here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <MembersList
                projectId={projectId}
                members={projectMembers}
                isAdmin={isAdmin}
                canManageProject={canManageProject}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageProject && (
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Update your project details or delete the project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Code Track – GitHub Repo URL */}
                <div className="space-y-2">
                  <Label htmlFor="github-repo-url" className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    GitHub Repository URL
                  </Label>
                  <Input
                    id="github-repo-url"
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    value={projectGithubRepoUrl}
                    onChange={(e) => setProjectGithubRepoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used by Code Track to fetch commit history. Must be a public repository, or ensure a <code className="font-mono">GITHUB_PAT</code> is configured on the server.
                  </p>
                </div>

                {/* Presentations – Canva URL */}
                <div className="space-y-2">
                  <Label htmlFor="canva-url" className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-muted-foreground" />
                    Canva Presentation URL
                  </Label>
                  <Input
                    id="canva-url"
                    placeholder="https://www.canva.com/design/.../view"
                    value={projectCanvaUrl}
                    onChange={(e) => setProjectCanvaUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    In Canva: <strong>Share → Scroll down to Embed → Generate Embed URL → Copy the Smart URL.</strong>{" "}
                    You can also paste the full HTML embed code — the URL will be extracted automatically.
                    <strong className="text-destructive"> Do not use shortlinks (canva.link).</strong>
                  </p>
                </div>

                {/* Documentation – Overleaf URL */}
                <div className="space-y-2">
                  <Label htmlFor="overleaf-url" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Overleaf Read-Only URL
                  </Label>
                  <Input
                    id="overleaf-url"
                    type="url"
                    placeholder="https://www.overleaf.com/read/..."
                    value={projectOverleafUrl}
                    onChange={(e) => setProjectOverleafUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the read-only sharing link from Overleaf so team members can view the document.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => updateProjectMutation.mutate()}
                    disabled={
                      updateProjectMutation.isPending || !projectName?.trim()
                    }
                  >
                    {updateProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>

                {/* Danger Zone — only the Mentor (admin) can delete the project */}
                {isAdmin && (
                  <div className="border-t pt-6">
                    <h4 className="mb-2 font-medium text-destructive">
                      Danger Zone
                    </h4>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Once you delete a project, there is no going back. Please
                      be certain.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this project?")
                        ) {
                          deleteProjectMutation.mutate();
                        }
                      }}
                      disabled={deleteProjectMutation.isPending}
                    >
                      {deleteProjectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete Project
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Code Track Tab – always visible, shows empty state if no GitHub URL */}
        <TabsContent value="codetrack" className="mt-6">
          {project?.githubRepoUrl ? (
            <CodeTrackTab projectId={projectId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="rounded-full bg-muted p-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No Repository Linked Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Add a GitHub repository URL in{" "}
                  {canManageProject ? (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Project Settings
                    </button>
                  ) : (
                    <span className="font-medium">Project Settings</span>
                  )}{" "}
                  to track commits and code contributions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskModal
        projectId={projectId}
        members={projectMembers}
        defaultStatus={defaultTaskStatus}
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </div>
  );
}
