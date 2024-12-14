import { model, Schema, Types } from "mongoose";

const SentimentHistorySchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    history_group_id: {
      forSequence: { type: Number, required: true },
      divide_in_to_groups: { type: Number, required: true },
    },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    time_stamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Add an index for better query performance
SentimentHistorySchema.index({ user_id: 1 });

const SentimentHistory = model("SentimentHistory", SentimentHistorySchema);

export default SentimentHistory;
