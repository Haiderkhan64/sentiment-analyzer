import { Schema, model, models, Model, Document } from "mongoose";

interface ISentimentHistory {
  user_id: string; // Reference to User's user_id (string)
  history_group_id: {
    forSequence: number;
    divide_in_to_groups: number;
  };
  prompt: string;
  response: string[]; 
}

// Extend Mongoose's Document for additional properties
export interface ISentimentHistoryDocument
  extends Document,
    ISentimentHistory {}

// Define the Mongoose model interface
type ISentimentHistoryModel = Model<ISentimentHistoryDocument>;

const SentimentHistorySchema = new Schema(
  {
    user_id: {
      type: String,
      ref: "User", // Reference to User's user_id field
      required: true,
    },
    history_group_id: {
      forSequence: { type: Number, default: 0 },
      divide_in_to_groups: { type: Number, required: true },
    },
    prompt: { type: String, required: true },
    response: {
      type: [String],
      required: true,
      // validate: {
      //   validator: (val) => val.length > 0,
      //   message: "Response must contain at least one string.",
      // },
    },
  },
  { timestamps: true }
);

// Check if the model is already defined to prevent overwriting
const SentimentHistoryModel =
  models.SentimentHistory ||
  model<ISentimentHistoryDocument, ISentimentHistoryModel>(
    "SentimentHistory",
    SentimentHistorySchema
  );

export default SentimentHistoryModel;
