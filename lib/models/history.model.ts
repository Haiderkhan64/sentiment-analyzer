import { model, Schema, Types } from "mongoose";

// Define a sub-schema for history_group_id
const HistoryGroupSchema = new Schema({
  forSequence: { type: Number, required: true },
  divide_in_to_groups: { type: Number, required: true },
});

// Define the main schema
const SentimentHistorySchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    history_group_id: { type: HistoryGroupSchema, required: true }, // Use the sub-schema
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    time_stamp: { type: Date, default: Date.now }, // Default will handle the required constraint
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Add an index for better query performance
SentimentHistorySchema.index({ user_id: 1 });

const SentimentHistoryModel = model(
  "SentimentHistoryModel",
  SentimentHistorySchema
);

export default SentimentHistoryModel;
