"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
  Inbox,
  Loader2,
  UserX,
  UserCheck,
} from "lucide-react";
import { toggleBanUser, type AdminUserItem } from "@/lib/actions/admin";

interface AdminUsersTableProps {
  initialUsers: AdminUserItem[];
  currentUserId: string;
}

export function AdminUsersTable({
  initialUsers,
  currentUserId,
}: AdminUsersTableProps) {
  const [usersList, setUsersList] = useState<AdminUserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleBan = (user: AdminUserItem) => {
    if (user.id === currentUserId) return;

    const actionText = user.isBanned ? "unban" : "ban";
    const confirmMessage = user.isBanned
      ? `Are you sure you want to restore access for ${user.name}?`
      : `Are you sure you want to BAN ${user.name}? They will be immediately blocked from logging in or submitting forms.`;

    if (!window.confirm(confirmMessage)) return;

    setActionUserId(user.id);
    startTransition(async () => {
      try {
        const res = await toggleBanUser(user.id, !user.isBanned);
        if (res.success) {
          setUsersList((prev) =>
            prev.map((u) =>
              u.id === user.id ? { ...u, isBanned: !u.isBanned } : u
            )
          );
          showNotification(
            "success",
            `Successfully ${user.isBanned ? "unbanned" : "banned"} ${user.name}.`
          );
        } else {
          showNotification("error", res.error || `Failed to ${actionText} user.`);
        }
      } catch (err: any) {
        showNotification("error", err?.message || "An unexpected error occurred.");
      } finally {
        setActionUserId(null);
      }
    });
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.fatherName && u.fatherName.toLowerCase().includes(q)) ||
      (u.degree && u.degree.toLowerCase().includes(q)) ||
      (u.specialization && u.specialization.toLowerCase().includes(q)) ||
      (u.mobile && u.mobile.includes(q));

    const matchesRole =
      roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "banned" && u.isBanned) ||
      (statusFilter === "active" && !u.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 transition-all shadow-sm ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email, username, degree, father's name, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 text-stone-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers / Faculty</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <span>
          Showing <strong>{filteredUsers.length}</strong> of{" "}
          <strong>{usersList.length}</strong> registered users
        </span>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200/80 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Academic Details</th>
                <th className="py-3.5 px-4">Guardian & Contact</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400">
                    No users matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const isLoadingThis = isPending && actionUserId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors ${
                        u.isBanned
                          ? "bg-rose-50/20 dark:bg-rose-950/10"
                          : ""
                      }`}
                    >
                      {/* Name, Email, Username & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photo ? (
                            <img
                              src={u.photo}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-emerald-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium text-stone-900 dark:text-white truncate">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate block">
                              {u.email}
                            </span>
                            {u.username && (
                              <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 block">
                                ID: {u.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40"
                              : u.role === "teacher" || u.role === "faculty"
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Degree & Specialization */}
                      <td className="py-3.5 px-4">
                        {u.degree || u.specialization ? (
                          <div className="text-stone-800 dark:text-stone-200 font-medium">
                            <span>{u.degree || ""}</span>
                            {u.specialization && (
                              <span className="text-stone-500 dark:text-stone-400 block text-[11px]">
                                {u.specialization}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Father Name & Mobile */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-stone-700 dark:text-stone-300">
                          {u.fatherName ? (
                            <div>
                              <span className="text-stone-400 text-[10px]">S/D of: </span>
                              <span>{u.fatherName}</span>
                            </div>
                          ) : null}
                          {u.mobile ? (
                            <div className="font-mono text-stone-500 dark:text-stone-400">
                              📞 {u.mobile}
                            </div>
                          ) : null}
                          {!u.fatherName && !u.mobile && (
                            <span className="text-stone-400 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
                          <span
                            title="Forms Created"
                            className="inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-orange-500" />
                            <span>{u.formsCount} forms</span>
                          </span>
                          <span
                            title="Submissions Made"
                            className="inline-flex items-center gap-1"
                          >
                            <Inbox className="w-3 h-3 text-emerald-500" />
                            <span>{u.submissionsCount} subs</span>
                          </span>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>Banned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Ban / Unban Action */}
                      <td className="py-3.5 px-4 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-stone-400 italic">
                            Cannot ban self
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleBan(u)}
                            disabled={isLoadingThis}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              u.isBanned
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                            }`}
                          >
                            {isLoadingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : u.isBanned ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Unban User</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Ban User</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
