import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-heading font-black text-xl">
                K
              </div>
              <span className="text-2xl font-heading font-extrabold text-white">Kırsof</span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              Connecting local farmers directly with conscious consumers. Fresh produce, fair prices, zero middlemen.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white font-heading font-bold text-lg mb-4">Marketplace</h4>
            <ul className="space-y-3">
              <li><Link href="/explore" className="hover:text-emerald-400 transition-colors">Browse Products</Link></li>
              <li><Link href="/farmers" className="hover:text-emerald-400 transition-colors">Our Farmers</Link></li>
              <li><Link href="/map" className="hover:text-emerald-400 transition-colors">Map Discovery</Link></li>
              <li><Link href="/explore?category=fruits" className="hover:text-emerald-400 transition-colors">Seasonal Fruits</Link></li>
            </ul>
          </div>

          {/* For Farmers */}
          <div>
            <h4 className="text-white font-heading font-bold text-lg mb-4">For Farmers</h4>
            <ul className="space-y-3">
              <li><Link href="/signup?role=farmer" className="hover:text-emerald-400 transition-colors">Start Selling</Link></li>
              <li><Link href="/dashboard/farmer" className="hover:text-emerald-400 transition-colors">Farmer Dashboard</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">Fair Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-heading font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-stone-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stone-500">&copy; {new Date().getFullYear()} Kırsof. All rights reserved. Ankara Science University.</p>
          <div className="flex gap-6 text-stone-500">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
