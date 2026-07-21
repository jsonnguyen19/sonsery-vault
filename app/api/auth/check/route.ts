import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  console.log("[API Auth Check] Checking session status...");

  try {
    const user = await getCurrentUser();

    if (user) {
      console.log(
        `[API Auth Check] User authenticated: ${user.uid}`
      );
      return NextResponse.json(
        { authenticated: true, uid: user.uid, email: user.email, role: user.role || "user" },
        { status: 200 }
      );
    } else {
      console.log("[API Auth Check] No authenticated user");
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[API Auth Check Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { authenticated: false, error: errorMessage },
      { status: 500 }
    );
  }
}
