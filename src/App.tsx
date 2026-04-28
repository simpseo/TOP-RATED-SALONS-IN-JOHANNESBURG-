/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Filter, 
  Award, 
  Sparkles, 
  Info, 
  PhoneCall, 
  Menu, 
  X,
  ChevronRight,
  TrendingUp,
  Globe,
  Zap,
  ArrowRight
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { beautyData, BeautyBusiness } from "./data";
import { BusinessCard } from "./components/BusinessCard";

type Page = "directory" | "elite" | "services" | "about" | "contact";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [suburbFilter, setSuburbFilter] = useState("All Suburbs");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter Logic
  const filteredData = useMemo(() => {
    return beautyData.filter(item => {
      const matchesSearch = item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.search_keywords.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSuburb = suburbFilter === "All Suburbs" || item.suburb === suburbFilter;
      const matchesCategory = categoryFilter === "All Categories" || item.primary_category === categoryFilter;
      
      if (activePage === "elite") {
        return matchesSearch && matchesSuburb && matchesCategory && item.rank_tier === "Tier 1";
      }
      return matchesSearch && matchesSuburb && matchesCategory;
    });
  }, [searchTerm, suburbFilter, categoryFilter, activePage]);

  // Unique Suburbs and Categories for Filters
  const uniqueSuburbs = useMemo(() => ["All Suburbs", ...Array.from(new Set(beautyData.map(d => d.suburb)))], []);
  const uniqueCategories = useMemo(() => ["All Categories", ...Array.from(new Set(beautyData.map(d => d.primary_category)))], []);

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rosegold/30">
      {/* Header */}
      <header className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-charcoal">
          <div 
            className="cursor-pointer group flex items-center gap-2"
            onClick={() => handlePageChange("directory")}
          >
            <div className="w-10 h-10 rounded-full bg-rosegold flex items-center justify-center text-white font-display text-xl group-hover:rotate-12 transition-transform shadow-lg">J</div>
            <div>
              <h1 className="text-lg font-display tracking-tight leading-none group-hover:text-rosegold transition-colors italic">The Johannesburg</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-60">Beauty Index</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {(["directory", "elite", "services", "about", "contact"] as Page[]).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`text-[11px] uppercase tracking-[0.2em] font-semibold transition-all hover:text-rosegold relative py-2 ${
                  activePage === page ? "text-rosegold" : "text-charcoal/60"
                }`}
              >
                {page}
                {activePage === page && (
                  <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rosegold" />
                )}
              </button>
            ))}
          </nav>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-cream flex flex-col items-center justify-center gap-8 md:hidden"
          >
             {(["directory", "elite", "services", "about", "contact"] as Page[]).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className="text-2xl font-display text-charcoal"
              >
                {page}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-20">
        <AnimatePresence mode="wait">
          {activePage === "directory" && (
            <motion.div 
              key="directory"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6"
            >
              {/* Hero Banner */}
              <div className="py-16 text-center">
                <motion.h2 
                  initial={{ y: 20 }} animate={{ y: 0 }}
                  className="text-5xl md:text-7xl font-display mb-6 leading-tight italic"
                >
                  Curated Excellence for <br />
                  <span className="text-rosegold">Modern Beauty.</span>
                </motion.h2>
                <p className="max-w-2xl mx-auto text-charcoal/60 leading-relaxed font-medium">
                  Johannesburg's most comprehensive index of Randburg and Fourways' finest salons, 
                  medspas, and independent artists. Data-driven, elite focused.
                </p>
              </div>

              {/* Search & Filters */}
              <div className="sticky top-24 z-30 mb-12 flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30" />
                  <input 
                    type="text"
                    placeholder="Search by name, category, or keyword..."
                    className="w-full bg-white pl-16 pr-6 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all placeholder:text-charcoal/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rosegold" />
                    <select 
                      className="appearance-none bg-white pl-10 pr-10 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all text-xs font-semibold uppercase tracking-wider text-charcoal/60"
                      value={suburbFilter}
                      onChange={(e) => setSuburbFilter(e.target.value)}
                    >
                      {uniqueSuburbs.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="relative group">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rosegold" />
                    <select 
                       className="appearance-none bg-white pl-10 pr-10 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all text-xs font-semibold uppercase tracking-wider text-charcoal/60"
                       value={categoryFilter}
                       onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="mb-8 flex justify-between items-center border-b border-blush pb-4">
                <p className="text-xs uppercase tracking-widest font-bold text-charcoal/40">
                  Showing {filteredData.length} Results
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredData.slice(0, 40).map((business) => (
                  <BusinessCard 
                    key={business.slug} 
                    business={business} 
                    onClaim={(b) => handlePageChange("contact")}
                  />
                ))}
              </div>
              {filteredData.length > 40 && (
                <div className="mt-12 text-center p-12 bg-white rounded-3xl border border-dashed border-rosegold/30">
                  <p className="text-charcoal/40 text-sm italic">...scroll for more or refine your search to see accurate results</p>
                </div>
              )}
            </motion.div>
          )}

          {activePage === "elite" && (
            <motion.div 
              key="elite"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6"
            >
               <div className="py-16 text-center">
                <div className="inline-flex items-center gap-2 bg-gold-label/10 px-4 py-2 rounded-full text-gold-label text-[10px] uppercase tracking-widest font-black mb-4">
                  <Award className="w-3 h-3" /> Gold Label Collection
                </div>
                <h2 className="text-5xl md:text-7xl font-display mb-6 leading-tight">
                  The Elite <span className="italic">Tier 1.</span>
                </h2>
                <p className="max-w-2xl mx-auto text-charcoal/60 leading-relaxed font-medium">
                  Reserved for businesses with a Rating of 4.7+ and over 100 verified reviews. 
                  This is the standard of excellence in Johannesburg beauty.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredData.map((business) => (
                  <BusinessCard key={business.slug} business={business} />
                ))}
              </div>
            </motion.div>
          )}

          {activePage === "services" && (
            <motion.div 
              key="services"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-5xl mx-auto px-6"
            >
              <div className="text-center py-20">
                <h2 className="text-5xl md:text-6xl font-display italic mb-12">How We Scale Your Salon</h2>
                <div className="grid md:grid-cols-3 gap-12 text-left">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-rosegold shadow-inner">
                      <TrendingUp size={28} />
                    </div>
                    <h3 className="text-2xl">GBP Optimization</h3>
                    <p className="text-sm text-charcoal/60 leading-relaxed">
                      We optimize your Google Business Profile to dominate the "Near Me" searches in Randburg & Fourways. Verified status on this Index is the first step.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-rosegold shadow-inner">
                      <Globe size={28} />
                    </div>
                    <h3 className="text-2xl">Premium Web Design</h3>
                    <p className="text-sm text-charcoal/60 leading-relaxed">
                      Beyond code—we build digital boutiques. Ultra-fast, conversion-optimized, and mirrors your high-end brand aesthetic perfectly.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-rosegold shadow-inner">
                      <Zap size={28} />
                    </div>
                    <h3 className="text-2xl">Google Automation</h3>
                    <p className="text-sm text-charcoal/60 leading-relaxed">
                      Automated booking flows and review requests. Let the software handle the admins while you focus on beauty.
                    </p>
                  </div>
                </div>

                <div className="mt-20 p-12 bg-charcoal rounded-[40px] text-white flex flex-col md:flex-row items-center gap-12">
                  <div className="text-left flex-grow">
                    <h4 className="text-3xl font-display mb-4 italic">Ready to claim your spot?</h4>
                    <p className="text-white/60 text-sm max-w-md">Request a free SEO & Website audit for your beauty business today.</p>
                  </div>
                  <button 
                    onClick={() => handlePageChange("contact")}
                    className="group bg-rosegold px-10 py-5 rounded-2xl flex items-center gap-4 text-xs tracking-widest font-black uppercase hover:bg-white hover:text-rosegold transition-all duration-300 shadow-xl"
                  >
                    Start Your Audit <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activePage === "about" && (
            <motion.div 
              key="about" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto px-6 py-20 text-center"
            >
              <h2 className="text-5xl md:text-6xl font-display italic mb-10">Our Mission</h2>
              <div className="relative mb-16">
                <div className="absolute -inset-4 bg-blush rounded-[60px] -z-10 blur-2xl opacity-50" />
                <p className="text-2xl md:text-3xl font-display leading-relaxed text-charcoal">
                  To connect Johannesburg’s elite beauty professionals with high-value clients who appreciate 
                  <span className="italic text-rosegold"> craftsmanship</span> and <span className="italic text-rosegold">curation</span>.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-10 text-left mt-20">
                <div className="p-8 bg-white rounded-3xl shadow-sm border border-blush">
                  <h4 className="text-xl mb-4 font-display">Who we are</h4>
                  <p className="text-sm text-charcoal/50 leading-relaxed">
                    Powered by Simp SEO Website Designs, we are more than a directory. 
                    We are a digital ecosystem dedicated to the Randburg and Fourways beauty landscape.
                  </p>
                </div>
                <div className="p-8 bg-white rounded-3xl shadow-sm border border-blush">
                  <h4 className="text-xl mb-4 font-display">Why the Index exists</h4>
                  <p className="text-sm text-charcoal/50 leading-relaxed">
                    Local search is crowded. We filter out the noise, showcasing only those who have mastered their craft 
                    and earned their reviews.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activePage === "contact" && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-6 py-10"
            >
              <div className="bg-white rounded-[40px] shadow-2xl p-10 md:p-20 relative overflow-hidden border border-blush">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blush rounded-bl-full opacity-50" />
                <h2 className="text-4xl md:text-5xl font-display italic mb-4">Claim Your Profile</h2>
                <p className="text-charcoal/40 mb-12 max-w-lg">Are you a salon owner on this list? Claim your profile to enable direct bookings, social proof syncing, and elite badge requests.</p>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Your Name</label>
                      <input type="text" className="w-full bg-cream p-4 rounded-xl outline-none focus:ring-2 focus:ring-rosegold/20 border border-blush/20" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Business Email</label>
                      <input type="email" className="w-full bg-cream p-4 rounded-xl outline-none focus:ring-2 focus:ring-rosegold/20 border border-blush/20" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Business Name</label>
                    <input type="text" className="w-full bg-cream p-4 rounded-xl outline-none focus:ring-2 focus:ring-rosegold/20 border border-blush/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Select Request Type</label>
                    <select className="w-full bg-cream p-4 rounded-xl outline-none focus:ring-2 focus:ring-rosegold/20 border border-blush/20 text-xs font-semibold">
                      <option>Claim This Listing</option>
                      <option>Request Free Website Audit</option>
                      <option>Professional Photography Request</option>
                      <option>Advertising Inquiries</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Message</label>
                    <textarea rows={4} className="w-full bg-cream p-4 rounded-xl outline-none focus:ring-2 focus:ring-rosegold/20 border border-blush/20"></textarea>
                  </div>
                  <button className="w-full py-5 bg-rosegold text-white text-xs tracking-widest font-black uppercase rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all">
                    Send My Request
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-charcoal text-white/40 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <h5 className="font-display text-white text-3xl italic tracking-tight">The Johannesburg Index.</h5>
            <p className="text-xs uppercase tracking-[0.3em] font-medium">Beauty excellence by suburb.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <p className="text-white text-[10px] uppercase tracking-[0.2em] font-black">Quick Links</p>
              <ul className="text-xs space-y-2">
                <li className="hover:text-rosegold cursor-pointer" onClick={() => handlePageChange("directory")}>Directory</li>
                <li className="hover:text-rosegold cursor-pointer" onClick={() => handlePageChange("elite")}>Top Rated</li>
                <li className="hover:text-rosegold cursor-pointer" onClick={() => handlePageChange("contact")}>Claim Your Listing</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-white text-[10px] uppercase tracking-[0.2em] font-black">Agency</p>
              <ul className="text-xs space-y-2">
                <li className="text-white font-medium">Simp SEO Website Designs</li>
                <li>064 073 8007</li>
                <li className="lowercase">contact@simpseowebsitedesings.com</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-medium">
          <p>© 2026 The Johannesburg Beauty Index. Powered by SEO Experts.</p>
          <div className="flex gap-8">
            <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
