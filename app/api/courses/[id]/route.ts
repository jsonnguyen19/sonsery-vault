import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET: Lấy thông tin 1 khóa học
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("courses").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Không tìm thấy khóa học" },
        { status: 404 },
      );
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Cập nhật khóa học
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    console.log("[API DEBUG] PUT /api/courses/${id}");
    console.log("[API DEBUG] Request body:", body);
    console.log("[API DEBUG] thumbnailKey received:", body.thumbnailKey);

    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      console.log("[API DEBUG] Course not found");
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    // Update only allowed fields
    const updateData: {
      title: string;
      description: string;
      price: number;
      status: string;
      lessons: unknown[];
      updatedAt: string;
      thumbnailKey?: string;
    } = {
      title: body.title,
      description: body.description,
      price: body.price,
      status: body.status,
      lessons: body.lessons,
      updatedAt: new Date().toISOString(),
    };

    // Only update thumbnail if provided
    if (body.thumbnailKey) {
      updateData.thumbnailKey = body.thumbnailKey;
      console.log("[API DEBUG] Updating thumbnailKey:", body.thumbnailKey);
    } else {
      console.log("[API DEBUG] No thumbnailKey provided, skipping update");
    }

    console.log("[API DEBUG] Final updateData:", updateData);

    await courseRef.update(updateData);
    console.log("[API DEBUG] Course updated successfully");

    return NextResponse.json({ message: "Course updated successfully!" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API DEBUG] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Xóa khóa học
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await adminDb.collection("courses").doc(id).delete();

    return NextResponse.json({ message: "Xóa khóa học thành công!" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
