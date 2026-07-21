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
  videoKey?: string; // Giữ videoKey cũ
  file?: File | null; // Dùng nếu chọn video mới
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

  // Course Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState("draft");
  const [thumbnailKey, setThumbnailKey] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Lessons Form State
  const [lessons, setLessons] = useState<LessonInput[]>([]);

  // Fetch Course + Lessons Data
  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Không thể tải khóa học");
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
        alert("Lỗi khi tải thông tin khóa học!");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  // Thumbnail Handlers
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(null);
    }
  };

  // Lesson Operations
  const handleAddLesson = () => {
    setLessons((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        isFreePreview: false,
        file: null,
      },
    ]);
  };

  const handleRemoveLesson = (index: number) => {
    if (!confirm(`Bạn có chắc muốn xóa Bài #${index + 1}?`)) return;
    setLessons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveLesson = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === lessons.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...lessons];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setLessons(updated);
  };

  const handleLessonChange = (
    index: number,
    field: keyof LessonInput,
    value: any
  ) => {
    setLessons((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Helper function upload file lên R2 qua Presigned URL
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
    if (!res.ok) throw new Error(data.error || "Lỗi lấy presigned URL");

    const { uploadUrl, key } = data;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`Lỗi tải file ${file.name} lên R2`);

    return key;
  };

  // Submit Update Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Vui lòng điền tiêu đề và mô tả khóa học!");
      return;
    }

    setSaving(true);

    try {
      // 1. Upload Thumbnail nếu chọn ảnh mới
      let finalThumbnailKey = thumbnailKey;
      if (thumbnailFile) {
        setProgressText("Đang upload Thumbnail mới...");
        finalThumbnailKey = await uploadFileToR2(thumbnailFile);
      }

      // 2. Upload Video mới cho các lesson có chọn file
      const processedLessons = [];
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        let videoKey = lesson.videoKey || "";

        if (lesson.file) {
          setProgressText(`Đang upload video bài #${i + 1}: ${lesson.title || "Chưa đặt tên"}...`);
          videoKey = await uploadFileToR2(lesson.file);
        }

        processedLessons.push({
          id: lesson.id, // Giữ id cũ nếu có, nếu không thì server sẽ tự tạo
          title: lesson.title,
          slug: slugify(lesson.title || `lesson-${i + 1}`),
          description: lesson.description,
          isFreePreview: lesson.isFreePreview,
          videoKey,
          order: i + 1,
        });
      }

      // 3. Gọi API PUT để lưu thông tin khóa học + bài học
      setProgressText("Đang cập nhật vào Cơ sở dữ liệu...");
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

      if (!res.ok) throw new Error("Cập nhật thất bại");

      alert("Cập nhật khóa học và danh sách bài học thành công!");
      router.push(`/instructor/courses/${id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đã xảy ra lỗi trong quá trình lưu!");
    } finally {
      setSaving(false);
      setProgressText("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Đang tải dữ liệu khóa học...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link
            href={`/instructor/courses/${id}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            ← Quay lại chi tiết khóa học
          </Link>
          <h1 className="text-lg font-bold text-slate-900">
            Chỉnh sửa khóa học
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Thông tin khóa học */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              1. Thông tin tổng quan
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tên khóa học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Mô tả khóa học <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="published">Xuất bản (Published)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Thay Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {thumbnailPreview && (
                <div className="pt-2">
                  <span className="text-xs text-slate-500 block mb-1">Ảnh thumbnail mới:</span>
                  <div className="w-40 h-24 relative rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Quản lý bài học */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  2. Quản lý bài học ({lessons.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Thêm, xóa, đổi thứ tự hoặc cập nhật video cho từng bài học.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                + Thêm bài học mới
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">Chưa có bài học nào trong khóa học này.</p>
                <button
                  type="button"
                  onClick={handleAddLesson}
                  className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                >
                  Thêm bài học ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id || `temp-${index}`}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4"
                  >
                    {/* Bar điều hướng bài học */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md">
                          Bài #{index + 1}
                        </span>
                        {/* Nút di chuyển lên / xuống */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveLesson(index, "up")}
                            className="p-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Di chuyển lên"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === lessons.length - 1}
                            onClick={() => handleMoveLesson(index, "down")}
                            className="p-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Di chuyển xuống"
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(index)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition"
                      >
                        Xóa bài
                      </button>
                    </div>

                    {/* Form bài học */}
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Tiêu đề bài học..."
                          value={lesson.title}
                          onChange={(e) =>
                            handleLessonChange(index, "title", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                          required
                        />
                      </div>

                      <div>
                        <textarea
                          placeholder="Mô tả tóm tắt nội dung bài học..."
                          value={lesson.description}
                          onChange={(e) =>
                            handleLessonChange(index, "description", e.target.value)
                          }
                          rows={2}
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Video bài học (.mp4, .mov...)
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
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 border border-slate-300 rounded-lg bg-white"
                          />
                          {lesson.videoKey && !lesson.file && (
                            <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                              ✓ Đã có video trên R2 ({lesson.videoKey})
                            </p>
                          )}
                          {lesson.file && (
                            <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                              🪶 Chọn file mới: {lesson.file.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center pt-2 md:pt-0">
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
                              Cho học thử miễn phí (Free Preview)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            {progressText && (
              <span className="text-xs font-semibold text-blue-600 animate-pulse">
                ⏳ {progressText}
              </span>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition shadow-sm"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
