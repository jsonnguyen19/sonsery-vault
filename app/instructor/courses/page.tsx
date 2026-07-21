import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

// Server Component: Fetch trực tiếp dữ liệu từ Firestore qua Admin SDK
async function getCourses() {
  try {
    const snapshot = await adminDb.collection("courses").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
    return [];
  }
}

export default async function InstructorCoursesPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Khóa học của tôi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý danh sách nội dung giảng dạy của bạn
            </p>
          </div>
          <Link
            href="/instructor/courses/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            + Tạo khóa học mới
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">Chưa có khóa học nào được tạo.</p>
            <Link
              href="/instructor/courses/new"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Tạo khóa học đầu tiên ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {course.status || "Draft"}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {course.price ? `${course.price.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                    <span>{course.lessons?.length || 0} bài học</span>
                    <span>Slug: {course.slug}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
