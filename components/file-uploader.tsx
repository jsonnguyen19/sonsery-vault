"use client";

import { useState } from "react";

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("Vui lòng chọn 1 file trước!");
      return;
    }

    try {
      setUploading(true);
      setStatus("1. Đang xin Presigned URL từ Server Next.js...");

      // 1. Gọi API Route lấy Presigned URL
      const res = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lấy URL thất bại");

      setStatus(
        "2. Đã có vé! Đang đẩy file trực tiếp từ Browser lên Cloudflare R2...",
      );

      // 2. Upload TRỰC TIẾP từ Browser lên Cloudflare R2
      const uploadRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload lên R2 thất bại!");

      setStatus(`🎉 Upload thành công! Key trên R2: ${data.key}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      console.error(err);
      setStatus(`❌ Lỗi: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-4">
      <h1 className="text-xl font-bold text-center">Test Upload File lên R2</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
      />

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium rounded-lg transition"
      >
        {uploading ? "Đang xử lý..." : "Upload File"}
      </button>

      {status && (
        <p className="text-sm p-3 bg-slate-900 rounded border border-slate-700 break-all">
          {status}
        </p>
      )}
    </div>
  );
}
