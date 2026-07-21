"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/slugify";

interface LessonInput {
  title: string;
  description: string;
  isFreePreview: boolean;
  file: File | null;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");

  // Course Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Lessons Info
  const [lessons, setLessons] = useState<LessonInput[]>([
    { title: "", description: "", isFreePreview: false, file: null },
  ]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleAddLesson = () => {
    setLessons([
      ...lessons,
      { title: "", description: "", isFreePreview: false, file: null },
    ]);
  };

  const handleRemoveLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleLessonChange = (
    index: number,
    field: keyof LessonInput,
    value: string | boolean | File | null
  ) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  // Helper upload file sang Cloudflare R2
  const uploadFileToR2 = async (file: File) => {
      const res = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,      // Sửa fileName -> filename
          contentType: file.type,   // Sửa fileType -> contentType
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lấy URL upload R2");

      const { uploadUrl, key } = data; // Sửa fileKey -> key

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error(`Lỗi upload file: ${file.name}`);

      return key;
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !thumbnailFile) {
      alert("Vui lòng điền đầy đủ thông tin khóa học và ảnh thu nhỏ!");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload thumbnail
      setProgressText("Đang tải ảnh thu nhỏ lên R2...");
      const thumbnailKey = await uploadFileToR2(thumbnailFile);

      // 2. Upload video bài học song song (Parallel Uploads)
      setProgressText("Đang tải các video bài học lên R2...");
      const processedLessons = await Promise.all(
        lessons.map(async (lesson, index) => {
          let videoKey = "";
          if (lesson.file) {
            videoKey = await uploadFileToR2(lesson.file);
          }

          return {
            id: `lesson-${Date.now()}-${index}`,
            title: lesson.title,
            slug: slugify(lesson.title),
            description: lesson.description,
            isFreePreview: lesson.isFreePreview,
            videoKey,
            order: index + 1,
          };
        })
      );

      // 3. Gọi API route để lưu vào Firestore
      setProgressText("Đang lưu thông tin khóa học...");
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          thumbnailKey,
          lessons: processedLessons,
          instructorId: "demo-instructor-id",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo khóa học");
      }

      alert("Tạo khóa học thành công!");
      router.push("/instructor/courses");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo khóa học!";
      alert(message);
    } finally {
      setLoading(false);
      setProgressText("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tạo khóa học mới</h1>
            <p className="text-sm text-slate-500 mt-1">
              Điền thông tin và tải nội dung chương trình giảng dạy của bạn
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Thông tin cơ bản */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
              1. Thông tin tổng quan
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên khóa học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  placeholder="Ví dụ: Lập trình Fullstack Next.js từ cơ bản đến nâng cao"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả khóa học <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  placeholder="Tóm tắt ngắn gọn những gì học viên sẽ học được..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    min={0}
                    placeholder="0 = Miễn phí"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ảnh thu nhỏ (Thumbnail) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg bg-slate-50"
                    required
                  />
                </div>
              </div>

              {thumbnailPreview && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Xem trước Thumbnail:</p>
                  <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Danh sách bài học */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  2. Danh sách bài học
                </h2>
                <p className="text-xs text-slate-500">
                  Thêm danh sách các bài giảng video cho khóa học
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLesson}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition"
              >
                + Thêm bài học
              </button>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1 rounded-md">
                      Bài #{index + 1}
                    </span>
                    {lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(index)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-medium transition"
                      >
                        Xóa bài này
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Tiêu đề bài học..."
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonChange(index, "title", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                        required
                      />
                    </div>

                    <div>
                      <textarea
                        placeholder="Mô tả nội dung bài học..."
                        value={lesson.description}
                        onChange={(e) =>
                          handleLessonChange(index, "description", e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tập tin Video (.mp4, .mov, .mkv)
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) =>
                            handleLessonChange(
                              index,
                              "file",
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="flex items-center pt-4 sm:pt-0">
                        <label className="relative flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={lesson.isFreePreview}
                            onChange={(e) =>
                              handleLessonChange(
                                index,
                                "isFreePreview",
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-xs font-medium text-slate-700">
                            Cho phép học thử miễn phí
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            {progressText && (
              <span className="text-sm font-medium text-blue-600 animate-pulse">
                ⏳ {progressText}
              </span>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-400 disabled:cursor-not-allowed transition shadow-sm"
            >
              {loading ? "Đang tạo khóa học..." : "Tạo khóa học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
