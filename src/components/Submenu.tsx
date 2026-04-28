/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Filter, Sparkles } from "lucide-react";

interface SubmenuProps {
  suburbFilter: string;
  setSuburbFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  uniqueSuburbs: string[];
  uniqueCategories: string[];
}

export default function Submenu({ 
  suburbFilter, 
  setSuburbFilter, 
  categoryFilter, 
  setCategoryFilter, 
  uniqueSuburbs, 
  uniqueCategories 
}: SubmenuProps) {
  return (
    <div className="flex gap-4 mb-12">
      <div className="relative group flex-1 md:flex-none">
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rosegold" />
        <select 
          className="w-full appearance-none bg-white pl-10 pr-10 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all text-xs font-semibold uppercase tracking-wider text-charcoal/60"
          value={suburbFilter}
          onChange={(e) => setSuburbFilter(e.target.value)}
        >
          {uniqueSuburbs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="relative group flex-1 md:flex-none">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rosegold" />
        <select 
          className="w-full appearance-none bg-white pl-10 pr-10 py-5 rounded-2xl shadow-sm border border-blush/40 focus:ring-2 focus:ring-rosegold/20 focus:border-rosegold outline-none transition-all text-xs font-semibold uppercase tracking-wider text-charcoal/60"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
