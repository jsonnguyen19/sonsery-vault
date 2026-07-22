"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  User,
  Users as UsersIcon,
  RefreshCw,
} from "lucide-react";

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "user";
  disabled: boolean;
  createdAt?: string;
  lastSignIn?: string;
}

export default function AdminUsersPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUserUid = user?.uid;

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: "admin" | "user") => {
    setUpdating(uid);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${uid}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
      console.error("Error updating role:", err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          disabled={loadingUsers}
        >
          <RefreshCw
            className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/50">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.uid}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                          {user.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {user.uid.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-900/50 text-purple-300 border border-purple-700"
                            : "bg-gray-800 text-gray-300 border border-gray-700"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.disabled
                            ? "bg-red-900/50 text-red-300 border border-red-700"
                            : "bg-green-900/50 text-green-300 border border-green-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.disabled ? "bg-red-400" : "bg-green-400"}`}
                        />
                        {user.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === "admin" ? (
                          <button
                            onClick={() => updateUserRole(user.uid, "user")}
                            disabled={
                              updating === user.uid ||
                              user.uid === currentUserUid
                            }
                            className="px-3 py-1.5 text-xs font-medium text-yellow-300 hover:text-yellow-200 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === user.uid
                              ? "Updating..."
                              : "Remove Admin"}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserRole(user.uid, "admin")}
                            disabled={updating === user.uid}
                            className="px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-200 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === user.uid
                              ? "Updating..."
                              : "Make Admin"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/30">
          <p className="text-sm text-gray-400">
            Total users:{" "}
            <span className="text-white font-medium">{users.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
