import { NextRequest, NextResponse } from "next/server";
import { EnrollmentService } from "@/lib/services/enrollment";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/roles";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");

    if (courseId) {
      const progress = await EnrollmentService.getCourseProgress(
        userId || user.uid,
        courseId,
      );
      return NextResponse.json({ progress });
    }

    // Admin can view any user's progress
    if (userId && user.role === ROLES.ADMIN) {
      const progressList = await EnrollmentService.getAllUserProgress(userId);
      return NextResponse.json({ progress: progressList });
    }

    // Get all progress for current user
    const progressList = await EnrollmentService.getAllUserProgress(user.uid);
    return NextResponse.json({ progress: progressList });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, lessonId, completed, timeSpent } = body;

    if (!courseId || !lessonId || completed === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: courseId, lessonId, completed",
        },
        { status: 400 },
      );
    }

    // Check if user has access to this lesson
    const hasAccess = await EnrollmentService.hasLessonAccess(
      user.uid,
      courseId,
      lessonId,
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this lesson" },
        { status: 403 },
      );
    }

    const progress = await EnrollmentService.updateLessonProgress(
      user.uid,
      courseId,
      lessonId,
      completed,
      timeSpent,
    );

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error updating progress:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
