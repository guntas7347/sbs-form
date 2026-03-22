import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Page() {
  return (
    <div className="bg-surface text-on-surface">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img className="size-12" src="./sbssu-logo.png" alt="SBSSU LOGO" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline">
              SBSSU Forms
            </span>
          </div>

          <a
            href="/login"
            className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 active:scale-95 duration-150 transition-all text-sm"
          >
            Login
          </a>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero & Search Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-24">
          <h1 className="editorial-title text-5xl md:text-6xl font-extrabold text-on-surface mb-6">
            The Academic <span className="text-primary">Gallery</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-12 font-body leading-relaxed">
            Access official university documentation, scholarship applications,
            and administrative forms in one streamlined curator.
          </p>
          {/* Centered Search Bar
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-on-surface-variant" />
            </div>
            <input
              type="text"
              placeholder="Search forms..."
              className="w-full pl-14 pr-6 py-5 bg-surface-container-lowest rounded-full border-none shadow-[0_20px_40px_rgba(25,28,30,0.06)] focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-on-surface-variant/50 text-lg"
            />
          </div> */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <a
              href="https://sbssu.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-surface-container-lowest border-2 border-outline-variant text-on-surface hover:border-primary/50 font-bold rounded-xl active:scale-95 transition-all text-lg flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              University Website
            </a>
            <Link
              to="/login"
              className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl hover:shadow-primary/30 active:scale-95 transition-all text-lg flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Login to Portal <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* <section className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary uppercase font-label mb-2 block">
                Available Now
              </span>
              <h2 className="editorial-title text-3xl font-bold text-on-surface">
                Latest Forms
              </h2>
            </div>
            <a
              href="#"
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm"
            >
              View all artifacts
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {formsData.map((form) =>
              form.isPromo ? (
                <div
                  key={form.id}
                  className="signature-gradient p-8 rounded-xl flex flex-col justify-between text-white"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-4 block opacity-80">
                      {form.status}
                    </span>
                    <h3 className="font-headline text-2xl font-extrabold mb-4 leading-tight">
                      {form.title}
                    </h3>
                    <p className="text-sm opacity-90 font-body leading-relaxed mb-6">
                      {form.description}
                    </p>
                  </div>
                  <button className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-surface-bright transition-colors text-sm">
                    {form.buttonText}
                  </button>
                </div>
              ) : (
                <div
                  key={form.id}
                  className="bg-surface-container-lowest p-8 rounded-xl transition-all hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-12 h-12 rounded-lg ${form.iconBgClass} flex items-center justify-center`}
                    >
                      {form.icon}
                    </div>
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full font-label">
                      {form.status}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                    {form.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm font-body leading-relaxed mb-8">
                    {form.description}
                  </p>
                  <button className="w-full py-3 signature-gradient text-white font-bold rounded-xl active:scale-95 transition-all text-sm">
                    {form.buttonText}
                  </button>
                </div>
              ),
            )}
          </div>
        </section> */}
      </main>
    </div>
  );
}
