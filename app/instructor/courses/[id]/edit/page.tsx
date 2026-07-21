"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/utils/slugify";

interface LessonInput {
  id?: string;
  title: string;
  description: string;
  isFreePreview: boolean;
  videoKey?: string; // Giữ key cũ nếu không chọn file mới
  file?: File | null; // File video mới chọn
}

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState("");

  // Course Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState("draft");
  const [thumbnailKey, setThumbnailKey] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Lessons Info
  const [lessons, setLessons] = useState<LessonInput[]>([]);

  // Fetch Course Data
  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Không thể tải thông tin khóa học");
        const data = await res.json();

        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice(data.price || 0);
        setStatus(data.status || "draft");
        setThumbnailKey(data.thumbnailKey || "");

        if (data.lessons && Array.isArray(data.lessons)) {
          setLessons(
            data.lessons.map((l: any) => ({
              id: l.id,
              title: l.title || "",
              description: l.description || "",
              isFreePreview: !!l.isFreePreview,
              videoKey: l.videoKey || "",
              file: null,
            }))
          );
        }
      } catch (err) {
        alert("Lỗi khi tải dữ liệu khóa học");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  // Thumbnail handlers
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(null);
    }
  };

  // Lesson Handlers
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
    value: any
  ) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  // Helper Upload R2
  const uploadFileToR2 = async (file: File) => {
    const res = await fetch("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Không thể lấy URL upload R2");

    const { uploadUrl, key } = data;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`Lỗi upload file: ${file.name}`);

    return key;
  };

  // Submit Form
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    setSaving(true);

    try {
      // 1. Upload Thumbnail mới nếu chọn file mới
      let finalThumbnailKey = thumbnailKey;
      if (thumbnailFile) {
        setProgressText("Đang tải ảnh thu nhỏ mới lên R2...");
        finalThumbnailKey = await uploadFileToR2(thumbnailFile);
      }

      // 2. Upload Video bài học mới (chỉ upload các lesson có file mới chọn)
      setProgressText("Đang cập nhật danh sách bài học và tải video...");
      const processedLessons = await Promise.all(
        lessons.map(async (lesson, index) => {
          let videoKey = lesson.videoKey || "";

          // Nếu chọn video mới -> upload R2 lấy key mới
          if (lesson.file) {
            videoKey = await uploadFileToR2(lesson.file);
          }

          return {
            id: lesson.id || `lesson-${Date.now()}-${index}`,
            title: lesson.title,
            slug: slugify(lesson.title),
            description: lesson.description,
            isFreePreview: lesson.isFreePreview,
            videoKey,
            order: index + 1,
          };
        })
      );

      // 3. Cập nhật vào Database
      setProgressText("Đang lưu thay đổi vào cơ sở dữ liệu...");
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          status,
          thumbnailKey: finalThumbnailKey,
          lessons: processedLessons,
        }),
      });

      if (!res.ok) throw new Error("Cập nhật khóa học thất bại");

      alert("Cập nhật khóa học thành công!");
      router.push(`/instructor/courses/${id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Lỗi cập nhật khóa học!");
    } finally {
      setSaving(false);
      setProgressText("");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác.")) return;

    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa khóa học thất bại");

      alert("Xóa khóa học thành công!");
      router.push("/instructor/courses");
    } catch (error: any) {
      alert(error.message || "Lỗi xóa khóa học");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Đang tải thông tin khóa học...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link
            href={`/instructor/courses/${id}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            ← Hủy & Quay lại
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
          >
            Xóa khóa học này
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          {/* Card 1: Thông tin khóa học */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h1 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Chỉnh sửa thông tin tổng quan
            </h1>

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
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="published">Xuất bản (Published)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Đổi Thumbnail mới
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              {thumbnailPreview && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Xem trước Thumbnail mới:</p>
                  <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="New Thumbnail Preview"
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
                  2. Danh sách bài học ({lessons.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Chỉnh sửa, thêm bớt bài học hoặc cập nhật lại video
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
                  key={lesson.id || index}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1 rounded-md">
                      Bài #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLesson(index)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-medium transition"
                    >
                      Xóa bài này
                    </button>
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
                        {lesson.videoKey && !lesson.file && (
                          <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                            ✓ Đã có video trên R2 ({lesson.videoKey})
                          </p>
                        )}
                        {lesson.file && (
                          <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                            🪶 Sẽ upload video mới: {lesson.file.name}
                          </p>
                        )}
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
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-400 disabled:cursor-not-allowed transition shadow-sm"
            >
              {saving ? "Đang lưu..." : "Lưu tất cả thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
