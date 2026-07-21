import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLES, isAdmin } from "@/lib/auth/roles";

export async function GET(req: NextRequest) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get all users (max 1000)
    const listUsersResult = await adminAuth.listUsers(1000);
    
    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email || "No email",
      displayName: user.displayName || "No name",
      photoURL: user.photoURL,
      role: user.customClaims?.role || ROLES.USER,
      disabled: user.disabled,
      createdAt: user.metadata?.creationTime,
      lastSignIn: user.metadata?.lastSignInTime,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Admin API] Error listing users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
