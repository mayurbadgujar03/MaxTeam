import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, Users, Loader2, Calendar, FolderKanban, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { attendanceApi } from "@/api/attendance";

export default function BatchAttendanceGrid({ batchId, isHod, isCoordinator }) {
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Determine authority tier (HOD takes priority if user is both)
  const userTier = isHod ? "HOD" : isCoordinator ? "COORDINATOR" : null;

  const { data, isLoading } = useQuery({
    queryKey: ["batchAttendance", batchId, selectedWeek],
    queryFn: () => attendanceApi.getBatchWeekAttendance(batchId, selectedWeek),
    enabled: !!batchId,
  });

  const markMutation = useMutation({
    mutationFn: ({ records }) => attendanceApi.markBatchAttendance(batchId, records, userTier),
    onSuccess: () => {
      toast({ title: `${userTier} Attendance saved successfully` });
      queryClient.invalidateQueries({ queryKey: ["batchAttendance", batchId, selectedWeek] });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err.message || "Failed to save attendance",
        variant: "destructive",
      }),
  });

  const handleBulkApproveTeam = (project) => {
    // Find the milestone ID for this week
    const milestone = project.milestones?.find((m) => m.weekNumber === parseInt(selectedWeek));
    if (!milestone) {
      return toast({
        title: "No milestone found for this week",
        description: `Project ${project.name} has no milestone defined for Week ${selectedWeek}.`,
        variant: "destructive",
      });
    }

    const studentMembers = (project.members || []).filter((m) => m.role !== "admin");
    const membersToMark = studentMembers.length > 0 ? studentMembers : project.members || [];

    const records = membersToMark
      .filter((member) => member.user?._id)
      .map((member) => ({
        projectId: project._id,
        milestoneId: milestone._id,
        studentId: member.user._id,
        status: "PRESENT", // Bulk approve sets everyone to PRESENT
      }));

    if (records.length === 0) {
      return toast({
        title: "No members to mark",
        description: "This project has no registered student members.",
        variant: "destructive",
      });
    }

    markMutation.mutate({ records });
  };

  const handleSingleStudentMark = (project, member, status) => {
    const milestone = project.milestones?.find((m) => m.weekNumber === parseInt(selectedWeek));
    if (!milestone) return toast({ title: "No milestone found", variant: "destructive" });

    // Send an array of exactly ONE record to leverage the existing backend logic
    const records = [{
      projectId: project._id,
      milestoneId: milestone._id,
      studentId: member.user?._id || member._id,
      status: status
    }];

    markMutation.mutate({ records });
  };

  const projects = data?.data?.projects || [];
  const attendances = data?.data?.attendances || [];

  const filteredProjects = projects.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = p.groupNumber && p.groupNumber.toString().includes(searchQuery);
    return matchesName || matchesGroup;
  });

  const StatusBadge = ({ mark, label }) => {
    if (mark === "PRESENT") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {label}
        </span>
      );
    }
    if (mark === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded">
          <XCircle className="w-3 h-3 text-rose-600" /> {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
        <Clock className="w-3 h-3 text-slate-500" /> {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-card p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Weekly Attendance Oversight
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review Mentor marks and apply batch-level attendance approvals across all teams.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by Group No. or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs w-[200px]"
            />
          </div>

          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Select Week:</span>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  Week {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-card rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading batch attendance for Week {selectedWeek}...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-card rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <FolderKanban className="h-10 w-10 text-slate-400 mb-2 opacity-40" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No projects found for Week {selectedWeek}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Projects may not have established milestones for this week yet.
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-card rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <Search className="h-10 w-10 text-slate-400 mb-2 opacity-40" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No projects matching "{searchQuery}"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different group number or team name.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const milestone = project.milestones?.find((m) => m.weekNumber === parseInt(selectedWeek));
            const studentMembers = (project.members || []).filter((m) => m.role !== "admin");
            const membersToDisplay = studentMembers.length > 0 ? studentMembers : project.members || [];

            const teamAttendances = attendances.filter(
              (a) => a.project === project._id || a.project?.toString() === project._id?.toString()
            );

            const isTeamFullyApproved =
              membersToDisplay.length > 0 &&
              membersToDisplay.every((member) => {
                const record = teamAttendances.find(
                  (a) => (a.student?._id || a.student)?.toString() === member.user?._id?.toString()
                );
                return (userTier === "HOD" ? record?.hodMark : record?.coordinatorMark) === "PRESENT";
              });

            return (
              <div
                key={project._id}
                className="bg-card border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-slate-50">
                      {project.groupNumber ? `Group ${project.groupNumber}: ` : ''}{project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {milestone ? (
                        <>Week {selectedWeek}: <span className="font-medium text-slate-700 dark:text-slate-300">{milestone.title || "Untitled Milestone"}</span></>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Milestone not generated for this week</span>
                      )}
                    </p>
                  </div>

                  {userTier && (
                    <Button
                      size="sm"
                      variant={isTeamFullyApproved ? "secondary" : "default"}
                      disabled={isTeamFullyApproved || markMutation.isPending || !milestone}
                      onClick={() => handleBulkApproveTeam(project)}
                      className={`text-xs font-semibold ${isTeamFullyApproved
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        : ""
                        }`}
                    >
                      {markMutation.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...
                        </>
                      ) : isTeamFullyApproved ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                          Approved by {userTier}
                        </>
                      ) : (
                        `Bulk Approve Team (${userTier})`
                      )}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {membersToDisplay.map((member) => {
                    const record =
                      teamAttendances.find(
                        (a) => (a.student?._id || a.student)?.toString() === member.user?._id?.toString()
                      ) || {};

                    return (
                      <div
                        key={member.user?._id || member._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/60 dark:border-slate-800/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {member.user?.fullname || member.user?.username || "Unknown Member"}
                          </span>
                          {member.role === "project_admin" && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                              Leader
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <StatusBadge label="Mentor" mark={record.mentorMark} />

                          {userTier === "COORDINATOR" ? (
                            <div className="flex items-center gap-1 border-x px-2 mx-1 border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] font-semibold text-slate-500 mr-1 uppercase">Coord:</span>
                              <button
                                onClick={() => handleSingleStudentMark(project, member, "PRESENT")}
                                disabled={markMutation.isPending}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${record.coordinatorMark === 'PRESENT' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-100 dark:bg-slate-800 dark:text-slate-300'}`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleSingleStudentMark(project, member, "ABSENT")}
                                disabled={markMutation.isPending}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${record.coordinatorMark === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-100 dark:bg-slate-800 dark:text-slate-300'}`}
                              >
                                A
                              </button>
                            </div>
                          ) : (
                            <StatusBadge label="Coord" mark={record.coordinatorMark} />
                          )}

                          <StatusBadge label="HOD" mark={record.hodMark} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { BatchAttendanceGrid };
