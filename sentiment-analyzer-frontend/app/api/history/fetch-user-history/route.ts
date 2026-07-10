import { currentUser } from "@clerk/nextjs/server";
import { fetchHistory } from "@/lib/actions/history.action";
import { createUser, fetchUser } from "@/lib/actions/user.action";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "User not signed in" }, { status: 401 });
    }

    const userId   = user.id;
    const userName = user.fullName || "No Name";

    const dbUser = await fetchUser({ id: userId });

    if (!dbUser) {
      await createUser({ user_id: userId, userName, onBoarded: true, history: [] });
      return NextResponse.json({ success: true, history: [] });
    }

    // fetchHistory returns createdAt and updatedAt
    const history = await fetchHistory({ id: userId });

    return NextResponse.json({ success: true, history });

  } catch (error) {
    console.error("[fetch-user-history]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}