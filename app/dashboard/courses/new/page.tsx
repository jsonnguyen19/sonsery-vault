"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/slugify";
import { useToast } from "@/components/ui/ToastContainer";

interface LessonInput {
  title: string;
  description: string;
  isFreePreview: boolean;
  file: File | null;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

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
    value: string | boolean | File | null,
  ) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

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
    if (!res.ok) throw new Error(data.error || "Failed to get upload URL");

    const { uploadUrl, key } = data;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`Upload failed: ${file.name}`);

    return key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !thumbnailFile) {
      toast.error("Please fill in all required fields and select a thumbnail!");
      return;
    }

    setLoading(true);

    try {
      setProgressText("Uploading thumbnail...");
      const thumbnailKey = await uploadFileToR2(thumbnailFile);

      setProgressText("Uploading lesson videos...");
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
        }),
      );

      setProgressText("Saving course...");
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
        throw new Error(data.error || "Failed to create course");
      }

      toast.success("Course created successfully!");
      router.push("/dashboard/courses");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while creating the course!";
      toast.error(message);
    } finally {
      setLoading(false);
      setProgressText("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create New Course</h1>
        <p className="text-sm text-gray-400 mt-1">
          Fill in the details to create a new course
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-3">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Course Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-600 px-3.5 py-2 text-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder="e.g. Fullstack Next.js from Basics to Advanced"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-600 px-3.5 py-2 text-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder="Brief summary of what students will learn..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (VND)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-600 px-3.5 py-2 text-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                min={0}
                placeholder="0 = Free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Thumbnail <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer border border-gray-600 rounded-lg bg-gray-700"
                required
              />
            </div>
          </div>

          {thumbnailPreview && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Thumbnail Preview:</p>
              <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-gray-600 bg-gray-700">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lessons */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">2. Lessons</h2>
              <p className="text-xs text-gray-400">
                Add video lessons for your course
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddLesson}
              className="inline-flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              + Add Lesson
            </button>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={index}
                className="p-4 border border-gray-600 rounded-xl bg-gray-700/50 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center bg-gray-600 text-gray-300 font-semibold text-xs px-2.5 py-1 rounded-md">
                    Lesson #{index + 1}
                  </span>
                  {lessons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLesson(index)}
                      className="text-gray-400 hover:text-red-400 text-xs font-medium transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Lesson title..."
                      value={lesson.title}
                      onChange={(e) =>
                        handleLessonChange(index, "title", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-600 px-3.5 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Lesson description..."
                      value={lesson.description}
                      onChange={(e) =>
                        handleLessonChange(index, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-600 px-3.5 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Video File (.mp4, .mov, .mkv)
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          handleLessonChange(
                            index,
                            "file",
                            e.target.files?.[0] || null,
                          )
                        }
                        className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-600 file:text-gray-300 hover:file:bg-gray-500 border border-gray-600 rounded-lg bg-gray-800"
                      />
                    </div>

                    <div className="flex items-center pt-3 sm:pt-0">
                      <label className="relative flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={lesson.isFreePreview}
                          onChange={(e) =>
                            handleLessonChange(
                              index,
                              "isFreePreview",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-xs font-medium text-gray-300">
                          Free Preview
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700">
          {progressText && (
            <span className="text-sm font-medium text-blue-400 animate-pulse">
              ⏳ {progressText}
            </span>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-sm"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
