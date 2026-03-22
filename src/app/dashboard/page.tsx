import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  Globe,
  Lock,
  Edit2,
  Trash2,
  Loader2,
  Table as TableIcon,
  Shield,
  User,
} from "lucide-react";
import {
  type Form,
  createNewFormDoc,
} from "../../../lib/firebase/form-builder";
import {
  subscribeToAuth,
  getCurrentUser,
  fetchDashboardForms,
  deleteDashboardForm,
} from "../../../lib/firebase/forms";
import Header from "../../components/Header";

// Helper to format Firebase timestamps
const formatDate = (timestamp: any) => {
  if (!timestamp) return "N/A";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type ExtendedForm = Form & {
  id: string;
  ownerEmail?: string;
  ownerId?: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<ExtendedForm[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Tab state: 'personal' for My Forms, 'admin' for All Forms
  const [viewMode, setViewMode] = useState<"personal" | "admin">("personal");

  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  // 1. Determine which forms to show based on the active tab
  const displayedForms =
    isAdmin && viewMode === "admin"
      ? forms
      : forms.filter((f) => f.ownerId === currentUserId);

  // 2. Paginate the filtered list
  const totalPages = Math.ceil(displayedForms.length / ROWS_PER_PAGE);
  const paginatedForms = displayedForms.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  const createForm = async () => {
    const currentUser = getCurrentUser();
    const formId = await createNewFormDoc(currentUser?.uid);
    navigate(`/form-builder/${formId}`);
  };

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [displayedForms.length, currentPage, totalPages]);

  useEffect(() => {
    const fetchForms = async (uid: string) => {
      try {
        const { forms: fetchedForms, isAdmin: isUserAdmin } =
          await fetchDashboardForms(uid);
        setIsAdmin(isUserAdmin);
        setForms(fetchedForms);
      } catch (err) {
        console.error("Failed to load forms:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser) {
        setCurrentUserId(currentUser.uid);
        fetchForms(currentUser.uid);
      } else {
        setCurrentUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    try {
      await deleteDashboardForm(formId, isAdmin);
      setForms(forms.filter((f) => f.id !== formId));
    } catch (err) {
      console.error("Failed to delete form:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex items-center gap-3 text-primary font-bold">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Header setLoading={setLoading} />

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold font-headline mb-2">
              My Dashboard
            </h1>
            <p className="text-on-surface-variant font-body">
              Manage or create your form submissions.
            </p>
          </div>
          <button
            onClick={createForm}
            className="flex items-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all text-sm"
          >
            <Plus className="w-5 h-5" />
            Create New Form
          </button>
        </div>

        {/* Admin Tab Switcher */}
        {isAdmin && (
          <div className="flex space-x-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setViewMode("personal")}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                viewMode === "personal"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="w-4 h-4" />
              My Forms
            </button>
            <button
              onClick={() => setViewMode("admin")}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                viewMode === "admin"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="w-4 h-4" />
              All Forms (Admin View)
            </button>
          </div>
        )}

        {/* Content Section */}
        {displayedForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-extrabold text-xl mb-3 font-headline">
              {viewMode === "admin" ? "No Forms Found" : "No Forms Yet"}
            </h3>
            <p className="text-base text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              {viewMode === "admin"
                ? "There are currently no forms in the database."
                : "You haven't submitted or created any forms yet. Click the button above to start your first draft."}
            </p>
            {viewMode === "personal" && (
              <button
                onClick={createForm}
                className="text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition-colors"
              >
                Start new draft
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Form Name</th>

                    {/* Render different headers based on viewMode */}
                    {viewMode === "admin" ? (
                      <>
                        <th className="px-6 py-4">Owner Email</th>
                        <th className="px-6 py-4">Date Created</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date Created</th>
                        <th className="px-6 py-4 text-center">Stats (Q / R)</th>
                      </>
                    )}

                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedForms.map((form) => (
                    <tr
                      key={form.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      {/* Common: Title */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-gray-900 mb-1">
                          {form.title || "Untitled Form"}
                        </div>
                        {viewMode === "personal" && (
                          <div
                            className="text-xs text-gray-500 truncate max-w-[250px] cursor-help"
                            title={
                              form.description || "No description provided."
                            }
                          >
                            {form.description || "No description provided."}
                          </div>
                        )}
                      </td>

                      {/* Admin Specific Columns */}
                      {viewMode === "admin" ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 font-medium">
                              {form.ownerEmail || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {formatDate(form.createdAt || form.updatedAt)}
                          </td>
                        </>
                      ) : (
                        /* Personal Specific Columns */
                        <>
                          <td className="px-6 py-4">
                            {form.isPublic ? (
                              <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-100">
                                <Globe className="w-3.5 h-3.5" /> Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-orange-100">
                                <Lock className="w-3.5 h-3.5" /> Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {formatDate(form.createdAt || form.updatedAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 text-xs text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                              <span
                                title={`${form.fields?.length || 0} Questions`}
                              >
                                {form.fields?.length || 0} Qs
                              </span>
                              <span className="text-gray-300">|</span>
                              <span
                                title={`${(form as any).responsesCount || 0} Responses`}
                              >
                                {(form as any).responsesCount || 0} Res
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Admin View Actions (View & Delete Only) */}
                          {viewMode === "admin" && (
                            <>
                              <a
                                href={`/${form.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                                title="View Public Link"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(form.id)}
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                title="Delete Form"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Personal View Actions (Edit, View, Responses, Delete) */}
                          {viewMode === "personal" && (
                            <>
                              <Link
                                to={`/form-builder/${form.id}`}
                                title="Edit Draft"
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>

                              <a
                                href={`/${form.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                                title="View Public Link"
                              >
                                <Globe className="w-4 h-4" />
                              </a>

                              {form.isPublic && (
                                <Link
                                  to={`/responses/${form.id}`}
                                  className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                  title="View Responses"
                                >
                                  <TableIcon className="w-4 h-4" />
                                </Link>
                              )}

                              <button
                                onClick={() => handleDelete(form.id)}
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                title={
                                  form.isPublic ? "Delete Form" : "Delete Draft"
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * ROWS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * ROWS_PER_PAGE,
                      displayedForms.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{displayedForms.length}</span>{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
