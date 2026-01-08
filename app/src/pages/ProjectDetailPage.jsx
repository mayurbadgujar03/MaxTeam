import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
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
import { MembersList } from "@/components/members/MembersList";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket, joinProject } = useSocket();
  useEffect(() => {
    if (projectId && socket) {
      joinProject(projectId);

      const handleProjectUpdate = () => {
        queryClient.invalidateQueries(["tasks", projectId]);
        queryClient.invalidateQueries(["notes", projectId]);
      };
      socket.on("project_data_updated", handleProjectUpdate);

      return () => {
        socket.off("project_data_updated", handleProjectUpdate);
      };
    }
  }, [projectId, socket, queryClient, joinProject]);

  const taskIdFromUrl = searchParams.get("taskId");

  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState("todo");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
  });

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
  const canManageTasks = isAdmin || currentUserRole === "project_admin";

  // Update local state when project loads
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
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
    <div className="space-y-6 animate-fade-in">
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
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
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
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">All Notes</h3>
                {isAdmin && (
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
                )}
              </div>

              {isNotesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : notes.length > 0 ? (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <Card
                      key={note._id}
                      className={`cursor-pointer transition-all hover:border-foreground/20 ${
                        selectedNote?._id === note._id
                          ? "border-foreground/30"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedNote(note);
                        setIsCreatingNote(false);
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">
                            By {note.createdBy?.username || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {note.createdAt &&
                              formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                              })}
                          </span>
                        </div>
                        <CardDescription className="line-clamp-3 text-sm">
                          {note.content}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No notes yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="h-[500px]">
              {selectedNote || isCreatingNote ? (
                <NoteEditor
                  projectId={projectId}
                  note={selectedNote}
                  onClose={() => {
                    setSelectedNote(null);
                    setIsCreatingNote(false);
                  }}
                  isAdmin={isAdmin}
                />
              ) : (
                <CardContent className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Select a note or create a new one
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <MembersList
                projectId={projectId}
                members={projectMembers}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
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

                <div className="border-t pt-6">
                  <h4 className="mb-2 font-medium text-destructive">
                    Danger Zone
                  </h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Once you delete a project, there is no going back. Please be
                    certain.
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
              </CardContent>
            </Card>
          </TabsContent>
        )}
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
