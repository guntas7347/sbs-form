import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { getFormsForUser } from "@/lib/actions/forms";
import { Navbar } from "@/components/Navbar";
import { CreateFormButton } from "@/components/CreateFormButton";
import { FormCard } from "@/components/FormCard";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";

export const instant = false;

export default async function DashboardPage(props: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const {
    forms = [],
    totalCount = 0,
    totalPages = 1,
  } = await getFormsForUser(page, 100);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Top Header Section */}
        <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131920] border border-orange-100 dark:border-stone-800 p-6 sm:p-8 shadow-xs mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white mt-0.5">
                Welcome back, {user.name}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Logged in as{" "}
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  {user.email}
                </span>
                {user.department && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                    {user.department}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <CreateFormButton />
            </div>
          </div>
        </section>

        {/* Forms Management Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                Your Forms
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {totalCount === 0
                  ? "No forms created yet"
                  : `${totalCount} ${totalCount === 1 ? "form" : "forms"} active • Sorted by last modified (100/page)`}
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

              {/* Pagination Controls if more than 1 page */}
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
                      href={`/dashboard?page=${Math.max(1, page - 1)}`}
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
                      href={`/dashboard?page=${Math.min(totalPages, page + 1)}`}
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
      </main>
    </div>
  );
}
