import { adminDb } from "@/lib/firebase-admin";
import type {
  Notification,
  CreateNotificationDTO,
  UpdateNotificationDTO,
} from "@/lib/types/notification";

const COLLECTION = "notifications";

// Server-side only functions (use in API routes, server components, server actions)
export const notificationServer = {
  async create(dto: CreateNotificationDTO): Promise<Notification> {
    const now = new Date();
    const data = {
      ...dto,
      type: dto.type || "info",
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(COLLECTION).add(data);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...doc.data(),
    } as Notification;
  },

  async get(id: string): Promise<Notification | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Notification;
  },

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  },

  async getAllNotifications(): Promise<Notification[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    return snapshot.size;
  },

  async update(id: string, dto: UpdateNotificationDTO): Promise<void> {
    await adminDb
      .collection(COLLECTION)
      .doc(id)
      .update({
        ...dto,
        updatedAt: new Date(),
      });
  },

  async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true, updatedAt: new Date() });
    });

    await batch.commit();
  },

  async delete(id: string): Promise<void> {
    await adminDb.collection(COLLECTION).doc(id).delete();
  },

  async deleteAll(userId: string): Promise<void> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  },

  async sendEnrollmentNotification(userId: string, courseTitle: string) {
    return this.create({
      userId,
      title: "🎉 Course Enrolled!",
      message: `You have successfully enrolled in "${courseTitle}". Start learning now!`,
      type: "success",
      link: "/dashboard/progress",
    });
  },

  async sendLessonCompletionNotification(
    userId: string,
    courseTitle: string,
    lessonTitle: string,
    progress: number,
  ) {
    const message =
      progress === 100
        ? `🎊 Congratulations! You've completed "${courseTitle}"!`
        : `✅ You completed "${lessonTitle}" in "${courseTitle}". Progress: ${progress}%`;

    return this.create({
      userId,
      title: progress === 100 ? "Course Completed! 🎊" : "Lesson Completed ✅",
      message,
      type: progress === 100 ? "success" : "info",
      link: "/dashboard/progress",
    });
  },
};
