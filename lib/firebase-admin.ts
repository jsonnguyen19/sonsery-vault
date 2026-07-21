import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

try {
  if (getApps().length === 0) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      throw new Error(
        "Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable",
      );
    }

    const serviceAccount = JSON.parse(rawKey);

    // Fix private_key format (\n escape issue in .env)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log("🔥 Firebase Admin SDK initialized successfully!");
  } else {
    adminApp = getApps()[0];
  }

  if (adminApp) {
    adminDbInstance = getFirestore(adminApp);
    adminAuthInstance = getAuth(adminApp);
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

// Export with fallback to prevent runtime errors
export const adminDb = adminDbInstance || ({} as Firestore);
export const adminAuth = adminAuthInstance || ({} as Auth);

// Helper to check if admin is ready
export const isAdminReady = () => !!adminApp;
