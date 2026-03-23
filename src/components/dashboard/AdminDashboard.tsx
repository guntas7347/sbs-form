import { useEffect, useState, useMemo } from "react";
import { Globe, Trash2, Loader2, Shield, Users, Search } from "lucide-react";
import {
  fetchAdminFormsPaginated,
  fetchAdminUsersPaginated,
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"forms" | "users">("forms");

  // Forms State
  const [formsLoading, setFormsLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [formsPage, setFormsPage] = useState(1);
  const [totalForms, setTotalForms] = useState(0);
  const [formsCursors, setFormsCursors] = useState<any[]>([null]);

  // Users State
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersCursors, setUsersCursors] = useState<any[]>([null]);

  // Users filters
  const [searchEmail, setSearchEmail] = useState("");
  const [showNonStudents, setShowNonStudents] = useState(false);
  const [showUnofficial, setShowUnofficial] = useState(false);

  // Pagination totals
  const totalFormsPages = Math.max(1, Math.ceil(totalForms / ROWS_PER_PAGE));
  const totalUsersPages = Math.max(1, Math.ceil(totalUsers / ROWS_PER_PAGE));

  // --- FORMS LOGIC ---
  const loadForms = async (page: number) => {
    setFormsLoading(true);
    try {
      const cursor = formsCursors[page - 1] || null;
      const res = await fetchAdminFormsPaginated(ROWS_PER_PAGE, cursor);
      setForms(res.forms);
      setTotalForms(res.totalCount);

      if (res.lastVisible && formsCursors.length <= page) {
        setFormsCursors((prev) => {
          const newCursors = [...prev];
          newCursors[page] = res.lastVisible;
          return newCursors;
        });
      }
    } catch (err) {
      console.error(err);
      if (typeof err === "object" && err !== null && "message" in err) {
        if ((err as Error).message.includes("requires an index")) {
          console.error("Firebase Index Required! Check console link.");
        }
      }
    } finally {
      setFormsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "forms") {
      setFormsCursors([null]);
      setFormsPage(1);
      loadForms(1);
    }
  }, [activeTab]);

  const handleNextFormsPage = () => {
    const next = formsPage + 1;
    setFormsPage(next);
    loadForms(next);
  };

  const handlePrevFormsPage = () => {
    const next = formsPage - 1;
    setFormsPage(next);
    loadForms(next);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    try {
      await deleteDashboardForm(formId, true);
      setForms(forms.filter((f) => f.id !== formId));
      setTotalForms((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // --- USERS LOGIC ---
  const loadUsers = async (page: number, searchKeyword: string) => {
    setUsersLoading(true);
    try {
      const cursor = usersCursors[page - 1] || null;
      const res = await fetchAdminUsersPaginated(
        searchKeyword,
        ROWS_PER_PAGE,
        cursor,
      );
      setUsers(res.users);
      setTotalUsers(res.totalCount);

      if (res.lastVisible && usersCursors.length <= page) {
        setUsersCursors((prev) => {
          const newCursors = [...prev];
          newCursors[page] = res.lastVisible;
          return newCursors;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      setUsersCursors([null]);
      setUsersPage(1);
      loadUsers(1, searchEmail);
    }
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsersCursors([null]);
    setUsersPage(1);
    loadUsers(1, searchEmail);
  };

  const handleNextUsersPage = () => {
    const next = usersPage + 1;
    setUsersPage(next);
    loadUsers(next, searchEmail);
  };

  const handlePrevUsersPage = () => {
    const next = usersPage - 1;
    setUsersPage(next);
    loadUsers(next, searchEmail);
  };

  // Client-side filtering
  const displayedUsers = useMemo(() => {
    if (!showNonStudents && !showUnofficial) return users;
    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const isSbs = email.endsWith("@sbsstc.ac.in");
      const hasNumberPrefix = /^\d+/.test(email);

      const isNonStudent = isSbs && !hasNumberPrefix;
      const isUnofficial = !isSbs;

      if (showNonStudents && showUnofficial) {
        return isNonStudent || isUnofficial;
      } else if (showNonStudents) {
        return isNonStudent;
      } else if (showUnofficial) {
        return isUnofficial;
      }
      return true;
    });
  }, [users, showNonStudents, showUnofficial]);

  // --- RENDER ---
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-headline mb-2 text-purple-700">
            Admin Dashboard
          </h1>
          <p className="text-on-surface-variant font-body">
            Manage all forms and users.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("forms")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "forms"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Shield className="w-4 h-4" />
          All Forms
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
      </div>

      {activeTab === "forms" && (
        <>
          {formsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center shadow-sm">
              <Shield className="w-10 h-10 text-gray-400 mb-4" />
              <h3 className="font-extrabold text-xl mb-3 font-headline">
                No Forms Found
              </h3>
              <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed">
                There are currently no forms in the database.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4">Form Name</th>
                      <th className="px-6 py-4">Owner Email</th>
                      <th className="px-6 py-4">Date Created</th>
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
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 font-medium">
                            {form.ownerEmail || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {formatDate(form.createdAt || form.updatedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
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
                              onClick={() => handleDeleteForm(form.id)}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                              title="Delete Form"
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
              {totalFormsPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(formsPage - 1) * ROWS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(formsPage * ROWS_PER_PAGE, totalForms)}
                    </span>{" "}
                    of <span className="font-medium">{totalForms}</span> forms
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevFormsPage}
                      disabled={formsPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextFormsPage}
                      disabled={formsPage === totalFormsPages}
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
      )}

      {activeTab === "users" && (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-bold mb-4 font-headline text-gray-800">
              Search & Filter Users
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              <form
                onSubmit={handleSearchSubmit}
                className="flex-1 w-full relative"
              >
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Search by Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="E.g. staff@sbsstc.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
              </form>
              <div className="flex flex-col gap-2 min-w-[250px]">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNonStudents}
                    onChange={(e) => setShowNonStudents(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Non-Students (No digits prefix)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnofficial}
                    onChange={(e) => setShowUnofficial(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Unofficial (Not @sbsstc.ac.in)
                </label>
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center shadow-sm">
              <Users className="w-10 h-10 text-gray-400 mb-4" />
              <h3 className="font-extrabold text-xl mb-3 font-headline">
                No Users Found
              </h3>
              <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed">
                Could not find any users matching your criteria.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4">User Email</th>
                      <th className="px-6 py-4">Admin Status</th>
                      <th className="px-6 py-4">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-gray-900 mb-1">
                            {user.email || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-100">
                              <Shield className="w-3.5 h-3.5" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                          {user.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalUsersPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(usersPage - 1) * ROWS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(usersPage * ROWS_PER_PAGE, totalUsers)}
                    </span>{" "}
                    of <span className="font-medium">{totalUsers}</span> users
                    server-side. Local filters may hide some.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevUsersPage}
                      disabled={usersPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextUsersPage}
                      disabled={usersPage === totalUsersPages}
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
      )}
    </>
  );
}
