import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      throw new Error(
        "Chưa cấu hình biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY trong .env",
      );
    }

    const serviceAccount = JSON.parse(rawKey);

    // Sửa lỗi format private_key do ký tự \n bị escape trong file .env
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log("🔥 Firebase Admin SDK đã được khởi tạo thành công!");
  } catch (error) {
    console.error("❌ Lỗi khởi tạo Firebase Admin SDK:", error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
