import { currentUser } from "@clerk/nextjs/server";
import { createUser, fetchUser } from "@/lib/actions/user.action";
import { createHistoryObj, validateHistoryInput } from "@/lib/actions/history.action";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { prompt, response, forSequence, divide_in_to_groups } =
    await req.json();

  if (!prompt || !response) {
    return createErrorResponse(
      "Missing required parameters: prompt or response",
      400
    );
  }

  try {
    const user = await currentUser();

    if (!user) {
      console.warn("Unauthorized access attempt: User not signed in");
      return createErrorResponse("User not signed in", 401);
    }

    const userId = user.id;
    const userName = user.fullName || "No Name";

    // Shape-check the history_group_id fields before they ever reach Mongoose.
    // validateHistoryInput already existed in history.action.ts but wasn't
    // being called anywhere — this closes that gap.
    if (
      !validateHistoryInput({
        user_id: userId,
        history_group_id: { forSequence, divide_in_to_groups },
      })
    ) {
      return createErrorResponse(
        "Invalid or missing history_group_id fields",
        400
      );
    }

    const ownDatabaseUser = await fetchUser({ id: userId });

    if (!ownDatabaseUser) {
      console.info(
        `User with ID ${userId} not found in database. Creating new user.`
      );
      await createUser({
        user_id: userId,
        userName,
        onBoarded: true,
        history: [],
      });
    } else {
      console.info(
        `[${new Date().toISOString()}] User ${userId} found in database.`
      );
    }

    await handleCreateHistory({
      userId,
      userName,
      forSequence,
      divide_in_to_groups,
      prompt,
      response,
    });

    return createSuccessResponse({ success: true, userId, userName });
  } catch (error) {
    logError("Unexpected error in POST handler", error);
    return createErrorResponse("Internal Server Error", 500);
  }
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status });
}

function createSuccessResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

function logError(message: string, error: unknown) {
  console.error(`${message}:`, error);
}

async function handleCreateHistory({
  userId,
  userName,
  forSequence,
  divide_in_to_groups,
  prompt,
  response,
}: {
  userId: string;
  userName: string;
  forSequence: number;
  divide_in_to_groups: number;
  prompt: string;
  response: string[];
}) {
  try {
    await createHistoryObj({
      user_id: userId,
      userName,
      history_group_id: {
        forSequence,
        divide_in_to_groups,
      },
      onBoarded: true,
      prompt,
      response,
    });
    revalidatePath("/");
  } catch (error: unknown) {
    if (error instanceof Error) {
      logError("Error creating history object", error);
      const validationErrors =
        "errors" in error && (error as { errors: unknown }).errors
          ? (error as { errors: unknown }).errors
          : "No validation details available.";
      console.error("Validation errors:", validationErrors);
      throw new Error(`Failed to create history object: ${error.message}`);
    }
    logError("Unknown error creating history object", error);
    throw new Error("Failed to create history object due to an unknown error.");
  }
}