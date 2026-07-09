import { currentUser } from "@clerk/nextjs/server";
import { createUser, fetchUser } from "@/lib/actions/user.action";

export async function GET() {
  try {
    const user = await currentUser();

    // If no user is signed in, return 401 with an error message
    if (!user) {
      console.log("User not found: Not signed in");

      return new Response(JSON.stringify({ error: "User not signed in" }), {
        status: 401,
      });
    }

    // Fetch user from the database
    const ownDatabaseUser = await fetchUser({ id: user.id });

    // If user does not exist in the database, create a new user
    if (!ownDatabaseUser) {
      console.log(
        `User with ID ${user.id} not found in database. Creating new user.`
      );
      await createUser({
        user_id: user.id,
        userName: user.fullName,
        onBoarded: true,
        history: [],
      });
    } else {
      console.log(`User with name ${user.username} found in database.`);
    }

    // Return success response with user details
    return new Response(
      JSON.stringify({
        success: true,
        userId: user.id,
        userName: user.fullName,
      }),
      { status: 200 }
    );
  } catch (error) {
    // Log the error and return a 500 status code with an error message
    console.error("Error in checkSignIn API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
