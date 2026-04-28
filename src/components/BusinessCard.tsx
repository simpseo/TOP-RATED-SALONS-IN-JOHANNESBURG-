/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, MapPin, Phone, Star, Plus, Share2, Check, Crown, Zap, TrendingUp, ChevronRight, Globe, Trophy, Camera, X } from "lucide-react";
import { useState } from "react";
import type { BeautyBusiness as LocalBusiness } from "../data";

// Allow both local and firestore business types
// ... (rest of interface remains same)
export interface Business extends Partial<LocalBusiness> {
  businessName?: string;
  business_name?: string;
  rankTier?: string;
  rank_tier?: string;
  rating?: number;
  reviewCount?: number;
  review_count?: number;
  mainImage?: string;
  gallery?: string[];
  primaryCategory?: string;
  primary_category?: string;
  isPremium?: boolean;
  verifiedStatus?: boolean;
  verified_status?: boolean;
  phone?: string;
  website?: string;
  gbpLink?: string;
  bookingUrl?: string;
  booking_url?: string;
  suburb?: string;
  area?: string;
  slug: string;
  search_keywords?: string;
  services?: { name: string; price: number; duration: string; description: string }[];
  bookingPlans?: string;
}

interface BusinessCardProps {
  key?: string | number;
  business: Business;
  onClaim?: (business: Business) => void;
  userTier?: "free" | "trial" | "standard" | "vip";
  isTopRated?: boolean;
}

export function BusinessCard({ business, onClaim, userTier = "free", isTopRated = false }: BusinessCardProps) {
  const [copied, setCopied] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const businessName = business.business_name || business.businessName;
  const isVerified = business.verified_status || business.verifiedStatus;
  
  // Rank Tiers: basic, standard, premium (Market Leader)
  const rankTier = business.rank_tier || business.rankTier || (business.isPremium ? "standard" : "basic");
  
  const suburb = business.suburb || business.area;
  const rating = business.google_rating || business.rating || 0;
  const reviewCount = business.review_count || business.reviewCount || 0;
  const image = business.featured_image || business.mainImage;
  const phone = business.phone;
  const website = business.website;
  const bookingUrl = business.booking_url || business.bookingUrl;
  const gallery = business.gallery || [];

  const showContactDetails = true;

  const handleShare = async () => {
    const shareData = {
      title: businessName || "Beauty Business",
      text: `Check out ${businessName} in ${suburb} on The Johannesburg Beauty Index!`,
      url: website || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -8 }}
        className={`group relative bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border ${rankTier === 'premium' ? 'border-gold-label/40 ring-1 ring-gold-label/10' : 'border-blush/40'}`}
        id={`card-${business.slug}`}
      >
        {/* Tier Badges */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
          {isTopRated && (
            <div className="bg-rosegold text-white text-[8px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20">
              <Trophy size={10} className="animate-bounce" /> Top Rated #1
            </div>
          )}
          {rankTier === "premium" && (
            <div className="bg-charcoal text-gold-label text-[8px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-gold-label/30">
              <Crown size={10} className="animate-pulse" /> PREMIUM PROFILE
            </div>
          )}
          {rankTier === "standard" && (
            <div className="bg-rosegold text-white text-[8px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <Zap size={10} /> Fast Growth
            </div>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-charcoal/40 hover:text-rosegold transition-all shadow-lg active:scale-90"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </button>
          {gallery.length > 0 && (
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-rosegold text-white shadow-lg hover:scale-110 transition-transform active:scale-90"
              title="View Gallery"
            >
              <Camera size={18} />
            </button>
          )}
        </div>

        {/* Image Container */}
        <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => gallery.length > 0 && setIsGalleryOpen(true)}>
          <img
            src={image}
            alt={businessName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent opacity-60" />
          
          {/* Bottom Left Info Over Image */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-gold-label text-gold-label" />
              <span className="text-sm font-bold">{rating || "NEW"}</span>
              <span className="text-[10px] opacity-60 font-medium">({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <MapPin size={10} /> {suburb}
            </div>
          </div>
          
          {gallery.length > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal/40 backdrop-blur-sm p-4 rounded-full pointer-events-none">
              <Camera size={24} className="text-white" />
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-rosegold mb-2 bg-rosegold/5 inline-block px-3 py-1 rounded-md">
                {business.primary_category || business.primaryCategory}
              </div>
              <h3 className="text-2xl font-display text-charcoal leading-none italic">
                {businessName}
              </h3>
            </div>
            {isVerified && (
              <div className="w-8 h-8 rounded-full bg-rosegold/10 text-rosegold flex items-center justify-center border border-rosegold/20" title="Verified Professional">
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream/40 p-4 rounded-3xl border border-blush/20">
              <p className="text-[8px] uppercase font-black tracking-widest text-charcoal/30 mb-1">Direct Line</p>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-charcoal/80">
                <Phone size={12} className="text-rosegold/40" />
                <span>{phone || "Private"}</span>
              </div>
            </div>
            <div className="bg-cream/40 p-4 rounded-3xl border border-blush/20">
              <p className="text-[8px] uppercase font-black tracking-widest text-charcoal/30 mb-1">Audit Score</p>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-charcoal/80">
                <TrendingUp size={12} className="text-rosegold/40" />
                <span>A+ Quality</span>
              </div>
            </div>
          </div>
          </div>

          <div className="flex gap-4">
            <>
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow py-5 rounded-2xl bg-rosegold text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-charcoal shadow-xl shadow-rosegold/20 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={14} className="fill-white" /> Book Now
                </a>
              ) : (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow py-5 rounded-2xl bg-charcoal text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-rosegold shadow-xl shadow-charcoal/5 transition-all"
                >
                  Website
                </a>
              )}
              
              {bookingUrl && website && (
                 <a
                   href={website}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-6 py-5 rounded-2xl bg-cream text-charcoal text-[10px] font-black uppercase tracking-widest text-center hover:bg-rosegold/10 border border-blush/20 transition-all flex items-center justify-center"
                   title="Visit Website"
                 >
                   <Globe size={14} />
                 </a>
              )}

              {business.gbpLink && (
                <a
                  href={business.gbpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-5 rounded-2xl bg-cream text-charcoal text-[10px] font-black uppercase tracking-widest text-center hover:bg-gold-label/20 border border-gold-label/10 transition-all flex items-center justify-center gap-2"
                  title="Google Business Profile"
                >
                  <MapPin size={12} className="text-gold-label" />
                  Google
                </a>
              )}
            </>

            {!isVerified && (
              <button
                onClick={() => onClaim?.(business)}
                className="px-6 py-5 rounded-2xl border border-rosegold/30 text-rosegold text-[10px] font-black uppercase tracking-widest hover:bg-rosegold hover:text-white transition-all shadow-md flex items-center gap-2"
              >
                <Zap size={10} /> Claim
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGalleryOpen(false)}
              className="fixed inset-0 bg-charcoal/95 backdrop-blur-xl z-[100] cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-20 z-[110] flex flex-col items-center justify-center pointer-events-none"
            >
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rosegold transition-colors pointer-events-auto"
              >
                <X size={24} />
              </button>
              
              <div className="w-full h-full max-w-5xl overflow-y-auto scrollbar-hide py-10 pointer-events-auto">
                <div className="text-center mb-12">
                   <h2 className="text-3xl md:text-5xl font-display italic text-white mb-2">{businessName}</h2>
                   <p className="text-rosegold text-[10px] uppercase tracking-[0.4em] font-black">Boutique Portfolio</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {gallery.map((img, idx) => (
                     <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="aspect-[4/5] rounded-[32px] overflow-hidden border border-white/10 group"
                     >
                        <img 
                          src={img} 
                          alt={`${businessName} Gallery ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                     </motion.div>
                   ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
