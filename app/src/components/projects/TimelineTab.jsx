import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, Edit2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { projectsApi } from "@/api/projects";
import AttendanceCard from "./AttendanceCard";

export default function TimelineTab({ project, currentUserRole }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [initForm, setInitForm] = useState({ startDate: "", endDate: "" });

  const isMentor = currentUserRole === "admin";
  const isLeader = currentUserRole === "project_admin";
  const canEdit = isMentor || isLeader;

  const initMutation = useMutation({
    mutationFn: (data) => projectsApi.initializeTimeline(project._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
      toast({ title: "Timeline initialized successfully!" });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err.message || "Failed to initialize timeline",
        variant: "destructive",
      }),
  });

  const handleInitialize = (e) => {
    e.preventDefault();
    initMutation.mutate(initForm);
  };

  const updateMutation = useMutation({
    mutationFn: ({ milestoneId, data }) => projectsApi.updateMilestone(project._id, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
      setEditingMilestone(null);
      toast({ title: "Milestone updated successfully" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const evaluateMutation = useMutation({
    mutationFn: ({ milestoneId, status }) => projectsApi.evaluateMilestone(project._id, milestoneId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
      toast({ title: "Milestone status updated" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setEditForm({ title: milestone.title || "", description: milestone.description || "" });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingMilestone) return;
    updateMutation.mutate({ milestoneId: editingMilestone._id, data: editForm });
  };

  if (!project?.milestones || project.milestones.length === 0) {
    if (!canEdit) {
      return (
        <div className="p-12 text-center border rounded-lg bg-card text-slate-500">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-400" />
          <p className="font-medium text-lg text-slate-800 dark:text-slate-200">Timeline Not Ready</p>
          <p className="text-sm mt-1 text-muted-foreground">
            Your Team Leader or Faculty Mentor has not yet initialized the project timeline.
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg bg-card shadow-sm">
        <div className="text-center mb-6">
          <Calendar className="h-10 w-10 mx-auto mb-2 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Initialize Project Timeline</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set the start and end dates to automatically generate your weekly milestones.
          </p>
        </div>

        <form onSubmit={handleInitialize} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">
              Project Start Date
            </label>
            <Input
              type="date"
              required
              value={initForm.startDate}
              onChange={(e) => setInitForm({ ...initForm, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">
              Expected End Date
            </label>
            <Input
              type="date"
              required
              value={initForm.endDate}
              onChange={(e) => setInitForm({ ...initForm, endDate: e.target.value })}
            />
          </div>

          <Button className="w-full mt-4" disabled={initMutation.isPending} type="submit">
            {initMutation.isPending ? "Generating Timeline..." : "Generate Timeline"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-8">
        {project.milestones.map((milestone) => {
          const isApproved = milestone.status === "APPROVED";
          const isDelayed = milestone.status === "DELAYED";
          const isPending = milestone.status === "PENDING";

          return (
            <div key={milestone._id} className="relative pl-8 md:pl-10">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 bg-background transition-colors ${isApproved
                  ? "border-green-500 bg-green-500/20"
                  : isDelayed
                    ? "border-red-500 bg-red-500/20"
                    : "border-amber-500 bg-amber-500/20"
                  }`}
              />

              <div className="bg-card border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                      <span>Week {milestone.weekNumber}: {milestone.title || "Untitled Task"}</span>
                      {isApproved && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                      {isDelayed && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
                      {isPending && <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                      {milestone.description || "No description provided."}
                    </p>
                  </div>

                  {/* Action Buttons (Top Right) */}
                  <div className="flex shrink-0">
                    {isPending && canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(milestone)}
                        title="Edit Milestone"
                      >
                        <Edit2 className="h-4 w-4 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Attendance Tracking Card */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <AttendanceCard
                    projectId={project._id}
                    milestoneId={milestone._id}
                    currentUserRole={currentUserRole}
                  />
                </div>

                {/* Mentor Evaluation Strip */}
                {isMentor && (
                  <div className="mt-5 pt-4 border-t flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={isApproved ? "default" : "outline"}
                      className={
                        isApproved
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "hover:text-green-600 hover:border-green-600"
                      }
                      onClick={() =>
                        evaluateMutation.mutate({ milestoneId: milestone._id, status: "APPROVED" })
                      }
                      disabled={evaluateMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={isDelayed ? "destructive" : "outline"}
                      className={!isDelayed ? "hover:text-red-600 hover:border-red-600" : ""}
                      onClick={() =>
                        evaluateMutation.mutate({ milestoneId: milestone._id, status: "DELAYED" })
                      }
                      disabled={evaluateMutation.isPending}
                    >
                      Mark Delayed
                    </Button>
                    {(isApproved || isDelayed) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-500"
                        onClick={() =>
                          evaluateMutation.mutate({ milestoneId: milestone._id, status: "PENDING" })
                        }
                        disabled={evaluateMutation.isPending}
                      >
                        Reset to Pending
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Week {editingMilestone?.weekNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Task Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="e.g. Literature Review"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Goals / Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Detail what needs to be accomplished..."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingMilestone(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { TimelineTab };
