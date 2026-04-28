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
  ArrowRight,
  User as UserIcon,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Crown,
  Star as StarIcon,
  Camera,
  MapPin,
  Phone,
  LayoutDashboard,
  CheckCircle2,
  Users,
  MessageSquare,
  Calendar,
  ListChecks,
  Lock,
  Upload
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { beautyData, BeautyBusiness as LocalBeautyBusiness } from "./data";
import { BusinessCard, Business } from "./components/BusinessCard";
import SearchBar from "./components/SearchBar";
import Submenu from "./components/Submenu";
import FloatingButton from "./components/FloatingButton";
import { syncGBPData } from "./services/gbpService";
import { auth, db, storage, signInWithGoogle, signOut, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Page = "directory" | "elite" | "services" | "about" | "contact" | "membership" | "list-business" | "dashboard";

interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  subscriptionTier: "free" | "trial" | "standard" | "vip";
  role: "customer" | "business_owner";
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [suburbFilter, setSuburbFilter] = useState("All Suburbs");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const userTiers = [
    {
      id: "free",
      name: "Free Explorer",
      price: "R0",
      features: ["View basic business info", "Search by suburb", "Limited profile views"]
    },
    {
      id: "trial",
      name: "Intro Trial",
      price: "R9.00",
      period: "1st Month",
      features: ["Verified Review Eligibility", "Ad-free experience", "Save favorites", "Standard support"]
    },
    {
      id: "standard",
      name: "Beauty Standard",
      price: "R60.00",
      features: ["Priority booking access", "Exclusive local deals", "Verified review posting", "Member-only events"]
    },
    {
      id: "vip",
      name: "VIP Premium",
      price: "R99.00",
      features: ["Private Concierge booking", "Elite deal access (40%+ off)", "VVIP lounge invites", "Custom profile badge"]
    }
  ];

  const businessTiers = [
    {
      id: "basic",
      name: "Essential",
      price: "R299",
      features: ["Index Listing", "1 Gallery Image", "Basic Analytics", "Verified Checkmark"]
    },
    {
      id: "standard",
      name: "Growth",
      price: "R186",
      originalPrice: "R369",
      isSpecial: true,
      features: ["Unlimited Gallery", "Direct Booking Link", "SEO Optimization", "Featured in Suburb"]
    },
    {
      id: "premium",
      name: "Premium Profile",
      price: "R400",
      features: ["Top 3 Ranking", "Top Front Page Banner", "Elite Gold Label", "24/7 Priority Support"]
    }
  ];

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              userId: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Beauty Fan",
              subscriptionTier: "free",
              role: "customer"
            };
            await setDoc(userRef, { ...newProfile, createdAt: serverTimestamp() });
            setUserProfile(newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const websiteCategories = [
    "Hair Salon", "Barber Shop", "Nail Tech Studio", "Aesthetic Clinic", "Day Spa", "Medical Spa (Medspa)",
    "Braiding Studio", "Lash Studio", "Brow Bar", "Waxing Studio", "Makeup Artistry", "Yoga Studio",
    "Wellness Center", "Cosmetic Dentistry", "Holistic Therapy", "Massage Studio", "Skincare Clinic",
    "Permanent Makeup (PMU)", "Tanning Salon", "Laser Clinic", "Hair Restoration", "IV Hydration Therapy"
  ];

  const [firestoreBusinesses, setFirestoreBusinesses] = useState<any[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"overview" | "services" | "appointments" | "messages">("overview");
  const [newBusinessServices, setNewBusinessServices] = useState<{name: string, price: string, duration: string, description: string}[]>([
    { name: "", price: "", duration: "", description: "" }
  ]);

  // User Businesses Listener
  useEffect(() => {
    if (!currentUser) {
      setUserBusinesses([]);
      return;
    }
    const q = query(collection(db, "businesses"), where("ownerId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserBusinesses(businesses);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "user-businesses");
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSync = async (business: any) => {
    setIsSyncing(business.id);
    try {
      const result = await syncGBPData(business.businessName, business.gbpLink);
      if (result.success) {
        const busRef = doc(db, "businesses", business.id);
        await setDoc(busRef, { 
          rating: result.rating, 
          reviewCount: result.reviewCount,
          lastSyncedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        // Optional: show toast or success message
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(null);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "businesses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreBusinesses(businesses);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "businesses");
    });
    return () => unsubscribe();
  }, []);

  const combinedData = useMemo(() => {
    const rawData = [...firestoreBusinesses, ...beautyData];
    
    // Select top 20 rated businesses to promote as "PREMIUM PROFILE"
    const sortedByRating = [...rawData].sort((a, b) => {
      const ratingA = a.google_rating || a.rating || 0;
      const ratingB = b.google_rating || b.rating || 0;
      const countA = a.review_count || a.reviewCount || 0;
      const countB = b.review_count || b.reviewCount || 0;
      
      if (ratingB !== ratingA) return ratingB - ratingA;
      return countB - countA; // Tie-break with review count
    });

    const top20Slugs = new Set(sortedByRating.slice(0, 20).map(b => b.slug));

    return rawData.map(business => {
      if (top20Slugs.has(business.slug)) {
        return { 
          ...business, 
          rankTier: "premium",
          isPremium: true
        };
      }
      return business;
    });
  }, [firestoreBusinesses]);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    const filtered = combinedData.filter(item => {
      const name = item.business_name || item.businessName || "";
      const keywords = item.search_keywords || "";
      const suburb = item.suburb || item.area || "";
      const category = item.primary_category || item.primaryCategory || "";
      
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          keywords.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSuburb = suburbFilter === "All Suburbs" || suburb === suburbFilter;
      const matchesCategory = categoryFilter === "All Categories" || category === categoryFilter;
      
      if (activePage === "elite") {
        const tier = item.rank_tier || item.rankTier;
        return matchesSearch && matchesSuburb && matchesCategory && (tier === "premium" || item.isPremium);
      }
      return matchesSearch && matchesSuburb && matchesCategory;
    });

    // Sort: Premium first, then Standard, then Basic
    return filtered.sort((a, b) => {
      const tierMap: Record<string, number> = { "premium": 100, "standard": 50, "basic": 10 };
      const tierA = tierMap[a.rank_tier || a.rankTier || (a.isPremium ? "premium" : "basic")] || 0;
      const tierB = tierMap[b.rank_tier || b.rankTier || (b.isPremium ? "premium" : "basic")] || 0;
      
      if (tierB !== tierA) return tierB - tierA; // Higher tier first

      // Within same tier, sort by rating and review count
      const ratingA = a.google_rating || a.rating || 0;
      const ratingB = b.google_rating || b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;

      const countA = a.review_count || a.reviewCount || 0;
      const countB = b.review_count || b.reviewCount || 0;
      return countB - countA;
    });
  }, [searchTerm, suburbFilter, categoryFilter, activePage, combinedData]);

  const [visibleCount, setVisibleCount] = useState(40);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  
  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filteredData.length) {
        setVisibleCount(prev => prev + 20);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredData.length]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [searchTerm, suburbFilter, categoryFilter, activePage]);
  
  // Calculate Top 5 for Hall of Fame
  const topRatedHallOfFame = useMemo(() => {
    return [...combinedData]
      .sort((a, b) => {
        const ratingA = a.google_rating || a.rating || 0;
        const ratingB = b.google_rating || b.rating || 0;
        const countA = a.review_count || a.reviewCount || 0;
        const countB = b.review_count || b.reviewCount || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return countB - countA;
      })
      .slice(0, 5);
  }, [combinedData]);

  const topRatedSlugs = useMemo(() => new Set(topRatedHallOfFame.map(b => b.slug)), [topRatedHallOfFame]);

  // Unique Suburbs and Categories for Filters
  const uniqueSuburbs = useMemo(() => ["All Suburbs", ...Array.from(new Set(combinedData.map(d => d.suburb || d.area).filter(Boolean)))], [combinedData]);
  const uniqueCategories = useMemo(() => ["All Categories", ...Array.from(new Set(combinedData.map(d => d.primary_category || d.primaryCategory).filter(Boolean)))], [combinedData]);

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemberUpgrade = async (tier: "free" | "trial" | "standard" | "vip") => {
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await setDoc(userRef, { subscriptionTier: tier, updatedAt: serverTimestamp() }, { merge: true });
      setUserProfile(prev => prev ? { ...prev, subscriptionTier: tier } : null);
      handlePageChange("directory");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser?.uid}`);
    }
  };

  const [isSubmittingBusiness, setIsSubmittingBusiness] = useState(false);

  const handleBusinessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }
    setIsSubmittingBusiness(true);
    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get("businessImage") as File;
    const galleryFiles = formData.getAll("galleryImages") as File[];
    let imageUrl = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800";
    let galleryUrls: string[] = [];

    try {
      if (imageFile && imageFile.size > 0) {
        const storageRef = ref(storage, `businesses/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      if (galleryFiles && galleryFiles.length > 0) {
        const uploadPromises = galleryFiles
          .filter(file => file.size > 0)
          .slice(0, 10)
          .map(async (file) => {
            const galleryRef = ref(storage, `businesses/${currentUser.uid}/gallery/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(galleryRef, file);
            return getDownloadURL(snapshot.ref);
          });
        galleryUrls = await Promise.all(uploadPromises);
      }

      const services = newBusinessServices.filter(s => s.name);

      const data = {
        businessName: formData.get("businessName"),
        ownerId: currentUser.uid,
        primaryCategory: formData.get("category"),
        suburb: formData.get("suburb"),
        phone: formData.get("phone"),
        website: formData.get("website"),
        gbpLink: formData.get("gbpLink"),
        bookingUrl: formData.get("bookingUrl"),
        bookingPlans: formData.get("bookingPlans"),
        mainImage: imageUrl,
        gallery: galleryUrls,
        services: services,
        description: formData.get("description"),
        rankTier: formData.get("rankTier") || "basic",
        isPremium: formData.get("rankTier") === "premium",
        verifiedStatus: false,
        rating: 0,
        reviewCount: 0,
        slug: (formData.get("businessName") as string).toLowerCase().replace(/\s+/g, '-'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "businesses"), data);
      setNewBusinessServices([{ name: "", price: "", duration: "", description: "" }]);
      handlePageChange("directory");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "businesses");
    } finally {
      setIsSubmittingBusiness(false);
    }
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
          <AnimatePresence>
            {!isZenMode && (
              <motion.nav 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="hidden md:flex items-center gap-10"
              >
                {(["directory", "elite", "membership", "services", "contact"] as Page[]).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`text-[11px] uppercase tracking-[0.2em] font-semibold transition-all hover:text-rosegold relative py-2 ${
                      activePage === page ? "text-rosegold" : "text-charcoal/60"
                    }`}
                  >
                    {page === "list-business" ? "List Business" : page}
                    {activePage === page && (
                      <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rosegold" />
                    )}
                  </button>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>

          <div className="hidden md:flex items-center gap-6">
            {!currentUser ? (
              <AnimatePresence>
                {!isZenMode && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={signInWithGoogle}
                    className="bg-rosegold text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-rosegold/20 transition-all active:scale-95"
                  >
                    Sign In
                  </motion.button>
                )}
              </AnimatePresence>
            ) : (
              <AnimatePresence>
                {!isZenMode && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4"
                  >
                <button
                   onClick={() => handlePageChange("dashboard")}
                   className={`flex items-center gap-2 transition-colors text-[10px] uppercase font-black tracking-widest ${
                     activePage === "dashboard" ? "text-rosegold" : "text-charcoal/60 hover:text-rosegold"
                   }`}
                >
                  <LayoutDashboard size={14} /> Dashboard
                </button>
                <div className="h-4 w-px bg-charcoal/10" />
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handlePageChange("membership")}>
                   <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center text-rosegold">
                      {userProfile?.subscriptionTier === 'elite' ? <Crown size={14} /> : <UserIcon size={14} />}
                   </div>
                   <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-tighter leading-none">{userProfile?.displayName}</p>
                      <p className="text-[7px] uppercase tracking-widest text-rosegold font-bold uppercase">{userProfile?.subscriptionTier}</p>
                   </div>
                </div>
                <button onClick={signOut} className="text-charcoal/30 hover:text-red-500 transition-colors">
                  <LogOut size={16} />
                </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

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
             {(["directory", "elite", "services", "membership", "contact"] as Page[]).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className="text-2xl font-display text-charcoal"
              >
                {page === "list-business" ? "List Your Business" : page}
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
                <p className="max-w-2xl mx-auto text-charcoal/60 leading-relaxed font-medium mb-8">
                  Johannesburg's most comprehensive index of Randburg and Fourways' finest salons, 
                  medspas, and independent artists. Data-driven, elite focused.
                </p>
                <div className="flex justify-center gap-6">
                </div>
              </div>

              {/* Search & Submenu */}
              <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                isUIHidden={isZenMode}
              />
              <AnimatePresence>
                {!isZenMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Submenu 
                      suburbFilter={suburbFilter}
                      setSuburbFilter={setSuburbFilter}
                      categoryFilter={categoryFilter}
                      setCategoryFilter={setCategoryFilter}
                      uniqueSuburbs={uniqueSuburbs}
                      uniqueCategories={uniqueCategories}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Elite Deals - Only for Elite Members */}
              {userProfile?.subscriptionTier === 'elite' && (
                <div className="mb-16">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-charcoal text-rosegold flex items-center justify-center shadow-lg">
                        <Crown size={20} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display italic">Elite Members Only</h3>
                        <p className="text-[10px] uppercase tracking-widest font-black text-rosegold">Exclusive High-Value Offers</p>
                      </div>
                   </div>
                   <div className="grid md:grid-cols-2 gap-6 scale-100">
                      <div className="bg-charcoal p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-8 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rosegold/10 rounded-bl-full pointer-events-none" />
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/10">
                          <img src="https://images.unsplash.com/photo-1522337660859-02fbefce4ffc?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center md:text-left flex-grow">
                          <h4 className="text-xl font-display mb-1 italic">VVIP Facial Concierge</h4>
                          <p className="text-xs text-white/40 mb-4 uppercase tracking-widest">40% OFF - Private Session</p>
                          <button className="px-6 py-2.5 bg-rosegold text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white hover:text-rosegold transition-all shadow-lg active:scale-95">Claim Elite Deal</button>
                        </div>
                      </div>
                      <div className="bg-charcoal p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-8 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rosegold/10 rounded-bl-full pointer-events-none" />
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/10">
                          <img src="https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center md:text-left flex-grow">
                          <h4 className="text-xl font-display mb-1 italic">Elite Hair Restoration</h4>
                          <p className="text-xs text-white/40 mb-4 uppercase tracking-widest">Free Consultation + R500 Voucher</p>
                          <button className="px-6 py-2.5 bg-rosegold text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white hover:text-rosegold transition-all shadow-lg active:scale-95">Claim Elite Deal</button>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Hall of Fame Section */}
              {topRatedHallOfFame.length > 0 && searchTerm === "" && suburbFilter === "All Suburbs" && categoryFilter === "All Categories" && (
                <div className="mb-32 mt-12">
                   <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.4em] font-black text-rosegold mb-4 block">Gold Standard</span>
                        <h2 className="text-4xl md:text-6xl font-display italic leading-none">The Hall of Fame.</h2>
                      </div>
                      <p className="text-charcoal/40 text-xs max-w-[200px] font-medium italic">Our top 5 highest-rated boutiques, audited for service excellence and client satisfaction.</p>
                   </div>
                   <div className="flex md:grid md:grid-cols-5 gap-6 overflow-x-auto pb-8 md:pb-0 scrollbar-hide snap-x snap-mandatory">
                      {topRatedHallOfFame.map((business) => (
                        <div key={`fame-${business.slug}`} className="min-w-[280px] md:min-w-0 scale-95 hover:scale-100 transition-transform duration-500 snap-center">
                          <BusinessCard 
                            business={business} 
                            userTier={userProfile?.subscriptionTier}
                            isTopRated={true}
                          />
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Grid */}
              <div className="mb-8 flex justify-between items-center border-b border-blush pb-4">
                <p className="text-xs uppercase tracking-widest font-bold text-charcoal/40">
                  Showing {filteredData.length} Results
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredData.slice(0, visibleCount).map((business: Business) => (
                  <BusinessCard 
                    key={business.slug} 
                    business={business} 
                    onClaim={(b) => handlePageChange("contact")}
                    userTier={userProfile?.subscriptionTier}
                    isTopRated={topRatedSlugs.has(business.slug)}
                  />
                ))}
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                {filteredData.length > visibleCount && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-rosegold/20 border-t-rosegold rounded-full animate-spin" />
                    <p className="text-[9px] uppercase tracking-widest font-bold text-charcoal/30">Loading Excellence...</p>
                  </div>
                )}
                {filteredData.length <= visibleCount && filteredData.length > 0 && (
                  <p className="text-[9px] uppercase tracking-widest font-bold text-charcoal/20 italic">You've reached the end of the Index</p>
                )}
              </div>

              {/* Testimonials Section */}
              <div className="mt-32 mb-20">
                <div className="text-center mb-16">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-black text-rosegold mb-4 block">Client Experiences</span>
                  <h3 className="text-4xl md:text-5xl font-display italic">Voices of Excellence.</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      quote: "The only directory I trust for my monthly aesthetic treatments. The 'Elite' filter saved me hours of research.",
                      author: "Sarah J.",
                      role: "VIP Member",
                      business: "The Skin Sanctuary",
                      slug: "skin-sanctuary"
                    },
                    {
                      quote: "Found my signature barber in Sandton through the Index. The contact details unlock is worth every cent of the trial.",
                      author: "David M.",
                      role: "Intro Member",
                      business: "Legends Barber",
                      slug: "legends-barber"
                    },
                    {
                      quote: "As a frequent traveler, having a private booking concierge for my hair appointments in JHB is a absolute lifesaver.",
                      author: "Nomvula K.",
                      role: "VIP Member",
                      business: "Sorbet Drybar",
                      slug: "sorbet-drybar"
                    }
                  ].map((t, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className="bg-white p-10 rounded-[50px] border border-blush/30 shadow-sm relative group cursor-pointer"
                      onClick={() => {
                        setSearchTerm(t.business);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                    >
                      <div className="text-rosegold mb-6 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={32} />
                      </div>
                      <p className="text-lg font-display italic text-charcoal mb-8 leading-relaxed">"{t.quote}"</p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-rosegold text-[10px] font-black uppercase">
                          {t.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-charcoal">{t.author}</p>
                          <p className="text-[9px] font-bold text-rosegold uppercase">{t.role} • <span className="underline">{t.business}</span></p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
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
                {filteredData.map((business: Business) => (
                  <BusinessCard 
                    key={business.slug} 
                    business={business} 
                    userTier={userProfile?.subscriptionTier}
                    isTopRated={topRatedSlugs.has(business.slug)}
                  />
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

          {activePage === "membership" && (
            <motion.div 
              key="membership"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-7xl mx-auto px-6 py-12"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl md:text-7xl font-display italic mb-6">Elevate Your Presence.</h2>
                <p className="text-charcoal/60 max-w-2xl mx-auto font-medium">Choose a package tailored for elite beauty enthusiasts and business owners tracking for growth.</p>
              </div>

              {/* User Packages */}
              <div className="mb-20">
                <div className="flex items-center gap-3 mb-10 justify-center">
                  <div className="h-px w-10 bg-rosegold/20" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black text-rosegold">Member Subscriptions</span>
                  <div className="h-px w-10 bg-rosegold/20" />
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  {userTiers.map((tier) => (
                    <div key={tier.id} className={`bg-white p-8 rounded-[40px] border ${userProfile?.subscriptionTier === tier.id ? 'border-rosegold ring-4 ring-rosegold/5' : 'border-blush'} shadow-sm flex flex-col relative overflow-hidden group`}>
                      {userProfile?.subscriptionTier === tier.id && (
                        <div className="absolute top-0 right-0 bg-rosegold text-white text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl">Current</div>
                      )}
                      <div className="mb-6">
                        <p className="text-[9px] uppercase tracking-widest font-black text-rosegold/60 mb-1">{tier.id === 'trial' ? 'One Month Special' : 'Plan'}</p>
                        <h3 className="text-2xl font-display italic mb-3 text-charcoal">{tier.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold tracking-tighter">{tier.price}</span>
                          <span className="text-[9px] text-charcoal/40 font-black uppercase tracking-widest">/{tier.period || 'month'}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-8 flex-grow">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-charcoal/70 leading-tight">
                            <ShieldCheck size={14} className="text-rosegold shrink-0 mt-0.5" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => handleMemberUpgrade(tier.id as any)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          userProfile?.subscriptionTier === tier.id 
                          ? 'bg-cream text-rosegold cursor-default' 
                          : 'bg-charcoal text-white hover:bg-rosegold'
                        }`}
                      >
                        {userProfile?.subscriptionTier === tier.id ? 'Active Plan' : tier.id === 'free' ? 'Browse Directory' : 'Subscribe'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Packages */}
              <div>
                <div className="flex items-center gap-3 mb-10 justify-center">
                  <div className="h-px w-10 bg-gold-label/20" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gold-label">Partner Listings</span>
                  <div className="h-px w-10 bg-gold-label/20" />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {businessTiers.map((tier) => (
                    <div key={tier.id} className={`bg-white p-10 rounded-[50px] border ${tier.id === 'premium' ? 'border-gold-label shadow-2xl scale-105 z-10' : 'border-blush'} shadow-sm flex flex-col relative overflow-hidden group`}>
                      {tier.isSpecial && (
                        <div className="absolute top-6 -right-10 rotate-45 bg-rosegold text-white text-[8px] font-black uppercase px-12 py-1 shadow-lg">Most Popular</div>
                      )}
                      <div className="mb-8">
                        <p className="text-[9px] uppercase tracking-widest font-black text-gold-label mb-1">Business</p>
                        <h3 className="text-3xl font-display italic mb-4 text-charcoal">{tier.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold tracking-tighter">{tier.price}</span>
                          {tier.originalPrice && (
                            <span className="text-sm text-charcoal/30 line-through font-bold">{tier.originalPrice}</span>
                          )}
                          <span className="text-xs text-charcoal/40 font-black uppercase tracking-widest">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-4 mb-10 flex-grow">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-3 text-xs text-charcoal/70 leading-relaxed">
                            <PlusCircle size={16} className="text-gold-label shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => handlePageChange("list-business")}
                        className={`w-full py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${
                          tier.id === 'premium' ? 'bg-gold-label text-white hover:bg-charcoal' : 'bg-charcoal text-white hover:bg-gold-label'
                        } shadow-xl`}
                      >
                        List My Business
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activePage === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto px-6"
            >
              <div className="py-12 border-b border-blush/30 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl md:text-6xl font-display italic mb-4">Business Dashboard.</h2>
                  <p className="text-charcoal/60 font-medium tracking-tight">Manage your listings and performance on the Index.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handlePageChange("list-business")}
                    className="bg-charcoal text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rosegold transition-all shadow-xl flex items-center gap-2 w-fit"
                  >
                    <PlusCircle size={14} /> List New Salon
                  </button>
                </div>
              </div>

              {/* Dashboard Tabs */}
              <div className="flex gap-8 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "services", label: "Services", icon: ListChecks },
                  { id: "appointments", label: "Appointments", icon: Calendar },
                  { id: "messages", label: "Messages", icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id as any)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap ${
                      dashboardTab === tab.id 
                        ? "bg-rosegold text-white shadow-lg" 
                        : "bg-white text-charcoal/40 hover:bg-rosegold/5 hover:text-rosegold border border-blush/20"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {userBusinesses.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[60px] border border-blush/20 shadow-sm">
                  <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center text-rosegold mx-auto mb-6">
                    <LayoutDashboard size={32} />
                  </div>
                  <h3 className="text-2xl font-display italic mb-2">No active listings yet.</h3>
                  <p className="text-charcoal/40 text-sm mb-8 max-w-sm mx-auto">Get your beauty business in front of thousands of local premium customers.</p>
                  <button 
                    onClick={() => handlePageChange("list-business")}
                    className="bg-rosegold text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:shadow-rosegold/20 transition-all active:scale-95"
                  >
                    Create Your First Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-12">
                  {dashboardTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {userBusinesses.map((bus) => (
                        <div key={bus.id} className="bg-white rounded-[50px] border border-blush/30 p-8 shadow-sm hover:shadow-xl transition-all group">
                          {/* ... existing business card content ... */}
                          <div className="relative h-48 rounded-[32px] overflow-hidden mb-6">
                            <img src={bus.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={bus.businessName} />
                            <div className="absolute top-4 right-4 flex gap-2">
                               {bus.isPremium && <div className="bg-charcoal text-rosegold px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg"><Crown size={10} className="inline mr-1" /> Elite</div>}
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg ${bus.verifiedStatus ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                 {bus.verifiedStatus ? 'Verified' : 'Pending'}
                               </div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h4 className="text-2xl font-display italic mb-1">{bus.businessName}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-4">{bus.primaryCategory} • {bus.suburb}</p>
                            
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-blush/20 mb-6">
                               <div className="text-center border-r border-blush/10">
                                  <p className="text-[8px] uppercase tracking-widest font-bold text-charcoal/30 mb-1">Index Rating</p>
                                  <div className="flex items-center justify-center gap-1">
                                    <StarIcon size={12} className="text-rosegold fill-rosegold" />
                                    <span className="text-lg font-bold">{bus.rating || 0}</span>
                                  </div>
                               </div>
                               <div className="text-center">
                                  <p className="text-[8px] uppercase tracking-widest font-bold text-charcoal/30 mb-1">Reviews</p>
                                  <span className="text-lg font-bold italic">{bus.reviewCount || 0}</span>
                               </div>
                            </div>

                            {bus.lastSyncedAt && (
                              <p className="text-[8px] text-center text-charcoal/20 uppercase font-black tracking-widest mb-6 italic">
                                Last synced: {bus.lastSyncedAt?.toDate ? new Date(bus.lastSyncedAt.toDate()).toLocaleDateString() : 'Just now'}
                              </p>
                            )}
                            
                            <div className="flex gap-4">
                               <button 
                                 disabled={isSyncing === bus.id}
                                 onClick={() => handleSync(bus)}
                                 className="flex-grow bg-rosegold text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-charcoal transition-all disabled:opacity-50"
                               >
                                 {isSyncing === bus.id ? (
                                   <>
                                     <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                     Syncing...
                                   </>
                                 ) : (
                                   <>
                                     <Zap size={14} /> GBP Auto-Sync
                                   </>
                                 )}
                               </button>
                               <button 
                                 onClick={() => setDashboardTab("services")}
                                 className="w-12 h-12 bg-cream text-rosegold rounded-2xl flex items-center justify-center hover:bg-rosegold hover:text-white transition-all shadow-sm"
                               >
                                  <ListChecks size={20} />
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dashboardTab === "services" && (
                    <div className="space-y-8">
                       {userBusinesses.map(bus => (
                         <div key={bus.id} className="bg-white p-10 rounded-[50px] border border-blush/20 shadow-sm">
                            <h3 className="text-3xl font-display italic mb-6">{bus.businessName} Services</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {(bus.services || []).map((s: any, idx: number) => (
                                 <div key={idx} className="bg-cream p-8 rounded-3xl relative group">
                                    <h4 className="text-xl font-display italic mb-1">{s.name}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rosegold mb-4">R{s.price} • {s.duration}</p>
                                    <p className="text-xs text-charcoal/40 leading-relaxed mb-6">{s.description}</p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-charcoal/20 group-hover:text-red-400 transition-colors">Archive Service</button>
                                 </div>
                               ))}
                               <button 
                                 onClick={() => alert("Redirecting to service editor...")}
                                 className="border-2 border-dashed border-blush/40 flex flex-col items-center justify-center p-8 rounded-3xl hover:border-rosegold/40 group transition-all"
                               >
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rosegold mb-4 shadow-md group-hover:scale-110 transition-transform">
                                    <PlusCircle size={20} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Add New Service</span>
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {dashboardTab === "appointments" && (
                    <div className="space-y-8">
                       <div className="bg-white p-12 rounded-[60px] border border-blush/30 text-center">
                          <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center text-rosegold mx-auto mb-6">
                            <Calendar size={32} />
                          </div>
                          <h3 className="text-2xl font-display italic mb-2">No upcoming appointments.</h3>
                          <p className="text-charcoal/40 text-sm mb-8 max-w-sm mx-auto">When clients book through your profile, they will appear here in real-time.</p>
                       </div>
                    </div>
                  )}

                  {dashboardTab === "messages" && (
                    <div className="grid md:grid-cols-3 gap-8 h-[600px]">
                       <div className="col-span-1 bg-white rounded-[40px] border border-blush/30 p-6 flex flex-col gap-4 overflow-y-auto">
                          <h4 className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 px-2">Active Chats</h4>
                          <div className="p-4 bg-rosegold/5 rounded-2xl border border-rosegold/10 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-rosegold text-white flex items-center justify-center font-display italic">S</div>
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight">Sarah J.</p>
                                <p className="text-[8px] text-rosegold uppercase font-bold">Inquiry: Signature Facial</p>
                             </div>
                          </div>
                       </div>
                       <div className="col-span-2 bg-white rounded-[40px] border border-blush/30 p-8 flex flex-col">
                          <div className="flex-grow flex flex-col justify-center items-center text-center text-charcoal/20">
                             <MessageSquare size={48} className="mb-4 opacity-20" />
                             <p className="text-lg font-display italic">Select a conversation to start chatting.</p>
                          </div>
                          <div className="mt-8 flex gap-4">
                             <input type="text" placeholder="Type your message..." className="flex-grow bg-cream border-none p-5 rounded-2xl outline-none text-sm" />
                             <button className="bg-rosegold text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase">Send</button>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activePage === "list-business" && (
            <motion.div 
               key="list-business"
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: 20 }}
               className="max-w-4xl mx-auto px-6 py-12"
            >
              {!currentUser ? (
                <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-blush p-20 text-center">
                  <div className="w-20 h-20 bg-rosegold/10 text-rosegold rounded-full flex items-center justify-center mx-auto mb-8">
                    <UserIcon size={40} />
                  </div>
                  <h2 className="text-4xl font-display italic mb-4">Portal Access Restricted.</h2>
                  <p className="text-charcoal/40 mb-12 max-w-sm mx-auto">Please sign in with your Google account to access the boutique owner portal and list your salon.</p>
                  <button 
                    onClick={signInWithGoogle}
                    className="bg-charcoal text-white px-12 py-5 rounded-[30px] font-black uppercase tracking-widest text-xs hover:bg-rosegold transition-all shadow-xl active:scale-95"
                  >
                    Sign In with Google
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-blush">
                  <div className="bg-charcoal p-12 text-white text-center relative overflow-hidden">
                    <button 
                      onClick={() => handlePageChange("directory")}
                      className="absolute top-8 left-8 z-20 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-rosegold transition-colors"
                    >
                      <ChevronRight className="rotate-180" size={14} /> Back
                    </button>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                      <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full" />
                      <div className="absolute bottom-10 right-10 w-40 h-40 border border-white rounded-full" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] uppercase tracking-[0.4em] font-black text-rosegold mb-4 block">Boutique Registration</span>
                      <h2 className="text-4xl md:text-6xl font-display italic mb-4">List Your Brand.</h2>
                      <p className="text-white/40 text-sm max-w-md mx-auto">Join the curated collection of Johannesburg's finest beauty destinations.</p>
                    </div>
                  </div>
                  <form className="p-8 md:p-16 space-y-16" onSubmit={handleBusinessSubmit}>
                     {/* Section 1: Business Identity */}
                     <section className="space-y-8">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-2xl bg-rosegold/10 text-rosegold flex items-center justify-center font-display italic text-xl">01</div>
                          <h3 className="text-2xl font-display italic">Brand Identity</h3>
                       </div>
                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Boutique Name</label>
                             <input name="businessName" type="text" required className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="Elite Hair Studio" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Specialization</label>
                             <select name="category" required className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm appearance-none">
                                {websiteCategories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Artist / Owner Biography</label>
                          <textarea name="description" rows={4} className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="Tell your brand's story..." />
                       </div>
                     </section>

                     {/* Section 2: Location & Contact */}
                     <section className="space-y-8">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-2xl bg-rosegold/10 text-rosegold flex items-center justify-center font-display italic text-xl">02</div>
                          <h3 className="text-2xl font-display italic">Location & Contact</h3>
                       </div>
                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Suburb / Area</label>
                             <select name="suburb" required className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm appearance-none">
                                {uniqueSuburbs.filter(s => s !== "All Suburbs").map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Direct Boutique Line</label>
                             <input name="phone" type="tel" required className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="064 000 0000" />
                          </div>
                       </div>
                     </section>

                     {/* Section 3: Visual Showcase */}
                     <section className="space-y-8">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 rounded-2xl bg-rosegold/10 text-rosegold flex items-center justify-center font-display italic text-xl">03</div>
                           <h3 className="text-2xl font-display italic">Visual Showcase</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Main Portfolio Cover</label>
                                <div className="relative group aspect-square">
                                  <input 
                                    name="businessImage" 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  />
                                  <div className="w-full h-full bg-cream border-2 border-dashed border-blush/40 flex flex-col items-center justify-center rounded-[40px] text-center group-hover:border-rosegold/40 transition-colors">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rosegold mb-3 shadow-lg">
                                      <Camera size={20} />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-charcoal/60 px-4">Upload Signature Portrait</p>
                                  </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Gallery Portfolio (R186+)</label>
                                <div className="relative group aspect-square">
                                  <input 
                                    name="galleryImages" 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  />
                                  <div className="w-full h-full bg-cream border-2 border-dashed border-blush/40 flex flex-col items-center justify-center rounded-[40px] text-center group-hover:border-rosegold/40 transition-colors">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rosegold mb-3 shadow-lg">
                                      <PlusCircle size={20} />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-charcoal/60 px-4">Upload Gallery Photos</p>
                                    <p className="text-[9px] text-charcoal/30 mt-2 uppercase">Select up to 10 files</p>
                                  </div>
                                </div>
                            </div>
                        </div>
                     </section>

                     {/* Section 4: Digital Presence */}
                     <section className="space-y-8">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 rounded-2xl bg-rosegold/10 text-rosegold flex items-center justify-center font-display italic text-xl">04</div>
                           <h3 className="text-2xl font-display italic">Digital Presence</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                  <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30">Google Business Profile Sync</label>
                                  <div className="flex items-center gap-1.5 bg-gold-label/10 px-2 py-0.5 rounded-full border border-gold-label/20">
                                    <Crown size={8} className="text-gold-label" />
                                    <span className="text-[8px] font-black uppercase text-gold-label">Premium Sync</span>
                                  </div>
                                </div>
                                <input 
                                  name="gbpLink" 
                                  type="url" 
                                  className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" 
                                  placeholder="https://maps.app.goo.gl/..." 
                                />
                                <p className="text-[9px] text-charcoal/30 ml-1 uppercase opacity-60 italic">* Allows us to sync your live rating and reviews</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                               <div className="space-y-2">
                                   <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Official Website</label>
                                   <input name="website" type="url" className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="https://yourboutique.com" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Direct Booking Link</label>
                                   <input name="bookingUrl" type="url" className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="https://calendly.com/..." />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Active Booking Plans</label>
                               <textarea name="bookingPlans" rows={2} className="w-full bg-cream border-none p-5 rounded-3xl outline-none focus:ring-4 focus:ring-rosegold/10 text-sm" placeholder="E.g. Pay at Salon, Deposit Required, etc." />
                            </div>
                        </div>
                     </section>

                     {/* Section 5: Services & Pricing */}
                     <section className="space-y-8">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 rounded-2xl bg-rosegold/10 text-rosegold flex items-center justify-center font-display italic text-xl">05</div>
                           <h3 className="text-2xl font-display italic">Services & Pricing</h3>
                        </div>
                        <div className="space-y-8">
                          {newBusinessServices.map((service, idx) => (
                            <div key={idx} className="p-8 bg-cream/50 rounded-3xl border border-blush/20 space-y-6 relative">
                               {idx > 0 && (
                                 <button 
                                   type="button"
                                   onClick={() => setNewBusinessServices(prev => prev.filter((_, i) => i !== idx))}
                                   className="absolute top-6 right-6 text-charcoal/20 hover:text-red-400 transition-colors"
                                 >
                                   <X size={16} />
                                 </button>
                               )}
                               <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                     <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Service Name</label>
                                     <input 
                                       type="text" 
                                       value={service.name}
                                       onChange={(e) => {
                                         const next = [...newBusinessServices];
                                         next[idx].name = e.target.value;
                                         setNewBusinessServices(next);
                                       }}
                                       className="w-full bg-white border-none p-4 rounded-xl outline-none text-xs" 
                                       placeholder="E.g. Classic Silk Press" 
                                     />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Price (R)</label>
                                        <input 
                                          type="number" 
                                          value={service.price}
                                          onChange={(e) => {
                                            const next = [...newBusinessServices];
                                            next[idx].price = e.target.value;
                                            setNewBusinessServices(next);
                                          }}
                                          className="w-full bg-white border-none p-4 rounded-xl outline-none text-xs" 
                                          placeholder="450" 
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Duration</label>
                                        <input 
                                          type="text" 
                                          value={service.duration}
                                          onChange={(e) => {
                                            const next = [...newBusinessServices];
                                            next[idx].duration = e.target.value;
                                            setNewBusinessServices(next);
                                          }}
                                          className="w-full bg-white border-none p-4 rounded-xl outline-none text-xs" 
                                          placeholder="60 mins" 
                                        />
                                     </div>
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Short Description</label>
                                  <input 
                                    type="text" 
                                    value={service.description}
                                    onChange={(e) => {
                                      const next = [...newBusinessServices];
                                      next[idx].description = e.target.value;
                                      setNewBusinessServices(next);
                                    }}
                                    className="w-full bg-white border-none p-4 rounded-xl outline-none text-xs" 
                                    placeholder="Briefly explain the service..." 
                                  />
                               </div>
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => setNewBusinessServices([...newBusinessServices, { name: "", price: "", duration: "", description: "" }])}
                            className="w-full py-4 border-2 border-dashed border-blush/40 text-[10px] font-black uppercase tracking-widest text-charcoal/40 rounded-2xl hover:border-rosegold transition-all"
                          >
                             + Add Another Service
                          </button>
                        </div>
                     </section>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-black text-charcoal/30 ml-1 text-center block mb-4">Select Growth Tier</label>
                           <div className="grid md:grid-cols-3 gap-4">
                              <label className="relative flex flex-col p-6 bg-cream rounded-3xl cursor-pointer hover:bg-blush/30 transition-colors border-2 border-transparent has-[:checked]:border-rosegold">
                                 <input type="radio" name="rankTier" value="basic" defaultChecked className="absolute opacity-0" />
                                 <span className="text-[10px] font-black uppercase text-charcoal/40 mb-1">Essential</span>
                                 <span className="text-xl font-display italic leading-none mb-1">R299</span>
                                 <span className="text-[8px] uppercase font-bold text-charcoal/30">/ month</span>
                                 <p className="text-[9px] text-charcoal/30 mt-2 uppercase">Verified status, 1 image</p>
                              </label>
                              <label className="relative flex flex-col p-6 bg-cream rounded-3xl cursor-pointer hover:bg-blush/30 transition-colors border-2 border-transparent has-[:checked]:border-rosegold">
                                 <input type="radio" name="rankTier" value="standard" className="absolute opacity-0" />
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase text-rosegold">Growth</span>
                                    <span className="text-[9px] font-black text-rosegold/40 line-through">R369</span>
                                 </div>
                                 <span className="text-xl font-display italic leading-none mb-1">R186</span>
                                 <span className="text-[8px] uppercase font-bold text-charcoal/30">/ month</span>
                                 <p className="text-[9px] text-charcoal/30 mt-2 uppercase">Direct Booking, SEO</p>
                              </label>
                              <label className="relative flex flex-col p-6 bg-cream rounded-3xl cursor-pointer hover:bg-blush/30 transition-colors border-2 border-transparent has-[:checked]:border-rosegold">
                                 <input type="radio" name="rankTier" value="premium" className="absolute opacity-0" />
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase text-gold-label">Premium</span>
                                    <Crown size={14} className="text-gold-label" />
                                 </div>
                                 <span className="text-xl font-display italic leading-none mb-1">R400</span>
                                 <span className="text-[8px] uppercase font-bold text-charcoal/30">/ month</span>
                                 <p className="text-[9px] text-charcoal/30 mt-2 uppercase">Top Ranking, Banner Ad</p>
                              </label>
                           </div>
                    </div>

                    <div className="pt-6">
                       <button 
                         type="submit" 
                         disabled={isSubmittingBusiness}
                         className="w-full py-6 bg-charcoal text-white rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-rosegold transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                       >
                          {isSubmittingBusiness ? "Publishing Boutique..." : (
                            <>Confirm & Publish <ArrowRight className="group-hover:translate-x-2 transition-transform" /></>
                          )}
                       </button>
                    </div>
                 </form>
                </div>
              )}
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
                <li className="hover:text-rosegold cursor-pointer" onClick={() => handlePageChange("list-business")}>List Your Salon</li>
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

      {/* Floating Buttons */}
      <FloatingButton 
        onWebsiteClick={() => setIsWebsiteModalOpen(true)}
        isZenMode={isZenMode}
        setIsZenMode={setIsZenMode}
      />

      {/* Website Modal */}
      <AnimatePresence>
        {isWebsiteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWebsiteModalOpen(false)}
              className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-[70] cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[40px] shadow-2xl z-[80] overflow-hidden"
            >
              <div className="relative p-10 md:p-14">
                <button 
                  onClick={() => setIsWebsiteModalOpen(false)}
                  className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-cream text-charcoal/40 hover:text-charcoal transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>

                <div className="mb-10 text-center">
                  <div className="inline-flex items-center gap-2 bg-rosegold/10 px-4 py-2 rounded-full text-rosegold text-[10px] uppercase tracking-widest font-black mb-4">
                    Digital Boutique Design
                  </div>
                  <h2 className="text-4xl font-display italic mb-3">Qualify Your Business</h2>
                  <p className="text-sm text-charcoal/40 max-w-sm mx-auto leading-relaxed">
                    Tell us about your brand vision and we'll build a conversion-ready digital home for your salon.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsWebsiteModalOpen(false); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Business Name</label>
                      <input 
                        type="text" required
                        placeholder="E.g. Velvet Rose Studio"
                        className="w-full bg-cream border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rosegold/20 text-sm placeholder:text-charcoal/20" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Website Category</label>
                      <div className="relative">
                        <select 
                          required
                          className="w-full bg-cream border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rosegold/20 text-sm appearance-none cursor-pointer"
                        >
                          <option value="">Select Speciality</option>
                          {websiteCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 pointer-events-none opacity-20" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Owner / Manager Name</label>
                    <input 
                      type="text" required
                      placeholder="Your full name"
                      className="w-full bg-cream border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rosegold/20 text-sm placeholder:text-charcoal/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Work Email</label>
                      <input 
                        type="email" required
                        placeholder="owner@business.co.za"
                        className="w-full bg-cream border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rosegold/20 text-sm placeholder:text-charcoal/20" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-black text-charcoal/30 ml-1">Phone Number</label>
                      <input 
                        type="tel" required
                        placeholder="064 000 0000"
                        className="w-full bg-cream border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rosegold/20 text-sm placeholder:text-charcoal/20" 
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full py-5 bg-charcoal text-white text-xs tracking-widest font-black uppercase rounded-2xl shadow-xl hover:bg-rosegold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      Request Consultation <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[9px] text-center mt-4 text-charcoal/20 uppercase tracking-tighter">Powered by Simp SEO Website Designs</p>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
