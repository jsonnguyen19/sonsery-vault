"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Profile Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Display Name</p>
            <p className="font-medium text-white">
              {user?.displayName || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="font-medium text-white">
              {user?.email || user?.providerData?.[0]?.email || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">User ID</p>
            <p className="font-mono text-sm text-gray-300">{user?.uid || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
