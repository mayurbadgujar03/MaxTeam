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
import DocumentHubTab from "@/components/projects/DocumentHubTab";
import { CodeTrackTab } from "@/components/projects/CodeTrackTab";
import TimelineTab from "@/components/projects/TimelineTab";
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
  BookOpen,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";


export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const taskIdFromUrl = searchParams.get("taskId");

  // Read active tab from URL, default to "tasks"
  const activeTab = searchParams.get("tab") || "tasks";

  // Update URL without pushing a new history state (prevents breaking the back button)
  const setActiveTab = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", value);
      return next;
    }, { replace: true });
  };
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState("todo");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteCategory, setNoteCategory] = useState("all");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGithubRepoUrl, setProjectGithubRepoUrl] = useState("");

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
  });

  const { data: notesData, isLoading: isNotesLoading } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => notesApi.getAll(projectId),
    enabled: !!projectId,
  });

  const updateProjectMutation = useMutation({
    mutationFn: () => {
      if (!projectName?.trim()) {
        throw new Error("Project name is required");
      }
      return projectsApi.update(projectId, {
        name: projectName.trim(),
        description: projectDescription.trim(),
        githubRepoUrl: projectGithubRepoUrl.trim(),
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
    }
  }, [project]);

  const handleCreateTask = (status) => {
    setDefaultTaskStatus(status);
    setIsCreateTaskOpen(true);
  };

  if (isProjectLoading) {
    return (
      <div className="space-y-6 animate-fade-in px-3 py-4 md:px-6 lg:px-8">
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
    <div className="space-y-6 animate-fade-in px-3 py-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full flex justify-center border-b border-border/40 pb-2">
          <TabsList className="mx-auto w-fit max-w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger value="tasks" className="gap-2 shrink-0">
              <CheckSquare className="h-4 w-4" />
              Task Board
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 shrink-0">
              <FileText className="h-4 w-4" />
              Project Notes
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
        </div>

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

        <TabsContent value="timeline" className="mt-6">
          <TimelineTab project={project} currentUserRole={currentUserRole} />
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


        <TabsContent value="documentation" className="mt-6">
          <DocumentHubTab project={project} canManageProject={canManageProject} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="w-full">
            <CardContent className="p-3 sm:p-4 md:p-6">
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
            <Card className="w-full">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xl md:text-2xl lg:text-3xl">Project Settings</CardTitle>
                <CardDescription>
                  Update your project details or delete the project.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-6">
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
                  <div className="border-t pt-4 sm:pt-6">
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
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 py-12 sm:py-20 gap-3">
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
