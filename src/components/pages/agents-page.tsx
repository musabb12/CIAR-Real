'use client';

import { useState, useEffect } from 'react';
import {
  Star, MapPin, Phone, MessageCircle, BadgeCheck, Briefcase,
  Award, TrendingUp, Users, Building2, Shield, Search, X,
  Bed, Bath, Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import type { Agent, Property } from '@/types';

// ─── Component ──────────────────────────────────────────────────
export function AgentsPage() {
  const { t } = useTranslation();
  const { setCurrentPage, setSelectedPropertyId } = useAppStore();

  const [agents, setAgents] = useState<(Agent & { _count?: { properties: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<(Agent & { _count?: { properties: number }; properties?: Property[] }) | null>(null);
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Fetch agents
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch agent properties when selected
  useEffect(() => {
    if (!selectedAgent || !loadingProperties) return;
    let cancelled = false;
    fetch(`/api/properties?agentId=${selectedAgent.id}&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAgentProperties(data.data ?? data.properties ?? data ?? []);
          setLoadingProperties(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingProperties(false);
      });
    return () => { cancelled = true; };
  }, [selectedAgent, loadingProperties]);

  // Filter agents by search
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.user?.name?.toLowerCase().includes(q) ||
      agent.title?.toLowerCase().includes(q) ||
      agent.company?.name?.toLowerCase().includes(q) ||
      agent.bio?.toLowerCase().includes(q)
    );
  });

  // Navigate to property detail
  const handlePropertyClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    setCurrentPage('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Rating stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
        <span className="ml-1.5 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* ─── Header Section ─── */}
      <section className="hero-gradient-mesh relative py-12 sm:py-16 px-4">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {t.agents.ourAgents}
            </Badge>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              {t.agents.title}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.agents.ourAgents} — {t.search.featuredSubtitle}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="glass-card rounded-2xl p-2 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
              <input
                type="text"
                placeholder={`${t.admin.search} ${t.agents.title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm py-2 placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="glass-stat rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{agents.length}</div>
              <div className="text-[10px] text-muted-foreground">{t.agents.title}</div>
            </div>
            <div className="glass-stat rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{agents.filter((a) => a.verified).length}</div>
              <div className="text-[10px] text-muted-foreground">{t.agents.verified}</div>
            </div>
            <div className="glass-stat rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">
                {agents.reduce((sum, a) => sum + (a.totalListings || 0), 0)}
              </div>
              <div className="text-[10px] text-muted-foreground">{t.agents.listings}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ─── Selected Agent Detail Panel ─── */}
        {selectedAgent && (
          <div className="animate-fade-in-up glass-card rounded-2xl p-6 mb-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Agent Avatar */}
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                    {selectedAgent.user?.avatar ? (
                      <img src={selectedAgent.user.avatar} alt={selectedAgent.user.name || ''} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-primary/40" />
                    )}
                  </div>
                  {selectedAgent.verified && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <BadgeCheck className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {selectedAgent.user?.name || t.agents.title}
                    {selectedAgent.verified && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0.5">
                        <Shield className="h-3 w-3 mr-1" />
                        {t.agents.verified}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">{selectedAgent.title || 'Real Estate Agent'}</p>
                  {selectedAgent.company && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="h-3 w-3" />
                      {selectedAgent.company.name}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedAgent(null); setAgentProperties([]); }}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Bio */}
            {selectedAgent.bio && (
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{selectedAgent.bio}</p>
            )}

            {/* Agent Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="glass-card rounded-xl p-3 text-center">
                <Star className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <div className="text-sm font-bold">{selectedAgent.rating.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">{t.agents.rating}</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <Building2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <div className="text-sm font-bold">{selectedAgent.totalListings || 0}</div>
                <div className="text-[10px] text-muted-foreground">{t.agents.listings}</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                <div className="text-sm font-bold">{selectedAgent.totalSales || 0}</div>
                <div className="text-[10px] text-muted-foreground">{t.agents.sales}</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <Award className="h-4 w-4 text-gold-light mx-auto mb-1" />
                <div className="text-sm font-bold">{selectedAgent.experience || 0}+</div>
                <div className="text-[10px] text-muted-foreground">{t.agents.experience}</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-3 mb-6">
              {selectedAgent.user?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary/60" />
                  {selectedAgent.user.phone}
                </div>
              )}
              {selectedAgent.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  WhatsApp
                </div>
              )}
              {selectedAgent.license && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary/60" />
                  {t.agents.license}: {selectedAgent.license}
                </div>
              )}
            </div>

            {/* Agent Properties */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t.agents.properties}</h3>
              {loadingProperties ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : agentProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.property.noProperties}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agentProperties.slice(0, 6).map((property) => (
                    <AgentPropertyCard key={property.id} property={property} onClick={handlePropertyClick} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Agents Grid ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">{t.agents.noAgents}</h3>
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-3 rounded-xl">
                {t.search.resetFilters}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                rating={renderStars(agent.rating)}
                onSelect={() => {
                  setSelectedAgent(agent);
                  setLoadingProperties(true);
                  setAgentProperties([]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────
function AgentCard({
  agent,
  rating,
  onSelect,
}: {
  agent: Agent & { _count?: { properties: number } };
  rating: React.ReactNode;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className="glass-card rounded-2xl cursor-pointer overflow-hidden border-0 group hover-lift-glow"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        {/* Top: Avatar + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center overflow-hidden">
              {agent.user?.avatar ? (
                <img src={agent.user.avatar} alt={agent.user.name || ''} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-7 w-7 text-primary/40" />
              )}
            </div>
            {agent.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-primary flex items-center justify-center shadow-md">
                <BadgeCheck className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
              {agent.user?.name || 'Agent'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{agent.title || 'Real Estate Agent'}</p>
            {agent.company && (
              <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <Briefcase className="h-3 w-3" />
                <span className="truncate">{agent.company.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-3">{rating}</div>

        {/* Stats Row */}
        <div className="gradient-divider mb-3" />
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-sm font-bold">{agent.totalListings || agent._count?.properties || 0}</div>
            <div className="text-[10px] text-muted-foreground">{t.agents.listings}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold">{agent.totalSales || 0}</div>
            <div className="text-[10px] text-muted-foreground">{t.agents.sales}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold">{agent.experience || 0}+</div>
            <div className="text-[10px] text-muted-foreground">{t.agents.years}</div>
          </div>
        </div>

        {/* Bio preview */}
        {agent.bio && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.bio}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Agent Property Mini Card ────────────────────────────────────
function AgentPropertyCard({
  property,
  onClick,
}: {
  property: Property;
  onClick: (property: Property) => void;
}) {
  const { t } = useTranslation();
  const coverUrl = property.images?.[0]?.url;

  return (
    <Card
      className="glass-card rounded-xl cursor-pointer overflow-hidden border-0 group hover-lift-glow"
      onClick={() => onClick(property)}
    >
      <div className="relative h-32 w-full overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 right-2 glass-badge rounded-lg px-2 py-1">
          <span className="text-xs font-bold text-white">
            ${property.price.toLocaleString()}
          </span>
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="text-xs font-bold truncate mb-1">{property.title}</h4>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[property.city?.name, property.country?.name].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          {property.bedrooms && (
            <span className="flex items-center gap-0.5">
              <Bed className="h-3 w-3" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3" /> {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Maximize className="h-3 w-3" /> {property.area} {t.property.sqm}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
