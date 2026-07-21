"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  onIdTokenChanged,
  User,
  signOut,
  getIdToken as firebaseGetIdToken,
} from "firebase/auth";
import { useToast } from "@/components/ui/ToastContainer";

import type { UserRole } from "@/lib/types/user";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
  getIdToken: async () => null,
  isAdmin: false,
});

const syncSessionWithServer = async (user: User) => {
  try {
    const token = await firebaseGetIdToken(user);
    console.log("[Client Auth State] ID token refreshed");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      console.error("[Client Auth State] Failed to sync session with server");
    } else {
      console.log("[Client Auth State] Session synced with server");
    }
  } catch (error) {
    console.error("[Client Auth State] Error syncing session:", error);
  }
};

const clearSessionOnServer = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    console.log("[Client Auth State] Server session cleared");
  } catch (error) {
    console.error("[Client Auth State] Error clearing session:", error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      console.log(
        `[Client Auth State] User state changed: ${user?.email || "null"}`
      );

      setUser(user);

      // Fetch user role from server
      if (user) {
        try {
          const response = await fetch("/api/auth/check");
          if (response.ok) {
            const data = await response.json();
            setRole(data.role || "user");
            console.log(`[Client Auth] User role: ${data.role || "user"}`);
          }
        } catch (error) {
          console.error("[Client Auth] Error fetching role:", error);
          setRole("user");
        }
      } else {
        setRole(null);
      }

      setLoading(false);

      if (user) {
        await syncSessionWithServer(user);
      } else {
        await clearSessionOnServer();
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      console.log("[Client Auth] Logging out...");
      await signOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
      console.log("[Client Auth] Logged out successfully");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("[Client Auth] Logout error:", error);
      toast.error("Failed to log out");
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await firebaseGetIdToken(user);
    } catch (error) {
      console.error("[Client Auth] Error getting ID token:", error);
      return null;
    }
  };

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, getIdToken, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
