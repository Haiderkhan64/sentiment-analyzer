import SentimentHistoryModel from "../models/history.model";
import UserModel from "../models/user.model";
import { connectToDB } from "../mongoose";
import { createUser, fetchUser } from "./user.action";

interface HistoryGroupId {
  forSequence: number;
  divide_in_to_groups: number;
}

interface SentimentHistoryInput {
  user_id: string;
  userName: string;
  onBoarded: boolean;
  history_group_id: HistoryGroupId;
  prompt: string;
  response: string[];
}

export const createHistoryObj = async ({
  user_id,
  userName,
  onBoarded = false,
  history_group_id,
  prompt,
  response,
}: SentimentHistoryInput) => {
  try {
    await connectToDB();

    // First, try to fetch the user
    let fetchedUser = await fetchUser({ id: user_id });

    // If user doesn't exist, create them
    if (!fetchedUser) {
      try {
        fetchedUser = await createUser({
          user_id,
          userName,
          onBoarded,
          history: [],
        });
      } catch (error) {
        console.error("Error creating new user:", error);
        throw new Error("Failed to create new user");
      }
    }

    // Verify user exists and is onboarded
    if (!fetchedUser?.onBoarded) {
      throw new Error("User not found or not onboarded");
    }

    // The client sends divide_in_to_groups: 1 to start a brand-new chat/group,
    // and 0 to continue the current one (see SentimentAnalyzer.tsx).
    const startsNewGroup = history_group_id.divide_in_to_groups === 1;

    // Defaults for this user's very first history entry.
    let lastForSequence = 0;
    let lastDivideIntoGroups = history_group_id.divide_in_to_groups;

    // Update sequence numbers based on the user's most recent history entry.
    if (fetchedUser.history?.length > 0) {
      const lastHistoryId = fetchedUser.history[fetchedUser.history.length - 1];

      try {
        const lastHistoryObj = await SentimentHistoryModel.findById(
          lastHistoryId
        );

        if (lastHistoryObj?.history_group_id) {
          if (startsNewGroup) {
            // Starting a new chat: bump the group counter, reset the position.
            lastDivideIntoGroups = lastHistoryObj.history_group_id.divide_in_to_groups + 1;
            lastForSequence = 0;
          } else {
            // Continuing the current chat: keep its group id, advance the position.
            lastDivideIntoGroups = lastHistoryObj.history_group_id.divide_in_to_groups;
            lastForSequence = lastHistoryObj.history_group_id.forSequence + 1;
          }
        }
      } catch (error) {
        console.error("Error fetching last history object:", error);
      }
    }

    // Create history object using the string user_id directly
    const historyObj = await SentimentHistoryModel.create({
      user_id, // Use the string ID directly - let Mongoose handle the internal conversion
      history_group_id: {
        forSequence: lastForSequence,
        divide_in_to_groups: lastDivideIntoGroups,
      },
      prompt: prompt.slice(0, 100), // Ensure prompt length limit
      // response: Array.isArray(response) ? response : [response],
      response,
    });

    await historyObj.save();

    try {
      await UserModel.findOneAndUpdate(
        { user_id }, // Use the string ID for querying
        { $push: { history: historyObj._id } },
        { new: true }
      );
    } catch (error) {
      console.log(
        "Error in Pushing historyobj to history property in user obj",
        error
      );
    }
    // Update user's history array

    return historyObj;
  } catch (error) {
    console.error("Error in createHistoryObj:", error);
  }
};

// Helper function to validate input
export const validateHistoryInput = (
  input: Partial<SentimentHistoryInput>
): boolean => {
  return !!(
    input.user_id &&
    input.history_group_id &&
    typeof input.history_group_id.forSequence === "number" &&
    typeof input.history_group_id.divide_in_to_groups === "number" &&
    (input.history_group_id.divide_in_to_groups === 0 ||
      input.history_group_id.divide_in_to_groups === 1)
  );
};


export const fetchHistory = async ({ id }: { id: string }) => {
  try {
    await connectToDB();

    const history = await SentimentHistoryModel
      .find({ user_id: id })
      .select("-_id -user_id")
      .sort({ createdAt: -1 })  // newest first
      .lean()                   // plain JS objects, faster
      .exec();

    return history ?? [];

  } catch (error) {
    console.error("fetchHistory error:", error);
    throw error;
  }
};
