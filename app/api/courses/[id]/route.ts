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

    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Khóa học không tồn tại" },
        { status: 404 },
      );
    }

    await courseRef.update({
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Cập nhật thành công!" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
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
