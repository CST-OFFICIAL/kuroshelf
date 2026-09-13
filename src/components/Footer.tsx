export function Footer() {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 mt-16 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white text-xs font-black">
                黒
              </span>
              <span className="font-display font-extrabold text-white text-base tracking-tight">
                KURO<span className="text-rose-500">SHELF</span>
              </span>
            </div>
            <p className="text-neutral-400 max-w-sm text-[11px] leading-relaxed">
              Modern anime & manga discovery, personal shelf tracking, community predictions, and where-to-watch streaming directory.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px]">
            <div className="space-y-1.5">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Platform
              </span>
              <div className="space-y-1">
                <a href="#discover" className="block text-neutral-400 hover:text-white transition-colors">Discover</a>
                <a href="#seasonal" className="block text-neutral-400 hover:text-white transition-colors">Seasonal Anime</a>
                <a href="#rankings" className="block text-neutral-400 hover:text-white transition-colors">Top Rankings</a>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Community
              </span>
              <div className="space-y-1">
                <a href="#polls" className="block text-neutral-400 hover:text-white transition-colors">Prediction Polls</a>
                <a href="#shelf" className="block text-neutral-400 hover:text-white transition-colors">Personal Shelf</a>
                <a href="#disqus" className="block text-neutral-400 hover:text-white transition-colors">Disqus Forum</a>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Legal & Info
              </span>
              <div className="space-y-1">
                <span className="block text-neutral-400">About Kuro Shelf</span>
                <span className="block text-neutral-400">Privacy Policy</span>
                <span className="block text-neutral-400">Terms of Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Affiliate & Copyright Disclosures */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <p>
            © {new Date().getFullYear()} Kuro Shelf. All rights reserved. Digital anime and manga library.
          </p>
          <p className="text-center sm:text-right max-w-lg">
            As an Amazon Associate, Kuro Shelf earns from qualifying purchases made through book and manga affiliate links.
          </p>
        </div>
      </div>
    </footer>
  );
}
