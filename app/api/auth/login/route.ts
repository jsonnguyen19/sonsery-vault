import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_EXPIRES_IN = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(req: NextRequest) {
  console.log("[API Auth Login] Received idToken request");

  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      console.log("[API Auth Login] Missing idToken in request body");
      return NextResponse.json(
        { error: "Missing idToken" },
        { status: 400 }
      );
    }

    console.log("[API Auth Login] Verifying idToken...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(
      `[API Auth Login] idToken verified successfully for UID: ${decodedToken.uid}`
    );

    console.log("[API Auth Login] Creating session cookie...");
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_EXPIRES_IN,
    });

    const response = NextResponse.json(
      { success: true, uid: decodedToken.uid },
      { status: 200 }
    );

    response.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_EXPIRES_IN / 1000,
    });

    console.log(
      `[API Auth Login] Session cookie created successfully for UID: ${decodedToken.uid}`
    );

    return response;
  } catch (error) {
    console.error("[API Auth Login Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
