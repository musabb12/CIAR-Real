'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="AI Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
