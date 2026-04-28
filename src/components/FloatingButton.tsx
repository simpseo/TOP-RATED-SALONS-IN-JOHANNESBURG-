/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, PlusCircle, X, Zap, MessageCircle } from "lucide-react";

interface FloatingButtonProps {
  onWebsiteClick: () => void;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
}

export default function FloatingButton({ onWebsiteClick, isZenMode, setIsZenMode }: FloatingButtonProps) {
  const [showWebsitePop, setShowWebsitePop] = React.useState(false);

  React.useEffect(() => {
    // Initial delay or immediate first pop
    const timer = setInterval(() => {
      setShowWebsitePop(true);
      // Disappear after 3 seconds
      setTimeout(() => setShowWebsitePop(false), 3000);
    }, 10000); // Pops every 10 seconds

    // Initial pop
    setShowWebsitePop(true);
    const initialHide = setTimeout(() => setShowWebsitePop(false), 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(initialHide);
    };
  }, []);

  return (
    <>
      {/* Support Chat Button - Extreme Bottom Right */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 right-4 z-[70] bg-white text-charcoal px-4 py-2 rounded-full shadow-lg border border-blush text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rosegold hover:text-white transition-all"
        onClick={() => {
           // This could open a support modal or similar
           alert("Support Chat coming soon! For urgent queries, please use the contact form.");
        }}
      >
        <MessageCircle size={14} className="text-rosegold" />
        Chat
      </motion.button>

      <div className="fixed bottom-16 right-8 z-[60] flex flex-col items-end gap-3">
        <AnimatePresence>
          {!isZenMode && showWebsitePop && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col items-end gap-3"
            >
              {/* Website Agency FAB */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onWebsiteClick}
                className="bg-charcoal text-white pl-6 pr-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 group border border-white/10 whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-rosegold/20 flex items-center justify-center text-rosegold shadow-lg group-hover:rotate-12 transition-transform">
                  <Globe size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] uppercase tracking-widest font-black opacity-50 leading-none mb-1">Scale Your Business</p>
                  <p className="text-xs font-display italic font-semibold leading-none">Get Pro Website</p>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsZenMode(!isZenMode)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl border ${
            !isZenMode 
              ? "bg-white text-charcoal border-blush" 
              : "bg-charcoal text-rosegold border-white/10"
          }`}
        >
          <motion.div
             animate={{ rotate: !isZenMode ? 0 : 180 }}
          >
            {!isZenMode ? <X size={20} /> : <Zap size={20} />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
