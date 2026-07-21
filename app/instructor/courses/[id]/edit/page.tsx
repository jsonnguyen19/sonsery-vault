"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState("draft");

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
      } catch (err) {
        alert("Lỗi khi tải dữ liệu khóa học");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, price, status }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      alert("Cập nhật thông tin khóa học thành công!");
      router.push(`/instructor/courses/${id}`);
    } catch (error: any) {
      alert(error.message || "Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này không?")) return;

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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
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

        <form onSubmit={handleUpdate} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h1 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Chỉnh sửa khóa học
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên khóa học
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
                Mô tả khóa học
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
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
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 transition shadow-sm"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
