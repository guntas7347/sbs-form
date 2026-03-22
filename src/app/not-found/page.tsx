import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center bg-surface p-4 text-center">
      <div className="bg-surface-container-lowest p-8 md:p-12 rounded-3xl shadow-sm border border-outline-variant max-w-lg w-full">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold font-headline text-on-surface mb-4">
          404 Not Found
        </h1>
        <p className="text-on-surface-variant font-body mb-8 text-lg">
          The artifact or link you are trying to access has been relocated or
          does not exist on this server.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-lg w-full sm:w-auto"
        >
          <Home className="w-5 h-5" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
