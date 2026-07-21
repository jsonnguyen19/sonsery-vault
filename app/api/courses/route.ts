import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/utils/slugify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, price, thumbnailKey, lessons, instructorId } = body;

    if (!title || !description || price === undefined || !thumbnailKey) {
      return NextResponse.json(
        { error: "Thiếu thông tin khóa học bắt buộc." },
        { status: 400 }
      );
    }

    const slug = slugify(title);

    const newCourse = {
      title,
      slug,
      description,
      price: Number(price),
      thumbnailKey,
      instructorId: instructorId || "demo-instructor-id",
      status: "draft",
      lessons: lessons || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("courses").add(newCourse);

    return NextResponse.json(
      { message: "Tạo khóa học thành công!", id: docRef.id, slug },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lỗi khi tạo khóa học:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
