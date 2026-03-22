import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Page from "./app/page";
import LoginPage from "./app/login/page";
import FormPage from "./app/form/page";
import NotFoundPage from "./app/not-found/page";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";

const DashboardPage = lazy(() => import("./app/dashboard/page"));
const FormBuilderPage = lazy(() => import("./app/form-builder/page"));
const ResponsesPage = lazy(() => import("./app/responses/page"));
const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center bg-surface flex-1">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
          }
        >
          <div className="flex-1 flex flex-col [&>*]:flex-1 w-full">
            <Routes>
              <Route path="/" element={<Page />} />
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/form-builder/:formId"
                  element={<FormBuilderPage />}
                />
                <Route path="/responses/:formId" element={<ResponsesPage />} />
              </Route>

              <Route path="/:formId" element={<FormPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Suspense>

        <Footer />
      </div>
    </BrowserRouter>
  );
};
export default App;
