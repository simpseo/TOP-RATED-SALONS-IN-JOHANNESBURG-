/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { CheckCircle2, MapPin, Phone, Star } from "lucide-react";
import type { BeautyBusiness } from "../data";

interface BusinessCardProps {
  business: BeautyBusiness;
  onClaim?: (business: BeautyBusiness) => void;
}

export function BusinessCard({ business, onClaim }: BusinessCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-blush/50"
      id={`card-${business.slug}`}
    >
      {/* Ranking Badge if Elite */}
      {business.rank_tier === "Tier 1" && (
        <div className="absolute top-4 left-4 z-10 bg-gold-label text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-lg">
          Elite Tier
        </div>
      )}

      {/* Arched Image Container */}
      <div className="relative overflow-hidden p-4">
        <div className="arch-image-wrap rounded-t-full overflow-hidden aspect-[4/5]">
          <img
            src={business.featured_image}
            alt={business.business_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="p-6 pt-2">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl text-charcoal leading-tight pr-2">
            {business.business_name}
          </h3>
          {business.verified_status && (
            <CheckCircle2 className="w-5 h-5 text-rosegold shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 mb-4">
          <Star className="w-4 h-4 fill-gold-label text-gold-label" />
          <span className="text-sm font-semibold">{business.google_rating}</span>
          <span className="text-xs text-charcoal/40 font-medium">({business.review_count} Reviews)</span>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-charcoal/60">
            <MapPin className="w-3 h-3" />
            <span>{business.suburb}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-charcoal/60">
            <Phone className="w-3 h-3" />
            <span>{business.phone}</span>
          </div>
          <div className="bg-blush/30 px-3 py-1 rounded-full inline-block text-[10px] font-semibold text-rosegold uppercase tracking-wider">
            {business.primary_category}
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-2xl bg-charcoal text-white text-xs font-semibold hover:bg-rosegold transition-colors duration-300"
          >
            Visit Website
          </a>
          {!business.verified_status && (
            <button
              onClick={() => onClaim?.(business)}
              className="flex-1 text-center py-3 rounded-2xl border border-rosegold text-rosegold text-xs font-semibold hover:bg-rosegold hover:text-white transition-all duration-300"
            >
              Claim Listing
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
