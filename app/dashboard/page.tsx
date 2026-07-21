"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log("[Dashboard] No user, redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-4">
            <div className="border-b border-gray-700 pb-4">
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium text-white">{user.email}</p>
            </div>

            <div className="border-b border-gray-700 pb-4">
              <p className="text-sm text-gray-400">User ID</p>
              <p className="font-mono text-sm text-gray-300">{user.uid}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Authentication Provider</p>
              <p className="font-medium text-white">
                {user.providerData[0]?.providerId || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
