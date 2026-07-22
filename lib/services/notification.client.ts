import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import type {
  Notification,
  CreateNotificationDTO,
  UpdateNotificationDTO,
} from "@/lib/types/notification";

const COLLECTION = "notifications";

// Convert Firestore data to Notification type
const toNotification = (doc: any): Notification => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
};

// Sort notifications by createdAt desc
const sortByDate = (a: Notification, b: Notification) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

// Client-side notification service (use in client components)
export const notificationClient = {
  // Create a notification (client-side)
  async create(dto: CreateNotificationDTO): Promise<Notification> {
    const data = {
      ...dto,
      type: dto.type || "info",
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), data);
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), where("__name__", "==", docRef.id)),
    );
    return toNotification(snapshot.docs[0]);
  },

  // Update a notification (client-side)
  async update(id: string, dto: UpdateNotificationDTO): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      ...dto,
      updatedAt: new Date(),
    });
  },

  // Get all notifications (admin) - no orderBy to avoid index
  async getAllNotifications(): Promise<Notification[]> {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(toNotification);
    return notifications.sort(sortByDate);
  },

  // Get all notifications for a user - no orderBy to avoid index
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(collection(db, COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(toNotification);
    return notifications.sort(sortByDate);
  },

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false),
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // Mark a notification as read
  async markAsRead(id: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      read: true,
      updatedAt: new Date(),
    });
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false),
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true, updatedAt: new Date() });
    });
    await batch.commit();
  },

  // Delete a notification
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // Delete all notifications for a user
  async deleteAll(userId: string): Promise<void> {
    const q = query(collection(db, COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  },

  // Subscribe to realtime notifications for a user - no orderBy
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
  ) {
    const q = query(collection(db, COLLECTION), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(toNotification);
      callback(notifications.sort(sortByDate));
    });
  },

  // Subscribe to unread count for a user
  subscribeToUnreadCount(userId: string, callback: (count: number) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false),
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  },

  // Subscribe to all notifications (admin) - no orderBy
  subscribeToAllNotifications(
    callback: (notifications: Notification[]) => void,
  ) {
    const q = query(collection(db, COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(toNotification);
      callback(notifications.sort(sortByDate));
    });
  },
};
