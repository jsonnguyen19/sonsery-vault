export interface Lesson {
  id?: string;
  title: string;
  slug: string;
  description: string;
  isFreePreview: boolean;
  videoKey: string;
  order: number;
}
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnailKey: string;
  instructorId: string;
  status: "draft" | "published" | "archived";
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}
export interface CourseInput {
  title: string;
  description: string;
  price: number;
  thumbnailKey: string;
  lessons: Omit<Lesson, "id">[];
  instructorId: string;
}
