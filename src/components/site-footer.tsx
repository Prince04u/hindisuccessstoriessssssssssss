import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/5 mt-20 py-12 bg-paper">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-serif text-xl font-bold tracking-tighter">HINDI SUCCESS STORIES</div>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
          <Link to="/about" className="hover:text-accent">About</Link>
          <Link to="/submit" className="hover:text-accent">Advertise</Link>
          <Link to="/privacy" className="hover:text-accent">Privacy</Link>
          <Link to="/terms" className="hover:text-accent">Terms</Link>
        </div>
        <div className="text-[10px] text-ink/30 uppercase tracking-widest">© {new Date().getFullYear()} HSS Editorial</div>
      </div>
    </footer>
  );
}
