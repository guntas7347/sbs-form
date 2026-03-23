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
} from "lucide-react";
import {
  type Form,
  createNewFormDoc,
} from "../../../lib/firebase/form-builder";
import {
  fetchUserFormsPaginated,
  deleteDashboardForm,
} from "../../../lib/firebase/forms";

const ROWS_PER_PAGE = 10;

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

type ExtendedForm = Form & { id: string };

export default function UserDashboard({ currentUser }: { currentUser: any }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<ExtendedForm[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFormsCount, setTotalFormsCount] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);

  const totalPages = Math.max(1, Math.ceil(totalFormsCount / ROWS_PER_PAGE));

  const fetchFormsPage = async (page: number) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const cursor = cursors[page - 1] || null;
      // @ts-ignore
      const res = await fetchUserFormsPaginated(
        currentUser.uid,
        ROWS_PER_PAGE,
        cursor,
      );
      setForms(res.forms as ExtendedForm[]);
      setTotalFormsCount(res.totalCount);

      if (res.lastVisible && cursors.length <= page) {
        setCursors((prev) => {
          const newCursors = [...prev];
          newCursors[page] = res.lastVisible;
          return newCursors;
        });
      }
    } catch (err) {
      console.error("Failed to load paginated forms:", err);
      if (typeof err === "object" && err !== null && "message" in err) {
        if ((err as Error).message.includes("requires an index")) {
          console.error("Firebase Index Required! Check console link.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCursors([null]);
    setCurrentPage(1);
    fetchFormsPage(1);
  }, [currentUser]);

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchFormsPage(nextPage);
  };

  const handlePrevPage = () => {
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    fetchFormsPage(prevPage);
  };

  const createForm = async () => {
    const formId = await createNewFormDoc(
      currentUser?.uid,
      currentUser?.email ?? undefined,
    );
    navigate(`/form-builder/${formId}`);
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    try {
      await deleteDashboardForm(formId, false);
      setForms(forms.filter((f) => f.id !== formId));
      setTotalFormsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to delete form:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
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

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="font-extrabold text-xl mb-3 font-headline">
            No Forms Yet
          </h3>
          <p className="text-base text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            You haven't submitted or created any forms yet. Click the button
            above to start your first draft.
          </p>
          <button
            onClick={createForm}
            className="text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition-colors"
          >
            Start new draft
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Form Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4 text-center">Stats (Q)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forms.map((form) => (
                  <tr
                    key={form.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-gray-900 mb-1">
                        {form.title || "Untitled Form"}
                      </div>
                      <div
                        className="text-xs text-gray-500 truncate max-w-[250px] cursor-help"
                        title={form.description || "No description provided."}
                      >
                        {form.description || "No description provided."}
                      </div>
                    </td>
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
                        <span title={`${form.fields?.length || 0} Questions`}>
                          {form.fields?.length || 0} Qs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/form-builder/${form.id}`}
                          title="Edit Draft"
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        {form.isPublic && (
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
                            <Link
                              to={`/responses/${form.id}`}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                              title="View Responses"
                            >
                              <TableIcon className="w-4 h-4" />
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title={form.isPublic ? "Delete Form" : "Delete Draft"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ROWS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ROWS_PER_PAGE, totalFormsCount)}
                </span>{" "}
                of <span className="font-medium">{totalFormsCount}</span>{" "}
                results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
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
    </>
  );
}
