import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLES, isAdmin } from "@/lib/auth/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const { uid } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || ![ROLES.ADMIN, ROLES.USER].includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${ROLES.ADMIN}, ${ROLES.USER}`,
        },
        { status: 400 },
      );
    }

    // Set custom claim
    await adminAuth.setCustomUserClaims(uid, { role });

    console.log(`[Admin API] Set role ${role} for user ${uid}`);

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role} for user ${uid}`,
      uid,
      role,
    });
  } catch (error) {
    console.error("[Admin API] Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const { uid } = await params;
    const user = await adminAuth.getUser(uid);
    const role = user.customClaims?.role || ROLES.USER;

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
      customClaims: user.customClaims,
    });
  } catch (error) {
    console.error("[Admin API] Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
