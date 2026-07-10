import { Schema, model, models, Model, Types, Document } from "mongoose";

interface IUser {
  user_id: string;
  userName: string | null;
  history: Types.ObjectId[]; // References to SentimentHistory documents
  onBoarded: boolean;
}

// Extend Mongoose's Document for additional properties
export interface IUserDocument extends Document, IUser {}

// Define the Mongoose model interface
type IUserModel = Model<IUserDocument>;

const UserSchema = new Schema(
  {
    user_id: { type: String, required: true },
    userName: { type: String, required: true },
    history: [{ type: Types.ObjectId, ref: "SentimentHistory" }],
    onBoarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Add an index for better query performance
UserSchema.index({ user_id: 1 }, { unique: true });

// Check if the model is already defined to prevent overwriting
const UserModel =
  models.User || model<IUserDocument, IUserModel>("User", UserSchema);

export default UserModel;
