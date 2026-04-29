'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Check, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SocialShareProps {
  propertyTitle?: string;
  propertyUrl?: string;
}

export function SocialShare({ propertyTitle, propertyUrl }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const url = propertyUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const title = propertyTitle || 'Check out this property!';

  const shareLinks = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500 hover:bg-sky-600', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600', url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-xl z-50"
          >
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors ${link.color}`}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </a>
            ))}
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
