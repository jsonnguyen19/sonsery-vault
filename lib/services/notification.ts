import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Notification, CreateNotificationDTO, UpdateNotificationDTO } from '@/lib/types/notification';

const COLLECTION = 'notifications';

export const notificationService = {
  // Create a notification
  async create(data: CreateNotificationDTO): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      type: data.type || 'info',
      read: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get a single notification
  async get(id: string): Promise<Notification | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate() : new Date(docSnap.data().createdAt) || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate ? docSnap.data().updatedAt.toDate() : new Date(docSnap.data().updatedAt) || new Date(),
    } as Notification;
  },

  // Get all notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) || new Date(),
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt) || new Date(),
    })) as Notification[];
    // Sort by createdAt descending on client
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return notifications;
  },

  // Get all notifications (admin)
  async getAllNotifications(): Promise<Notification[]> {
    const q = query(
      collection(db, COLLECTION)
    );
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) || new Date(),
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt) || new Date(),
    })) as Notification[];
    // Sort by createdAt descending on client
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return notifications;
  },

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  // Update a notification
  async update(id: string, data: UpdateNotificationDTO): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Mark a notification as read
  async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true });
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true, updatedAt: Timestamp.now() })
    );
    await Promise.all(batch);
  },

  // Delete a notification
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Delete all notifications for a user
  async deleteAll(userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const batch = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(batch);
  },

  // Subscribe to realtime notifications for a user
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) || new Date(),
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt) || new Date(),
      })) as Notification[];
      // Sort by createdAt descending on client
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(notifications);
    });
  },

  // Subscribe to unread count for a user
  subscribeToUnreadCount(
    userId: string,
    callback: (count: number) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      callback(snapshot.size);
    });
  },

  // Subscribe to all notifications (admin)
  subscribeToAllNotifications(
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION)
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) || new Date(),
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt) || new Date(),
      })) as Notification[];
      // Sort by createdAt descending on client
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(notifications);
    });
  },
};
