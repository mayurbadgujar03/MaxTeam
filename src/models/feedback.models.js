import mongoose, { Schema } from "mongoose";
import { 
  AvailableFeedbackTypes, 
  FeedbackTypeEnum, 
  AvailableFeedbackStatuses, 
  FeedbackStatusEnum 
} from "../utils/constants.js";

const feedbackSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: AvailableFeedbackTypes,
      default: FeedbackTypeEnum.GENERAL,
    },
    status: {
      type: String,
      enum: AvailableFeedbackStatuses,
      default: FeedbackStatusEnum.PENDING,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
