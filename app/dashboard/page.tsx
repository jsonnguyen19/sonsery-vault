"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log("[Dashboard] No user, redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Courses</h3>
          <p className="text-2xl font-bold text-white mt-2">0</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Students</h3>
          <p className="text-2xl font-bold text-white mt-2">0</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Revenue</h3>
          <p className="text-2xl font-bold text-white mt-2">$0</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <p className="text-gray-400">No recent activity to display.</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Your Profile</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-medium text-white">{user?.email || user?.providerData?.[0]?.email || 'No email'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">User ID</p>
            <p className="font-mono text-sm text-gray-300">{user.uid}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Authentication Provider</p>
            <p className="font-medium text-white">
              {user.providerData[0]?.providerId || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Role</p>
            <p className="font-medium text-white">
              {role || "user"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
