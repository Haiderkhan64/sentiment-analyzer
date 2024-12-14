import { Schema, model, Types } from "mongoose";

const UserSchema = new Schema(
  {
    user_id: { type: String, required: true },
    userName: { type: String, required: true },
    history: [{ type: Types.ObjectId, ref: "SentimentHistory" }],
  },
  { timestamps: true }
);

// Add an index for better query performance
UserSchema.index({ user_id: 1 });

const User = model("User", UserSchema);

export default User;
