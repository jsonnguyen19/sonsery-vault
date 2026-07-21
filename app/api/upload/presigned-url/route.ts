import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Thiếu thông tin filename hoặc contentType" },
        { status: 400 }
      );
    }

    // 1. Tạo unique key để tránh trùng lặp tên file trên R2
    // VD: 1715600000000-avatar.png
    const uniqueKey = `${Date.now()}-${filename}`;

    // 2. Định nghĩa Command để đẩy file (PUT) lên R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // 3. Ký Presigned URL (Vé có hiệu lực trong 3600s = 1 giờ)
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    // 4. Trả URL và Key về cho Browser
    return NextResponse.json({
      uploadUrl,
      key: uniqueKey,
    });
  } catch (error: unknown) {
    console.error("Lỗi tạo Presigned URL:", error);
    return NextResponse.json(
      { error: "Không thể tạo Presigned URL" },
      { status: 500 }
    );
  }
}
