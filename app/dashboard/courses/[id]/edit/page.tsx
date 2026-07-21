"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastContainer";


interface Lesson {
  title: string;
  content?: string;
  videoUrl?: string;
}

interface CourseData {
  title: string;
  description: string;
  price: number;
  status: string;
  thumbnailKey: string;
  lessons: Lesson[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCoursePage({ params }: PageProps) {
  const router = useRouter();
  const toast = useToast();
  const { id } = use(params) as { id: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<CourseData>({
    title: "",
    description: "",
    price: 0,
    status: "draft",
    thumbnailKey: "",
    lessons: [],
  });

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
        // Only set initial data if not already loaded
        setCourse((prev) => ({
          ...data,
          // Keep existing thumbnailKey if we already uploaded a new one
          thumbnailKey: prev.thumbnailKey || data.thumbnailKey,
        }));
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    if (loading) {
      fetchCourse();
    }
  }, [id, toast, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG] Submitting form with course data:", course);
    console.log("[DEBUG] thumbnailKey:", course.thumbnailKey);
    setSaving(true);

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });

      const data = await res.json();
      console.log("[DEBUG] API response:", data);

      if (!res.ok) throw new Error(data.error || "Failed to update course");

      toast.success("Course updated successfully!");
      router.push(`/dashboard/courses/${id}`);
    } catch (error) {
      console.error("[DEBUG] Error updating course:", error);
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const addLesson = () => {
    setCourse({
      ...course,
      lessons: [...course.lessons, { title: "", content: "" }],
    });
  };

  const removeLesson = (index: number) => {
    setCourse({
      ...course,
      lessons: course.lessons.filter((_, i) => i !== index),
    });
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string) => {
    const updatedLessons = [...course.lessons];
    updatedLessons[index] = { ...updatedLessons[index], [field]: value };
    setCourse({ ...course, lessons: updatedLessons });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/courses/${id}`}
          className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block"
        >
          ← Back to Course
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Course</h1>
        <p className="text-sm text-gray-400 mt-1">Update your course details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={course.description}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (VND)
              </label>
              <input
                type="number"
                value={course.price}
                onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={course.status}
                onChange={(e) => setCourse({ ...course, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Thumbnail
            </label>
            {course.thumbnailKey && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 mb-1">Current thumbnail:</p>
                <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-600">
                  <img
                    src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${course.thumbnailKey}`}
                    alt="Current thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                console.log("[DEBUG] Selected file:", file.name, file.type, file.size);
                try {
                  // Upload new thumbnail
                  console.log("[DEBUG] Requesting presigned URL...");
                  const res = await fetch("/api/upload/presigned-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      filename: file.name,
                      contentType: file.type,
                    }),
                  });
                  const data = await res.json();
                  console.log("[DEBUG] Presigned URL response:", data);
                  if (!res.ok) throw new Error(data.error || "Upload failed");

                  console.log("[DEBUG] Uploading to R2...");
                  const uploadRes = await fetch(data.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                  });
                  console.log("[DEBUG] R2 upload response status:", uploadRes.status);
                  console.log("[DEBUG] R2 upload response headers:", Object.fromEntries(uploadRes.headers.entries()));
                  const responseText = await uploadRes.text();
                  console.log("[DEBUG] R2 upload response body:", responseText);
                  if (!uploadRes.ok) {
                    throw new Error(`R2 upload failed with status ${uploadRes.status}: ${responseText}`);
                  }
                  if (!uploadRes.ok) throw new Error("Upload to R2 failed");

                  console.log("[DEBUG] Upload successful! Key:", data.key);
                  setCourse({ ...course, thumbnailKey: data.key });
                  console.log("[DEBUG] Course state updated with new thumbnailKey:", data.key);
                  toast.success("Thumbnail uploaded successfully!");
                } catch (error) {
                  console.error("[DEBUG] Error uploading thumbnail:", error);
                  toast.error("Failed to upload thumbnail");
                }
              }}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer border border-gray-600 rounded-lg bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a new image to replace the current thumbnail</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Lessons</h2>
            <button
              type="button"
              onClick={addLesson}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Add Lesson
            </button>
          </div>

          {course.lessons.length === 0 ? (
            <p className="text-gray-400 text-sm">No lessons added yet.</p>
          ) : (
            <div className="space-y-3">
              {course.lessons.map((lesson, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      Lesson {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLesson(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, "title", e.target.value)}
                    placeholder="Lesson title"
                    className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={lesson.content || ""}
                    onChange={(e) => updateLesson(index, "content", e.target.value)}
                    placeholder="Lesson content"
                    rows={2}
                    className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/dashboard/courses/${id}`}
            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
