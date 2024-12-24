import SentimentHistoryModel from "../models/history.model";
import { connectToDB } from "../mongoose";

interface History_group_id {
  forSequence: number;
  divide_in_to_groups: number;
}

interface SentimentHistory {
  user_id: string;
  history_group_id: History_group_id;
  prompt: string;
  response: string;
}

//   await newHistory.save();
//   console.log("Saved Document:", newHistory);

const historyObj = async ({
  user_id,
  history_group_id: { forSequence, divide_in_to_groups },
  prompt,
  response,
}: SentimentHistory) => {
  try {
    await connectToDB();
  } catch (error) {}
};
