import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

async function verifySession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  } else {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (sessionCookie) {
      token = sessionCookie;
    }
  }

  if (!token) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    try {
      const decodedCookie = await adminAuth.verifySessionCookie(token, true);
      return decodedCookie;
    } catch (err) {
      console.error("Token verification failed:", err);
      return null;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifySession(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get users from Firestore users collection
    const usersSnapshot = await adminDb
      .collection("users")
      .select("uid", "email", "displayName", "role")
      .get();

    const users = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email || "",
      displayName: doc.data().displayName || "",
      role: doc.data().role || "user",
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
