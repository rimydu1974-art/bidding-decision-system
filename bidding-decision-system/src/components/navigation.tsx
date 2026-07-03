'use client';

import React from 'react';
import { Menu } from 'lucide-react';

export function Navigation() {
  return (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <button className="p-2 rounded-xl bg-[#1e1e2e] border border-[#2e2e42] text-[#e2e8f0]">
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}
