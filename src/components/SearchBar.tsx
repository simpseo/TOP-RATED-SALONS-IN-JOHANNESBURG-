/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isUIHidden?: boolean;
}

export default function SearchBar({ searchTerm, setSearchTerm, isUIHidden }: SearchBarProps) {
  return (
    <div className="sticky top-24 z-30 mb-8 flex flex-col md:flex-row gap-4 items-center">
      <div className="flex-grow relative w-full">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30" />
        <input 
          type="text"
          placeholder="Search by name, category, or keyword..."
          className="w-full bg-white pl-16 pr-6 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all placeholder:text-charcoal/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
}
