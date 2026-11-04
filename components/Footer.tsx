import MadeBy from "./MadeBy";

export default function Footer() {
  return (
    <footer className="border-t border-orange-100/60 flex justify-around items-center dark:border-stone-800 py-6 text-center text-xs text-stone-400 relative z-10">
      SBS FORMS &bull; Shaheed Bhagat Singh State University, Ferozepur
      <div className="mx-2">
        <MadeBy />
      </div>
    </footer>
  );
}
