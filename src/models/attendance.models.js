import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    milestoneId: { type: Schema.Types.ObjectId, required: true }, // Links to project.milestones._id
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true }, // Crucial for fast Coordinator/HOD queries

    // Tier 1: Mentor
    mentorMark: { type: String, enum: ["PENDING", "PRESENT", "ABSENT"], default: "PENDING" },
    mentorMarkedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    mentorMarkedAt: { type: Date, default: null },

    // Tier 2: Coordinator
    coordinatorMark: { type: String, enum: ["PENDING", "PRESENT", "ABSENT"], default: "PENDING" },
    coordinatorMarkedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    coordinatorMarkedAt: { type: Date, default: null },

    // Tier 3: HOD
    hodMark: { type: String, enum: ["PENDING", "PRESENT", "ABSENT"], default: "PENDING" },
    hodMarkedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    hodMarkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for the same student in the same week
attendanceSchema.index({ project: 1, milestoneId: 1, student: 1 }, { unique: true });

// Optimize Batch-level queries for the Coordinator/HOD Dashboard Grid
attendanceSchema.index({ batch: 1, milestoneId: 1 });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
