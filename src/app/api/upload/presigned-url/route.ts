import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename và contentType là bắt buộc" },
        { status: 400 }
      );
    }

    // Tạo key lưu trữ độc nhất (tránh ghi đè file trùng tên)
    const uniqueKey = `${Date.now()}-${filename}`;

    // Tạo Command yêu cầu upload file lên R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Tạo Presigned URL có hiệu lực trong 3600s (1 giờ)
    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key: uniqueKey,
    });
  } catch (error) {
    console.error("Lỗi tạo Presigned URL:", error);
    return NextResponse.json(
      { error: "Tạo URL upload thất bại" },
      { status: 500 }
    );
  }
}
