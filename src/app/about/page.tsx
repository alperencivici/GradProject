import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-green-700 text-white py-20 px-6 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-extrabold mb-6">Our Story</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Kırsof was born from a simple belief: that the farmers who grow our food deserve to be 
            fairly compensated, and that consumers deserve to know exactly where their food comes from.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Our Mission</span>
            <h2 className="text-4xl font-heading font-extrabold text-stone-900 mt-2 mb-6">
              Empowering Local Farmers Through Technology
            </h2>
            <p className="text-stone-600 leading-relaxed text-lg mb-6">
              In Turkey&apos;s traditional agricultural supply chain, small-scale farmers lose up to 60% of their 
              potential income to intermediaries. Consumers pay inflated prices while farmers struggle to survive.
            </p>
            <p className="text-stone-600 leading-relaxed text-lg">
              Kırsof eliminates this gap. We provide a direct digital bridge between farmers and urban consumers — 
              no middlemen, no hidden fees. Just real people, real food, and fair prices.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-extrabold text-emerald-600">4%</p>
              <p className="text-sm text-stone-600 mt-2">Only a 4% withholding tax — no platform fees</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-extrabold text-amber-600">24h</p>
              <p className="text-sm text-stone-600 mt-2">Maximum delivery time for freshness</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-extrabold text-blue-600">0</p>
              <p className="text-sm text-stone-600 mt-2">Middlemen between farmer and consumer</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <p className="text-4xl font-extrabold text-purple-600">100%</p>
              <p className="text-sm text-stone-600 mt-2">Tax-compliant transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-stone-900 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-extrabold mb-4">How Kırsof Works</h2>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto">
              Three simple steps to get fresh produce from local farms to your table.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "01", icon: "🔍", title: "Discover", desc: "Browse products or explore local farms on our interactive map. Filter by category, price, or location." },
              { step: "02", icon: "🛒", title: "Order", desc: "Add items to your cart from multiple farmers. Choose pickup, courier, or cargo delivery. Pay securely online." },
              { step: "03", icon: "🥗", title: "Enjoy", desc: "Receive farm-fresh produce within 24 hours. Rate your experience and support local agriculture." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl mb-4">{item.icon}</div>
                <span className="text-emerald-400 font-mono text-sm">{item.step}</span>
                <h3 className="text-2xl font-heading font-bold mt-2 mb-3">{item.title}</h3>
                <p className="text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDG Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Sustainability</span>
          <h2 className="text-4xl font-heading font-extrabold text-stone-900 mt-2 mb-4">
            Contributing to Global Goals
          </h2>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto">
            Kırsof directly contributes to several UN Sustainable Development Goals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { goal: "SDG 8", title: "Decent Work & Growth", desc: "Increasing farmer income by eliminating middlemen and empowering rural economies.", color: "bg-red-50 border-red-200 text-red-800" },
            { goal: "SDG 9", title: "Industry & Innovation", desc: "Bringing digital transformation to agriculture through a modern marketplace platform.", color: "bg-orange-50 border-orange-200 text-orange-800" },
            { goal: "SDG 12", title: "Responsible Consumption", desc: "Shortening the supply chain to reduce food miles, carbon emissions, and food waste.", color: "bg-green-50 border-green-200 text-green-800" },
          ].map((sdg) => (
            <div key={sdg.goal} className={`rounded-2xl p-6 border ${sdg.color}`}>
              <span className="text-sm font-bold uppercase">{sdg.goal}</span>
              <h3 className="text-xl font-heading font-bold mt-2 mb-3">{sdg.title}</h3>
              <p className="opacity-80 leading-relaxed">{sdg.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-stone-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-heading font-extrabold text-stone-900 mb-4">The Team</h2>
          <p className="text-stone-500 text-lg mb-12">
            Developed as a graduation project at Ankara Science University, Department of Information Science and Computer Engineering.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Alperen Çivici", id: "220205009" },
              { name: "Tahsin Cemal Sakin", id: "220205018" },
              { name: "Serdar Bulut", id: "220201011" },
            ].map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-heading font-bold text-stone-800">{member.name}</h3>
                <p className="text-sm text-stone-500 mt-1">{member.id}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-600 py-20 px-6 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-heading font-extrabold mb-4">Ready to support local farmers?</h2>
          <p className="text-emerald-100 text-xl mb-8">
            Join thousands of conscious consumers and start shopping fresh, local produce today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-emerald-700 font-semibold px-10 py-4 rounded-full hover:bg-stone-100 transition-all shadow-lg">
              Create Account
            </Link>
            <Link href="/explore" className="bg-emerald-700 text-white font-semibold px-10 py-4 rounded-full hover:bg-emerald-800 transition-all border border-emerald-500">
              Browse Market
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
