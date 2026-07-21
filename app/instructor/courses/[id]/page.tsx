import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";

async function getCourse(id: string) {
  try {
    const doc = await adminDb.collection("courses").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
  } catch (error) {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/instructor/courses"
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            ← Quay lại danh sách
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/instructor/courses/${course.id}/edit`}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
            >
              Chỉnh sửa khóa học
            </Link>
          </div>
        </div>

        {/* Course Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase mb-2">
                {course.status || "Draft"}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{course.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Giá khóa học</p>
              <p className="text-xl font-bold text-blue-600">
                {course.price ? `${course.price.toLocaleString("vi-VN")} đ` : "Miễn phí"}
              </p>
            </div>
          </div>
        </div>

        {/* Curriculum Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Danh sách bài học ({course.lessons?.length || 0})
          </h2>

          {!course.lessons || course.lessons.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Khóa học này chưa có bài học nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {course.lessons.map((lesson: any, index: number) => (
                <div key={lesson.id || index} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
                      {lesson.isFreePreview && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                          Học thử
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-slate-500">{lesson.description}</p>
                    )}
                  </div>
                  {lesson.videoKey ? (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-medium">
                      Đã có Video R2
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa có video</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
