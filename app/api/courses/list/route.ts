import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "published";

    // Fetch all courses (we'll filter on server for MVP)
    const snapshot = await adminDb.collection("courses").get();
    let courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];

    // Filter by status
    if (status) {
      courses = courses.filter((c) => c.status === status);
    }

    // Filter by search (title or description)
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt desc
    courses.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCourses = courses.slice(start, end);

    return NextResponse.json({
      courses: paginatedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching courses list:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
