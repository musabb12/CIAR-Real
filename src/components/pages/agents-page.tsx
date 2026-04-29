'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  Shield,
  Calendar,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  ImageIcon,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type { Agent, Property } from '@/types';

// ============================================================
// Animation variants
// ============================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

// ============================================================
// Types from API response
// ============================================================

interface AgentWithCounts extends Agent {
  _count?: {
    properties: number;
  };
}

interface AgentDetail extends Agent {
  _count?: {
    properties: number;
  };
  properties?: Property[];
}

// ============================================================
// Star Rating
// ============================================================

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/40'
          }
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ============================================================
// Skeleton Loader
// ============================================================

function AgentsSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="mt-4 h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Agent Detail Dialog
// ============================================================

function AgentDetailDialog({
  agent,
  open,
  onOpenChange,
}: {
  agent: AgentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  if (!agent) return null;

  const properties = agent.properties || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={agent.user?.avatar || undefined}
                alt={agent.user?.name || 'Agent'}
              />
              <AvatarFallback className="text-lg font-semibold">
                {(agent.user?.name || 'AG')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{agent.user?.name || 'Unknown Agent'}</span>
              {agent.verified && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"
                >
                  <Shield size={10} />
                  {t.agents.verified}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {agent.title || t.agents.ourAgents}
            {agent.company && ` ${t.common.or} ${agent.company.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-stat rounded-lg text-center p-3">
              <div className="text-lg font-bold">{agent.totalListings}</div>
              <div className="text-xs text-muted-foreground">{t.agents.listings}</div>
            </div>
            <div className="glass-stat rounded-lg text-center p-3">
              <div className="text-lg font-bold">{agent.totalSales}</div>
              <div className="text-xs text-muted-foreground">{t.agents.sales}</div>
            </div>
            <div className="glass-stat rounded-lg text-center p-3">
              <StarRating rating={agent.rating} size={12} />
              <div className="text-xs text-muted-foreground mt-1">{t.agents.rating}</div>
            </div>
            <div className="glass-stat rounded-lg text-center p-3">
              <div className="text-lg font-bold">{agent.experience || '-'}</div>
              <div className="text-xs text-muted-foreground">{t.agents.years}</div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          {agent.bio && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t.agents.bio}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {agent.bio}
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t.agents.contactInfo}</h4>
            <div className="space-y-2">
              {agent.user?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail size={14} />
                  <span>{agent.user.email}</span>
                </div>
              )}
              {(agent.phone || agent.user?.phone) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} />
                  <span>{agent.phone || agent.user?.phone}</span>
                </div>
              )}
              {agent.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} />
                  <span>WhatsApp: {agent.whatsapp}</span>
                </div>
              )}
              {agent.license && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield size={14} />
                  <span>License: {agent.license}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Details */}
          {agent.company && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">{t.agents.company}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building size={14} />
                    <span>{agent.company.name}</span>
                  </div>
                  {agent.company.description && (
                    <p className="text-sm text-muted-foreground">
                      {agent.company.description}
                    </p>
                  )}
                  {agent.company.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={14} />
                      <span>{agent.company.address}</span>
                    </div>
                  )}
                  {agent.company.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} />
                      <span>{agent.company.phone}</span>
                    </div>
                  )}
                  {agent.company.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} />
                      <span>{agent.company.email}</span>
                    </div>
                  )}
                  {agent.company.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe size={14} />
                      <span>{agent.company.website}</span>
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {agent.company.founded && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Founded {agent.company.founded}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {agent.company.agentCount} {t.agents.ourAgents}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building size={12} />
                      {agent.company.listingCount} {t.agents.listings}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Agent Properties */}
          {properties.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Recent Listings ({properties.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="glass-card rounded-lg flex gap-3 p-2 cursor-pointer"
                      onClick={() => {
                        onOpenChange(false);
                        const store = useAppStore.getState();
                        store.setSelectedPropertyId(prop.id);
                        store.setCurrentPage('property-detail');
                      }}
                    >
                      <img
                        src={
                          prop.images && prop.images.length > 0
                            ? prop.images[0].url
                            : 'https://placehold.co/100x80?text=No+Image'
                        }
                        alt={prop.title}
                        className="w-20 h-16 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{prop.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[prop.city?.name, prop.country?.name]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(prop.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main Component
// ============================================================

export function AgentsPage() {
  const { setSelectedPropertyId, setCurrentPage } = useAppStore();
  const { t } = useTranslation();

  const [agents, setAgents] = useState<AgentWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Agent detail dialog
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  // Filter agents by search
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.user?.name?.toLowerCase().includes(q) ||
      agent.title?.toLowerCase().includes(q) ||
      agent.company?.name?.toLowerCase().includes(q) ||
      agent.bio?.toLowerCase().includes(q)
    );
  });

  // Handle view profile
  const handleViewProfile = async (agentId: string) => {
    setLoadingDetail(true);
    setDialogOpen(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) throw new Error('Failed to fetch agent details');
      const data = await res.json();
      setSelectedAgent(data);
    } catch (err) {
      setSelectedAgent(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ============================================================
  // States
  // ============================================================

  if (loading) return <AgentsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="text-muted-foreground" size={28} />
          </div>
          <h2 className="text-xl font-semibold">{t.common.error}</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            {t.common.retry}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="p-4 md:p-6 max-w-6xl mx-auto space-y-6"
      >
        {/* Page Header Banner */}
        <motion.div
          variants={fadeInUp}
          className="relative -mx-4 -mt-4 overflow-hidden sm:-mx-6 md:-mx-6 sm:-mt-6 md:-mt-6"
          style={{
            backgroundImage: "url('https://picsum.photos/seed/ciar-agents-bg/1920/400.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative px-4 py-14 sm:px-6 sm:py-16">
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              {t.agents.ourAgents}
            </h1>
            <div className="mt-3 h-[3px] w-16 bg-gradient-to-r from-amber-500 to-amber-400" />
            <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              {agents.length} professional{' '}
              {agents.length === 1 ? 'agent' : 'agents'} ready to help
            </p>
            <div className="mt-5 relative w-full max-w-sm sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={t.search.title}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input rounded-xl bg-white/10 pl-9 pr-9 text-white placeholder:text-white/60 border-white/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="text-muted-foreground" size={28} />
            </div>
            <h3 className="text-lg font-semibold">
              {searchQuery ? t.agents.noAgents : t.agents.noAgents}
            </h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? `No agents match "${searchQuery}"`
                : 'Check back later for our agent directory.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAgents.map((agent) => {
              const listingCount = agent._count?.properties ?? agent.totalListings;
              const initials = (agent.user?.name || 'AG')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <motion.div key={agent.id} variants={fadeInUp}>
                  <Card className="glass-card rounded-xl h-full flex flex-col">
                    <CardContent className="pt-6 flex-1">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                          <AvatarImage
                            src={agent.user?.avatar || undefined}
                            alt={agent.user?.name || 'Agent'}
                          />
                          <AvatarFallback className="text-lg font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base truncate">
                              {agent.user?.name || 'Unknown Agent'}
                            </h3>
                            {agent.verified && (
                              <Shield
                                size={14}
                                className="text-emerald-500 flex-shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {agent.title || 'Real Estate Agent'}
                          </p>
                          {agent.company && (
                            <p className="text-xs text-muted-foreground truncate">
                              {agent.company.name}
                            </p>
                          )}
                          <div className="mt-1.5">
                            <StarRating rating={agent.rating} size={12} />
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {agent.experience
                            ? `${agent.experience} ${t.agents.years}`
                            : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building size={13} />
                          {listingCount} {t.agents.listings}
                        </span>
                      </div>

                      {agent.bio && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {agent.bio}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleViewProfile(agent.id)}
                      >
                        {t.agents.viewProfile}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Agent Detail Dialog */}
      <AgentDetailDialog
        agent={selectedAgent}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedAgent(null);
        }}
      />
    </>
  );
}
