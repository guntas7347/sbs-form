const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 py-4">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-2 text-center md:text-left">
          <img className="size-8" src="./sbssu-logo.png" alt="SBSSU LOGO" />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              SBSSU Forms
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} SBSSU
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://sbssu.ac.in/"
            className="text-xs text-slate-500 hover:text-orange-600 transition"
          >
            Privacy
          </a>
          <a
            href="https://sbssu.ac.in/"
            className="text-xs text-slate-500 hover:text-orange-600 transition"
          >
            Terms
          </a>
          <a
            href="https://sbssu.ac.in/"
            className="text-xs text-orange-600 font-medium underline"
          >
            Support
          </a>
          <a
            href="https://sbssu.ac.in/"
            className="text-xs text-slate-500 hover:text-orange-600 transition"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
