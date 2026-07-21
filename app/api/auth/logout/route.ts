import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  console.log("[API Auth Logout] Processing logout...");

  try {
    const sessionCookie = req.cookies.get("session")?.value;

    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(
          sessionCookie,
          false
        );
        await adminAuth.revokeRefreshTokens(decoded.uid);
        console.log(
          `[API Auth Logout] Tokens revoked for UID: ${decoded.uid}`
        );
      } catch (verifyError) {
        console.log(
          "[API Auth Logout] Session cookie invalid or expired, proceeding with logout"
        );
      }
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    response.cookies.delete("session");
    console.log("[API Auth Logout] Session cookie cleared");

    return response;
  } catch (error) {
    console.error("[API Auth Logout Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
