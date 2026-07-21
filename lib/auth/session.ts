import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

export async function getCurrentUser(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      console.log("[Server Session] No session cookie found");
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );

    console.log(
      `[Server Session] User authenticated: ${decodedClaims.uid} | Role: ${decodedClaims.role || "user"}`
    );

    return decodedClaims;
  } catch (error) {
    console.error("[Server Session Error] Token invalid or expired:", error);
    return null;
  }
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  return sessionCookie?.value || null;
}
