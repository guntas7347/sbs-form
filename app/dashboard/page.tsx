import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { getFormsForUser } from "@/lib/actions/forms";
import { getAllUsers, getAllFormsForAdmin } from "@/lib/actions/admin";
import { Navbar } from "@/components/Navbar";
import { CreateFormButton } from "@/components/CreateFormButton";
import { FormCard } from "@/components/FormCard";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminAllFormsTable } from "@/components/admin/AdminAllFormsTable";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  Inbox,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";

export const instant = false;

export default async function DashboardPage(props: {
  searchParams?: Promise<{ page?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const activeTab = searchParams?.tab || "my-forms";

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const isAdmin = user.role === "admin";

  // Fetch standard user forms
  const {
    forms = [],
    totalCount = 0,
    totalPages = 1,
  } = await getFormsForUser(page, 100);

  // If administrator, load platform-wide forms and users
  let adminUsersList = null;
  let adminFormsList = null;

  if (isAdmin) {
    const [usersRes, formsRes] = await Promise.all([
      getAllUsers(),
      getAllFormsForAdmin(1, 200),
    ]);

    adminUsersList = usersRes.success && usersRes.users ? usersRes.users : [];
    adminFormsList = formsRes.success && formsRes.forms ? formsRes.forms : [];
  }

  const totalPlatformForms = adminFormsList?.length ?? totalCount;
  const totalPlatformUsers = adminUsersList?.length ?? 0;
  const totalBannedUsers =
    adminUsersList?.filter((u) => u.isBanned).length ?? 0;
  const totalPlatformSubmissions =
    adminFormsList?.reduce((acc, f) => acc + (f.submissionCount || 0), 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131920] border border-orange-100 dark:border-stone-800 p-6 sm:p-8 shadow-xs mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Dashboard
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                    <span>Administrator</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
                Welcome back, {user.name}
              </h1>

              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-2 pt-0.5">
                <span>Logged in as</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  {user.email}
                </span>
                {(user.degree || user.specialization) && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                    {[user.degree, user.specialization].filter(Boolean).join(" • ")}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <CreateFormButton />
            </div>
          </div>

          {/* Admin Stats Overview Bar */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60">
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>Total Users</span>
                </div>
                <div className="text-xl font-bold text-stone-900 dark:text-white">
                  {totalPlatformUsers}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60">
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Platform Forms</span>
                </div>
                <div className="text-xl font-bold text-stone-900 dark:text-white">
                  {totalPlatformForms}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60">
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-1">
                  <Inbox className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Total Submissions</span>
                </div>
                <div className="text-xl font-bold text-stone-900 dark:text-white">
                  {totalPlatformSubmissions}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60">
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Banned Users</span>
                </div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {totalBannedUsers}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tab Navigation for Admins */}
        {isAdmin && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-3">
            <Link
              href="/dashboard?tab=my-forms"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "my-forms"
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-[#131920] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Forms</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200/50 dark:bg-stone-700/50">
                {totalCount}
              </span>
            </Link>

            <Link
              href="/dashboard?tab=all-forms"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "all-forms"
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-[#131920] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Platform Forms</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                {totalPlatformForms}
              </span>
            </Link>

            <Link
              href="/dashboard?tab=users"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-[#131920] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Users & Bans</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {totalPlatformUsers}
              </span>
            </Link>
          </div>
        )}

        {/* Tab 1: My Forms View */}
        {activeTab === "my-forms" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  Your Forms
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {totalCount === 0
                    ? "No forms created yet"
                    : `${totalCount} ${
                        totalCount === 1 ? "form" : "forms"
                      } active • Sorted by last modified (100/page)`}
                </p>
              </div>

              {totalCount > 0 && (
                <CreateFormButton variant="secondary" label="New Form" />
              )}
            </div>

            {forms.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-[#131920] border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center mb-4 shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  You haven&apos;t created any forms yet
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-6 leading-relaxed">
                  Start collecting responses from your team or audience. Build
                  clean, minimal forms with custom deadlines and post-submission
                  experiences in seconds.
                </p>
                <CreateFormButton />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {forms.map((form) => (
                    <FormCard key={form.id} form={form} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 text-xs">
                    <span className="text-stone-500 dark:text-stone-400">
                      Showing{" "}
                      <strong className="text-stone-800 dark:text-stone-200">
                        {(page - 1) * 100 + 1}
                      </strong>{" "}
                      to{" "}
                      <strong className="text-stone-800 dark:text-stone-200">
                        {Math.min(page * 100, totalCount)}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-stone-800 dark:text-stone-200">
                        {totalCount}
                      </strong>{" "}
                      forms
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard?page=${Math.max(
                          1,
                          page - 1
                        )}&tab=my-forms`}
                        className={`p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 inline-flex items-center gap-1 ${
                          page <= 1
                            ? "opacity-40 pointer-events-none"
                            : "cursor-pointer"
                        }`}
                        aria-disabled={page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </Link>

                      <span className="px-3 py-1.5 rounded-xl font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40">
                        Page {page} of {totalPages}
                      </span>

                      <Link
                        href={`/dashboard?page=${Math.min(
                          totalPages,
                          page + 1
                        )}&tab=my-forms`}
                        className={`p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 inline-flex items-center gap-1 ${
                          page >= totalPages
                            ? "opacity-40 pointer-events-none"
                            : "cursor-pointer"
                        }`}
                        aria-disabled={page >= totalPages}
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Tab 2: Admin All Forms View */}
        {isAdmin && activeTab === "all-forms" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                All Forms on Platform
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                View any form on `/f/[id]`, review submissions, or delete
                inappropriate forms. Non-owned forms cannot be edited.
              </p>
            </div>

            <AdminAllFormsTable initialForms={adminFormsList || []} />
          </section>
        )}

        {/* Tab 3: Admin Users Management View */}
        {isAdmin && activeTab === "users" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                User Management & Access Control
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                View all registered users synced via SBS SSO. You can suspend or
                ban any account to block them from logging in.
              </p>
            </div>

            <AdminUsersTable
              initialUsers={adminUsersList || []}
              currentUserId={user.id}
            />
          </section>
        )}
      </main>
    </div>
  );
}
