import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Loader2, Download, Table as TableIcon } from "lucide-react";
import { type Form } from "../../../lib/firebase/form-builder";
import {
  subscribeToAuth,
  loadFormResponses,
} from "../../../lib/firebase/forms";
import Header from "../../components/Header";
import type { User } from "firebase/auth";

export default function ResponsesPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if (!u) {
        navigate("/login");
        setLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!formId || !user) return;

    const loadData = async () => {
      try {
        const {
          form: formData,
          responses: resData,
          error: loadError,
        } = await loadFormResponses(formId, user.uid);

        if (loadError) {
          setError(loadError);
          return;
        }

        setForm(formData);
        setResponses(resData);
      } catch (err) {
        console.error("Error loading responses:", err);
        setError("Error loading responses");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [formId, user]);

  const exportToExcel = () => {
    if (!form || responses.length === 0) return;

    const data = responses.map((res) => {
      const row: Record<string, any> = {
        "Submitted At": res.submittedAt?.toDate().toLocaleString() || "Unknown",
        "User Email": res.userEmail || "Anonymous",
      };

      form.fields.forEach((field) => {
        const val = res.answers?.[field.id];
        if (Array.isArray(val)) {
          row[field.label || field.id] = val.join(", ");
        } else {
          row[field.label || field.id] = val || "";
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, `${form.title || "Untitled"}_Responses.xlsx`);
  };

  if (loading) {
    return (
      <div className="  flex items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-primary font-bold">
          <Loader2 className="animate-spin w-6 h-6" />
          Loading responses...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="  flex flex-col pt-24 items-center bg-surface p-4 text-center">
        <Header setLoading={setLoading} />
        <div className="bg-white p-8 rounded-xl shadow border-t-[10px] border-red-500 max-w-lg w-full">
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary/90 transition-colors text-white font-bold rounded-lg"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="  bg-surface text-gray-800">
      <Header setLoading={setLoading} />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-headline mb-1">
              {form?.title || "Untitled Form"}
            </h1>
            <p className="text-gray-500 font-medium">
              {responses.length} response{responses.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={exportToExcel}
            disabled={responses.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
          >
            <Download className="w-5 h-5" /> Export to Excel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {responses.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
              <TableIcon className="w-16 h-16 text-gray-300 mb-6" />
              <p className="text-lg font-medium">No responses yet.</p>
              <p className="text-sm mt-1">
                Once users submit responses, you'll see them listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5">Submitted At</th>
                    <th className="px-6 py-5">User Email</th>
                    {form?.fields.map((field) => (
                      <th key={field.id} className="px-6 py-5">
                        {field.label || "Untitled Question"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {responses.map((res) => (
                    <tr
                      key={res.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                        {res.submittedAt?.toDate().toLocaleString() ||
                          "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                        {res.userEmail || "Anonymous"}
                      </td>
                      {form?.fields.map((field) => {
                        const val = res.answers?.[field.id];
                        const displayVal = Array.isArray(val)
                          ? val.join(", ")
                          : val || "";
                        return (
                          <td
                            key={field.id}
                            className="px-6 py-4 max-w-sm truncate text-gray-700 font-body"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
