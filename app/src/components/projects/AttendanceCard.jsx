import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, UserCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { attendanceApi } from "@/api/attendance";
import { membersApi } from "@/api/members";

export default function AttendanceCard({ projectId, milestoneId, currentUserRole }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMentor = currentUserRole === "admin";

  // Local state to track mentor toggles before saving
  const [localMarks, setLocalMarks] = useState({});

  // Fetch team members (mark attendance for student members and team leaders, not the mentor)
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => membersApi.getAll(projectId),
    enabled: !!projectId,
  });

  // Fetch existing attendance for this milestone
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["attendance", projectId, milestoneId],
    queryFn: () => attendanceApi.getMilestoneAttendance(projectId, milestoneId),
    enabled: !!projectId && !!milestoneId,
  });

  const students = (membersData?.data || []).filter((m) => m.role !== "admin");
  const existingRecords = attendanceData?.data || [];

  // Sync local state with database records when they load
  useEffect(() => {
    const marks = {};
    if (Array.isArray(existingRecords)) {
      existingRecords.forEach((record) => {
        const studentId = record.student?._id || record.student;
        if (studentId) {
          marks[studentId.toString()] = record.mentorMark;
        }
      });
    }
    setLocalMarks(marks);
  }, [existingRecords]);

  const handleToggle = (studentId, status) => {
    if (!isMentor) return;
    setLocalMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? "PENDING" : status,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: (records) => attendanceApi.markMentorAttendance(projectId, milestoneId, records),
    onSuccess: () => {
      toast({ title: "Attendance saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["attendance", projectId, milestoneId] });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const records = students
      .filter((student) => student.user?._id)
      .map((student) => ({
        studentId: student.user._id,
        status: localMarks[student.user._id] || "PENDING",
      }));
    saveMutation.mutate(records);
  };

  if (!isLoadingMembers && students.length === 0) return null;

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/40 rounded-lg p-4 border border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <UserCircle2 className="h-4 w-4 text-indigo-500" /> Team Attendance
        </h4>
        {isMentor && (
          <Button
            size="sm"
            disabled={saveMutation.isPending}
            onClick={handleSave}
            className="h-7 text-xs px-2.5 font-medium shadow-sm"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              "Save Attendance"
            )}
          </Button>
        )}
      </div>

      {isLoadingMembers || isLoadingAttendance ? (
        <div className="py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading attendance...
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const status = localMarks[student.user?._id] || "PENDING";

            return (
              <div
                key={student._id}
                className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 rounded-md border border-slate-200/60 dark:border-slate-800/60 text-sm shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {student.user?.fullname || student.user?.username || "Unknown Student"}
                  </span>
                  {student.role === "project_admin" && (
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                      Leader
                    </span>
                  )}
                </div>

                {isMentor ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={status === "PRESENT" ? "default" : "outline"}
                      className={`h-7 px-2.5 text-xs font-medium transition-all ${
                        status === "PRESENT"
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-xs"
                          : "hover:text-green-600 hover:border-green-600"
                      }`}
                      onClick={() => handleToggle(student.user?._id, "PRESENT")}
                    >
                      <Check className="h-3 w-3 mr-1" /> Present
                    </Button>
                    <Button
                      size="sm"
                      variant={status === "ABSENT" ? "destructive" : "outline"}
                      className={`h-7 px-2.5 text-xs font-medium transition-all ${
                        status === "ABSENT"
                          ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs"
                          : "hover:text-rose-600 hover:border-rose-600"
                      }`}
                      onClick={() => handleToggle(student.user?._id, "ABSENT")}
                    >
                      <X className="h-3 w-3 mr-1" /> Absent
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {status === "PRESENT" && (
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Present
                      </span>
                    )}
                    {status === "ABSENT" && (
                      <span className="text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <X className="h-3 w-3" /> Absent
                      </span>
                    )}
                    {status === "PENDING" && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { AttendanceCard };
