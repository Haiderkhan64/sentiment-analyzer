import { Types } from "mongoose";
import UserModel, { IUserDocument } from "../models/user.model";
import { connectToDB } from "../mongoose";

interface UserInput {
  user_id: string;
  userName: string | null;
  history: Types.ObjectId[]; // References to SentimentHistory documents
  onBoarded: boolean;
}

export const createUser = async ({
  user_id,
  userName,
  onBoarded = false,
  history = [],
}: UserInput): Promise<IUserDocument> => {
  try {
    await connectToDB();

    const newUser = await UserModel.create({
      user_id,
      userName,
      onBoarded,
      history,
    });

    return newUser;
  } catch (error) {
    console.error("Error occurred while creating user:", error);
    throw new Error("Failed to create user");
  }
};

// Fetch User
export const fetchUser = async ({
  id,
}: {
  id: string;
}): Promise<IUserDocument | null> => {
  try {
    await connectToDB();

    const user = await UserModel.findOne({ user_id: id });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error occurred while fetching user:", error);
    throw new Error("Failed to fetch user");
  }
};
