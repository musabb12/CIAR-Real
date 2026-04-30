'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Brain, Eye, DollarSign, MapPin, Footprints, TrendingUp, Bell, Star,
  Layout, Flame, GraduationCap, Car, Leaf, Wifi, Volume2, PawPrint, Wine,
  Sun, Hammer, PiggyBank, Heart, AlertTriangle, Accessibility, Users,
  ShoppingBag, Home, Clock, BarChart3, Zap, Gamepad2, Trophy, Target, Square,
  ChevronRight, Check, Plus, Shield, TreePine, Mountain, Waves, Building2,
  Sparkles, ArrowUpRight, ArrowDownRight, Minus, Circle, Thermometer,
  Droplets, Wind, MountainSnow, Lightbulb, Award, Compass, Route, Moon,
  Stethoscope, School, Store, ParkingCircle, Bike, Bus, Fuel, Snowflake, Fish,
  Umbrella, Flower2, Bed, Bath, Maximize, CalendarDays, Percent,
  ShieldCheck, Scale, Gauge, Radio, Monitor, DoorOpen, Lock, Camera,
  Speaker, Package, MapPinned, Navigation, Timer, Truck, Coffee,
  UtensilsCrossed, Music, Theater, PartyPopper, Pill, Siren, Baby,
  BabyCarriage, SmilePlus, ThumbsUp, ThumbsDown, MessageSquare, Tag,
  Send, ChevronDown, AlertCircle, Info, FlameKindling, SnowflakeIcon,
  SunDim, Leaf as LeafIcon, CircleDot, CircleCheck, CircleX, Plane, Train,
} from 'lucide-react';

// ─── Shared Types ───────────────────────────────────────────────────────────

export interface PropertyData {
  price: number;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  city?: { name: string };
  country?: { name: string };
}

interface FeatureProps {
  property: PropertyData;
}

// ─── Shared Utilities ───────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
const fmtPrice = (n: number) => `$${fmt(n)}`;
const fmtArea = (n: number) => `${fmt(n)} sqft`;

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Number((value * ease).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, decimals]);
  return <span>{prefix}{fmt(display)}{suffix}</span>;
}

function CircularProgress({ value, max = 100, size = 80, strokeWidth = 6, color = 'from-emerald-500 to-teal-400' }: {
  value: number; max?: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`transition-all duration-1000 bg-gradient-to-r ${color}`} style={{ stroke: 'url(#grad-' + color.replace(/\s/g, '') + ')' }} />
        <defs>
          <linearGradient id={`grad-${color.replace(/\s/g, '')}`}>
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">{value}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-emerald-500">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-card/80 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}

// ─── 1. AI Property Valuation ───────────────────────────────────────────────

export function AIPropertyValuation({ property }: FeatureProps) {
  const estValue = Math.round(property.price * 1.03);
  const confidence = 94;
  const lowEst = Math.round(estValue * 0.92);
  const highEst = Math.round(estValue * 1.08);
  const pricePerSqft = Math.round(property.price / property.area);

  const bars = useMemo(() => [
    { label: 'Area Avg', value: Math.round(pricePerSqft * 0.95), pct: 85 },
    { label: 'City Avg', value: Math.round(pricePerSqft * 1.05), pct: 92 },
    { label: 'This Property', value: pricePerSqft, pct: 97 },
    { label: 'Luxury Avg', value: Math.round(pricePerSqft * 1.15), pct: 100 },
  ], [pricePerSqft]);

  return (
    <GlassCard>
      <SectionTitle icon={Brain} title="AI Property Valuation" />
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium">AI Powered</span>
        <span className="text-xs text-muted-foreground">Updated 2h ago</span>
      </div>
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
          <AnimatedNumber value={estValue} prefix="$" />
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Confidence: <span className="text-emerald-500 font-semibold">{confidence}%</span>
        </p>
      </div>
      <div className="flex items-center justify-between text-xs bg-muted/20 rounded-xl p-3 mb-4">
        <div className="text-center">
          <p className="text-muted-foreground">Low</p>
          <p className="font-semibold">{fmtPrice(lowEst)}</p>
        </div>
        <div className="flex-1 mx-3 h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: '100%' }} />
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">High</p>
          <p className="font-semibold">{fmtPrice(highEst)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24">{b.label}</span>
            <div className="flex-1 h-3 rounded-full bg-muted/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${b.label === 'This Property' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-muted-foreground/30'}`} style={{ width: `${b.pct}%` }} />
            </div>
            <span className="text-xs font-medium w-20 text-right">${fmt(b.value)}/ft²</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 2. Virtual Tour Viewer ─────────────────────────────────────────────────

export function VirtualTourViewer({ property }: FeatureProps) {
  const [activeRoom, setActiveRoom] = useState(0);
  const rooms = ['Living Room', 'Master Bedroom', 'Kitchen', 'Bathroom', 'Balcony'];
  const hotspots = [
    { top: '30%', left: '45%', label: 'Fireplace' },
    { top: '55%', left: '70%', label: 'Bay Window' },
    { top: '40%', left: '25%', label: 'Hardwood Floor' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Eye} title="Virtual Tour Viewer" />
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900/40 to-teal-900/30 aspect-video mb-4">
        {/* Rotating gradient sphere */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-500/20 to-amber-400/10 animate-pulse blur-xl" />
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-300/20 to-teal-400/10 animate-[spin_8s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(16,185,129,0.3), transparent, rgba(20,184,166,0.3), transparent)' }} />
        </div>
        {/* Room label */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
          {rooms[activeRoom]}
        </div>
        {/* Hotspots */}
        {hotspots.map((h, i) => (
          <div key={i} className="absolute group" style={{ top: h.top, left: h.left }}>
            <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {h.label}
            </div>
          </div>
        ))}
        {/* 360° badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold flex items-center gap-1">
          <Eye className="w-3 h-3" /> 360°>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {rooms.map((r, i) => (
          <button key={i} onClick={() => setActiveRoom(i)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeRoom === i ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
            {r}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 3. Investment ROI Calculator ───────────────────────────────────────────

export function InvestmentROICalculator({ property }: FeatureProps) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const loanAmt = property.price * (1 - down / 100);
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const monthly = monthlyRate > 0 ? loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : loanAmt / n;
  const totalPaid = monthly * n;
  const interest = totalPaid - loanAmt;
  const roi = Math.round(((property.price * 1.25 - totalPaid) / totalPaid) * 100);
  const cashFlow = Math.round((property.price * 0.005) - monthly);

  const projections = useMemo(() => {
    const data: { year: number; value: number }[] = [];
    for (let i = 0; i <= 5; i++) {
      data.push({ year: i, value: Math.round(property.price * Math.pow(1.04, i)) });
    }
    return data;
  }, [property.price]);

  const maxProj = Math.max(...projections.map(p => p.value));

  return (
    <GlassCard>
      <SectionTitle icon={DollarSign} title="Investment ROI Calculator" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground">Down Payment</label>
          <div className="mt-1 flex items-center bg-muted/20 rounded-lg px-2 py-1.5">
            <input type="number" value={down} onChange={(e) => setDown(Number(e.target.value))} className="w-full bg-transparent text-sm font-medium outline-none" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Interest Rate</label>
          <div className="mt-1 flex items-center bg-muted/20 rounded-lg px-2 py-1.5">
            <input type="number" value={rate} step={0.1} onChange={(e) => setRate(Number(e.target.value))} className="w-full bg-transparent text-sm font-medium outline-none" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Loan Term</label>
          <div className="mt-1 flex items-center bg-muted/20 rounded-lg px-2 py-1.5">
            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full bg-transparent text-sm font-medium outline-none" />
            <span className="text-xs text-muted-foreground">yr</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-400/5 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Monthly Payment</p>
          <p className="text-lg font-bold text-emerald-500">{fmtPrice(Math.round(monthly))}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-400/5 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Total ROI (5yr)</p>
          <p className={`text-lg font-bold ${roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{roi}%</p>
        </div>
      </div>
      <div className="bg-muted/20 rounded-xl p-3 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Cash Flow Projection</p>
        <div className="flex items-end gap-1 h-16">
          {projections.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{fmtPrice(Math.round(p.value / 1000))}k</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-700" style={{ height: `${(p.value / maxProj) * 48}px` }} />
              <span className="text-[10px] text-muted-foreground">Y{i}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Total Interest: <span className="font-medium text-foreground">{fmtPrice(Math.round(interest))}</span></span>
        <span>Monthly Cash Flow: <span className={`font-medium ${cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPrice(cashFlow)}</span></span>
      </div>
    </GlassCard>
  );
}

// ─── 4. Neighborhood Insights ───────────────────────────────────────────────

export function NeighborhoodInsights({ property }: FeatureProps) {
  const scores = [
    { label: 'Safety', value: 92, icon: Shield },
    { label: 'Schools', value: 88, icon: School },
    { label: 'Dining', value: 95, icon: UtensilsCrossed },
    { label: 'Shopping', value: 90, icon: ShoppingBag },
    { label: 'Parks', value: 87, icon: TreePine },
    { label: 'Healthcare', value: 91, icon: Stethoscope },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={MapPin} title="Neighborhood Insights" />
      <p className="text-xs text-muted-foreground mb-4">
        {property.city?.name || 'Local Area'} — Comprehensive area analysis
      </p>
      <div className="grid grid-cols-2 gap-3">
        {scores.map((s) => (
          <div key={s.label} className="bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <s.icon className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <span className={`text-sm font-bold ${s.value >= 90 ? 'text-emerald-500' : s.value >= 80 ? 'text-teal-500' : 'text-amber-500'}`}>{s.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${s.value >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : s.value >= 80 ? 'bg-gradient-to-r from-teal-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <span className="text-xs text-muted-foreground">Overall Score: </span>
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">
          {Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length)}
        </span>
      </div>
    </GlassCard>
  );
}

// ─── 5. Walkability & Transit ───────────────────────────────────────────────

export function WalkabilityTransit({ property }: FeatureProps) {
  const scores = [
    { label: 'Walk Score', value: 85, icon: Footprints, color: 'from-emerald-500 to-teal-400' },
    { label: 'Transit Score', value: 78, icon: Bus, color: 'from-teal-500 to-cyan-400' },
    { label: 'Bike Score', value: 72, icon: Bike, color: 'from-amber-500 to-orange-400' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Footprints} title="Walkability & Transit" />
      <div className="flex items-center justify-around mb-4">
        {scores.map((s) => (
          <div key={s.label} className="text-center">
            <CircularProgress value={s.value} size={72} strokeWidth={5} />
            <div className="mt-1 flex items-center justify-center gap-1">
              <s.icon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs bg-emerald-500/5 rounded-lg p-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Very Walkable — Most errands can be accomplished on foot</span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-teal-500/5 rounded-lg p-2">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-muted-foreground">Excellent Transit — Many nearby public transportation options</span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-amber-500/5 rounded-lg p-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Bikeable — Some bike infrastructure</span>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── 6. Price Trend Chart ───────────────────────────────────────────────────

export function PriceTrendChart({ property }: FeatureProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = useMemo(() => {
    const base = property.price;
    return months.map((_, i) => {
      const variation = 0.92 + (i / 11) * 0.16 + Math.sin(i * 0.8) * 0.02;
      return { month: months[i], value: Math.round(base * variation) };
    });
  }, [property]);

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const change = ((data[11].value - data[0].value) / data[0].value * 100).toFixed(1);

  return (
    <GlassCard>
      <SectionTitle icon={TrendingUp} title="Price Trend (12 Months)" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="text-lg font-bold">{fmtPrice(data[11].value)}</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${Number(change) >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {Number(change) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}%
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const pct = ((d.value - minVal) / (maxVal - minVal)) * 60 + 20;
          const isLast = i === 11;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full rounded-t-md transition-all duration-700 ${isLast ? 'bg-gradient-to-t from-amber-500 to-orange-400' : 'bg-gradient-to-t from-emerald-600 to-teal-400'}`} style={{ height: `${pct}px` }} />
              <span className="text-[9px] text-muted-foreground">{d.month}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── 7. Smart Price Alerts ──────────────────────────────────────────────────

export function SmartPriceAlerts({ property }: FeatureProps) {
  const [threshold, setThreshold] = useState(String(Math.round(property.price * 0.95)));
  const [alertType, setAlertType] = useState<'drop' | 'rise'>('drop');
  const recentAlerts = [
    { type: 'drop', msg: 'Price dropped 3% — nearby listing', time: '2h ago' },
    { type: 'rise', msg: 'Market trending up in area +1.2%', time: '1d ago' },
    { type: 'drop', msg: 'Similar property listed below market', time: '3d ago' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Bell} title="Smart Price Alerts" />
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground">Price Threshold</label>
          <div className="mt-1 flex items-center bg-muted/20 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground mr-1">$</span>
            <input type="text" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full bg-transparent text-sm font-medium outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Alert Type</label>
          <div className="flex gap-2">
            <button onClick={() => setAlertType('drop')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${alertType === 'drop' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'}`}>
              <ArrowDownRight className="w-3 h-3" /> Price Drop>
            </button>
            <button onClick={() => setAlertType('rise')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${alertType === 'rise' ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-sm' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'}`}>
              <ArrowUpRight className="w-3 h-3" /> Price Rise>
            </button>
          </div>
        </div>
        <button className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-sm font-medium hover:shadow-md transition-shadow">
          Set Alert
        </button>
      </div>
      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2">Recent Alerts</p>
        <div className="space-y-2">
          {recentAlerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.type === 'drop' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div className="flex-1">
                <p className="text-foreground">{a.msg}</p>
                <p className="text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── 8. Property Reviews ────────────────────────────────────────────────────

export function PropertyReviews({ property }: FeatureProps) {
  const avgRating = 4.3;
  const totalReviews = 128;
  const breakdown = [
    { stars: 5, pct: 45 },
    { stars: 4, pct: 30 },
    { stars: 3, pct: 15 },
    { stars: 2, pct: 7 },
    { stars: 1, pct: 3 },
  ];
  const reviews = [
    { name: 'Sarah M.', initials: 'SM', rating: 5, text: 'Beautiful property in a fantastic location. The neighborhood is peaceful and amenities are close by.', time: '2 weeks ago' },
    { name: 'Ahmed K.', initials: 'AK', rating: 4, text: 'Great value for the area. Spacious rooms with lots of natural light.', time: '1 month ago' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Star} title="Property Reviews" />
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">{avgRating}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted/30'}`} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{totalReviews} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {breakdown.map(b => (
            <div key={b.stars} className="flex items-center gap-1.5 text-xs">
              <span className="w-3 text-muted-foreground">{b.stars}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="w-8 text-right text-muted-foreground">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 mb-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-muted/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold">{r.initials}</div>
              <div className="flex-1">
                <p className="text-xs font-medium">{r.name}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/30'}`} />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{r.time}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
      <button className="w-full py-2 rounded-lg border border-dashed border-emerald-500/30 text-emerald-500 text-xs font-medium hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-1">
        <MessageSquare className="w-3.5 h-3.5" /> Write Review>
      </button>
    </GlassCard>
  );
}

// ─── 9. Floor Plan Viewer ───────────────────────────────────────────────────

export function FloorPlanViewer({ property }: FeatureProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const rooms = [
    { id: 'living', label: 'Living Room', dims: '18×14 ft', gridArea: '1 / 1 / 2 / 3', color: 'from-emerald-500/20 to-teal-400/10', borderColor: 'border-emerald-500/40' },
    { id: 'kitchen', label: 'Kitchen', dims: '14×10 ft', gridArea: '1 / 3 / 2 / 4', color: 'from-amber-500/20 to-orange-400/10', borderColor: 'border-amber-500/40' },
    { id: 'master', label: 'Master Bed', dims: '16×14 ft', gridArea: '2 / 1 / 3 / 2', color: 'from-teal-500/20 to-cyan-400/10', borderColor: 'border-teal-500/40' },
    { id: 'bed2', label: 'Bedroom 2', dims: '12×11 ft', gridArea: '2 / 2 / 3 / 3', color: 'from-purple-500/20 to-pink-400/10', borderColor: 'border-purple-500/40' },
    { id: 'bath', label: 'Bathroom', dims: '8×6 ft', gridArea: '2 / 3 / 3 / 4', color: 'from-blue-500/20 to-indigo-400/10', borderColor: 'border-blue-500/40' },
    { id: 'balcony', label: 'Balcony', dims: '20×6 ft', gridArea: '3 / 1 / 4 / 4', color: 'from-lime-500/20 to-green-400/10', borderColor: 'border-lime-500/40' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Layout} title="Floor Plan" />
      <div className="rounded-xl border border-muted/30 p-3 mb-4">
        <div className="grid grid-cols-3 gap-1.5" style={{ minHeight: '180px' }}>
          {rooms.map((r) => (
            <button key={r.id} style={{ gridArea: r.gridArea }} onClick={() => setSelectedRoom(selectedRoom === r.id ? null : r.id)} className={`rounded-lg border bg-gradient-to-br ${r.color} ${r.borderColor} ${selectedRoom === r.id ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''} transition-all flex flex-col items-center justify-center p-2 hover:shadow-sm`}>
              <span className="text-[10px] font-medium">{r.label}</span>
              <span className="text-[9px] text-muted-foreground">{r.dims}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedRoom && (
        <div className="bg-muted/20 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <p className="text-xs font-medium">{rooms.find(r => r.id === selectedRoom)?.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Dimensions: {rooms.find(r => r.id === selectedRoom)?.dims}</p>
          <p className="text-xs text-muted-foreground">Total: {property.area} sqft · {property.bedrooms} beds · {property.bathrooms} baths</p>
        </div>
      )}
    </GlassCard>
  );
}

// ─── 10. Price Heatmap ──────────────────────────────────────────────────────

export function PriceHeatmap({ property }: FeatureProps) {
  const basePrice = property.price / property.area;
  const grid = useMemo(() => {
    const cells: { row: number; col: number; price: number }[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const factor = 0.7 + Math.random() * 0.6;
        cells.push({ row: r, col: c, price: Math.round(basePrice * factor) });
      }
    }
    return cells;
  }, [basePrice]);

  const minP = Math.min(...grid.map(g => g.price));
  const maxP = Math.max(...grid.map(g => g.price));
  const getColor = (val: number) => {
    const pct = (val - minP) / (maxP - minP);
    if (pct > 0.75) return 'from-amber-500 to-red-500';
    if (pct > 0.5) return 'from-emerald-600 to-amber-500';
    if (pct > 0.25) return 'from-teal-500 to-emerald-500';
    return 'from-emerald-300 to-teal-400';
  };

  return (
    <GlassCard>
      <SectionTitle icon={Flame} title="Price Heatmap" />
      <p className="text-xs text-muted-foreground mb-3">Price per sqft by neighborhood zone — {property.city?.name || 'Local Area'}</p>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {grid.map((c, i) => (
          <div key={i} className="aspect-square rounded-md bg-gradient-to-br flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style={{ background: `rgba(${c.price > maxP * 0.75 ? '234,88,12' : c.price > maxP * 0.5 ? '16,185,129' : '20,184,166'}, ${(c.price - minP) / (maxP - minP) * 0.7 + 0.3})` }}>
            <span className="text-[8px] font-medium text-white drop-shadow-sm">${Math.round(c.price)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>${fmt(minP)}/ft²</span>
        <div className="flex items-center gap-1">
          <div className="w-16 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgba(20,184,166,0.5), rgba(16,185,129,0.7), rgba(234,88,12,0.8))' }} />
        </div>
        <span>${fmt(maxP)}/ft²</span>
      </div>
    </GlassCard>
  );
}

// ─── 11. School District Ratings ────────────────────────────────────────────

export function SchoolDistrictRatings({ property }: FeatureProps) {
  const schools = [
    { name: 'Lincoln Elementary', rating: 'A+', type: 'Elementary', distance: '0.3 mi', color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Washington Middle', rating: 'A', type: 'Middle', distance: '0.8 mi', color: 'text-teal-500 bg-teal-500/10' },
    { name: 'Jefferson High', rating: 'B+', type: 'High', distance: '1.2 mi', color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Oakwood Academy', rating: 'A', type: 'Private', distance: '2.1 mi', color: 'text-emerald-500 bg-emerald-500/10' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={GraduationCap} title="School District Ratings" />
      <div className="space-y-2.5">
        {schools.map((s, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${s.color}`}>{s.rating}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded-full bg-muted/50">{s.type}</span>
                <span>{s.distance}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 12. Commute Calculator ─────────────────────────────────────────────────

export function CommuteCalculator({ property }: FeatureProps) {
  const destinations = [
    { name: 'Downtown', icon: Building2, time: '15 min', distance: '4.2 mi', method: 'car' },
    { name: 'Airport', icon: Plane, time: '35 min', distance: '18.5 mi', method: 'car' },
    { name: 'Shopping Mall', icon: ShoppingBag, time: '8 min', distance: '2.1 mi', method: 'walk' },
    { name: 'Hospital', icon: Stethoscope, time: '12 min', distance: '5.8 mi', method: 'car' },
    { name: 'Train Station', icon: Train, time: '6 min', distance: '0.8 mi', method: 'walk' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Car} title="Commute Calculator" />
      <p className="text-xs text-muted-foreground mb-4">Estimated travel times from {property.city?.name || 'property'}</p>
      <div className="space-y-2">
        {destinations.map((d, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-400/10 flex items-center justify-center">
              <d.icon className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">{d.distance} · by {d.method}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-500">{d.time}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 13. Carbon Footprint Rating ────────────────────────────────────────────

export function CarbonFootprintRating({ property }: FeatureProps) {
  const ecoScore = 'A+';
  const co2 = 3.2;
  const efficiency = 87;
  const tips = ['Solar panels reduce emissions by 40%', 'Smart thermostat saves $200/yr', 'LED lighting cuts energy 75%'];

  return (
    <GlassCard>
      <SectionTitle icon={Leaf} title="Carbon Footprint Rating" />
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
          {ecoScore}
        </div>
        <div>
          <p className="text-sm font-medium">Excellent Eco Rating</p>
          <p className="text-xs text-muted-foreground">Top 10% of properties</p>
          <p className="text-xs text-muted-foreground mt-1">CO₂ Emissions: <span className="font-semibold text-emerald-500">{co2} tons/yr</span></p>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Energy Efficiency</span>
          <span className="font-semibold text-emerald-500">{efficiency}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${efficiency}%` }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium">Green Tips</p>
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{t}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 14. Smart Home Compatibility ───────────────────────────────────────────

export function SmartHomeCompatibility({ property }: FeatureProps) {
  const features = [
    { name: 'Smart Thermostat', icon: Thermometer, compatible: true },
    { name: 'Smart Locks', icon: Lock, compatible: true },
    { name: 'Smart Lights', icon: Lightbulb, compatible: true },
    { name: 'Security Camera', icon: Camera, compatible: false },
    { name: 'Smart Speaker', icon: Speaker, compatible: false },
    { name: 'Smart Blinds', icon: Monitor, compatible: true },
  ];

  const compatCount = features.filter(f => f.compatible).length;

  return (
    <GlassCard>
      <SectionTitle icon={Wifi} title="Smart Home Compatibility" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Compatible</p>
          <p className="text-xl font-bold text-emerald-500">{compatCount}/{features.length}</p>
        </div>
        <div className="h-3 w-32 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${(compatCount / features.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${f.compatible ? 'bg-emerald-500/5' : 'bg-muted/20'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.compatible ? 'bg-emerald-500/10' : 'bg-muted/30'}`}>
              <f.icon className={`w-4 h-4 ${f.compatible ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            </div>
            <span className="text-sm flex-1">{f.name}</span>
            {f.compatible ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center"><Plus className="w-3 h-3 text-muted-foreground" /></div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 15. Noise Level Assessment ─────────────────────────────────────────────

export function NoiseLevelAssessment({ property }: FeatureProps) {
  const sources = [
    { name: 'Traffic', dayDb: 55, nightDb: 35, icon: Car },
    { name: 'Airport', dayDb: 20, nightDb: 15, icon: Plane },
    { name: 'Construction', dayDb: 45, nightDb: 5, icon: Hammer },
  ];
  const overallDay = 48;
  const overallNight = 32;

  const getDbColor = (db: number) => {
    if (db < 30) return 'bg-emerald-500';
    if (db < 50) return 'bg-teal-500';
    if (db < 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <GlassCard>
      <SectionTitle icon={Volume2} title="Noise Level Assessment" />
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Quiet Zone</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="bg-amber-500/5 rounded-xl p-2.5 text-center">
            <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Day</p>
            <p className="text-lg font-bold">{overallDay} dB</p>
          </div>
          <div className="bg-indigo-500/5 rounded-xl p-2.5 text-center">
            <Moon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Night</p>
            <p className="text-lg font-bold">{overallNight} dB</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {sources.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-6">Day</span>
              <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                <div className={`h-full rounded-full ${getDbColor(s.dayDb)} transition-all duration-700`} style={{ width: `${s.dayDb}%` }} />
              </div>
              <span className="text-[10px] w-8 text-right">{s.dayDb} dB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-6">Night</span>
              <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                <div className={`h-full rounded-full ${getDbColor(s.nightDb)} transition-all duration-700`} style={{ width: `${s.nightDb}%` }} />
              </div>
              <span className="text-[10px] w-8 text-right">{s.nightDb} dB</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 16. Pet Friendliness Score ─────────────────────────────────────────────

export function PetFriendlinessScore({ property }: FeatureProps) {
  const score = 82;
  const vets = [
    { name: 'Happy Paws Vet', distance: '0.5 mi', rating: 4.8 },
    { name: 'City Pet Clinic', distance: '1.2 mi', rating: 4.5 },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={PawPrint} title="Pet Friendliness Score" />
      <div className="flex items-center gap-4 mb-4">
        <CircularProgress value={score} size={80} strokeWidth={6} />
        <div>
          <p className="text-sm font-medium">Very Pet Friendly</p>
          <p className="text-xs text-muted-foreground">Top 25% in {property.city?.name || 'area'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/20 rounded-xl p-2.5 text-center">
          <TreePine className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Pet Park</p>
          <p className="text-sm font-bold">0.3 mi</p>
        </div>
        <div className="bg-muted/20 rounded-xl p-2.5 text-center">
          <Store className="w-4 h-4 text-teal-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Pet Store</p>
          <p className="text-sm font-bold">0.8 mi</p>
        </div>
      </div>
      <p className="text-xs font-medium mb-2">Nearby Vets</p>
      <div className="space-y-2">
        {vets.map((v, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-muted/20 rounded-lg p-2">
            <div>
              <p className="font-medium">{v.name}</p>
              <p className="text-muted-foreground">{v.distance}</p>
            </div>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <span className="font-medium">{v.rating}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs bg-amber-500/5 rounded-lg p-2">
        <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-muted-foreground">No breed restrictions. Max 2 pets allowed.</span>
      </div>
    </GlassCard>
  );
}

// ─── 17. Nightlife Proximity ────────────────────────────────────────────────

export function NightlifeProximity({ property }: FeatureProps) {
  const venues = [
    { name: 'The Velvet Lounge', type: 'Bar', distance: '0.4 mi', rating: 4.7 },
    { name: 'Neon Nights', type: 'Club', distance: '1.1 mi', rating: 4.3 },
    { name: 'La Maison', type: 'Restaurant', distance: '0.6 mi', rating: 4.8 },
    { name: 'Grand Theater', type: 'Theater', distance: '0.9 mi', rating: 4.6 },
    { name: 'Jazz Corner', type: 'Bar', distance: '0.3 mi', rating: 4.5 },
  ];

  const typeColors: Record<string, string> = {
    Bar: 'bg-emerald-500/10 text-emerald-500',
    Club: 'bg-purple-500/10 text-purple-500',
    Restaurant: 'bg-amber-500/10 text-amber-500',
    Theater: 'bg-teal-500/10 text-teal-500',
  };

  const typeIcons: Record<string, React.ElementType> = {
    Bar: Wine,
    Club: PartyPopper,
    Restaurant: UtensilsCrossed,
    Theater: Theater,
  };

  return (
    <GlassCard>
      <SectionTitle icon={Wine} title="Nightlife Proximity" />
      <p className="text-xs text-muted-foreground mb-3">{venues.length} venues within 1.5 miles</p>
      <div className="space-y-2">
        {venues.map((v, i) => {
          const Icon = typeIcons[v.type] || Wine;
          return (
            <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-xl p-2.5 hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[v.type] || 'bg-muted/50'}`}>{v.type}</span>
                  <span className="text-[10px] text-muted-foreground">{v.distance}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{v.rating}</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── 18. Seasonal Pricing ───────────────────────────────────────────────────

export function SeasonalPricing({ property }: FeatureProps) {
  const seasons = [
    { name: 'Spring', icon: Flower2, months: 'Mar–May', priceFactor: 1.0, change: 0, gradient: 'from-emerald-500 to-green-400' },
    { name: 'Summer', icon: Sun, months: 'Jun–Aug', priceFactor: 1.08, change: 8, gradient: 'from-amber-500 to-orange-400' },
    { name: 'Fall', icon: LeafIcon, months: 'Sep–Nov', priceFactor: 0.96, change: -4, gradient: 'from-orange-500 to-red-400' },
    { name: 'Winter', icon: Snowflake, months: 'Dec–Feb', priceFactor: 0.92, change: -8, gradient: 'from-teal-500 to-cyan-400' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={CalendarDays} title="Seasonal Pricing" />
      <div className="grid grid-cols-2 gap-3">
        {seasons.map((s) => {
          const avgPrice = Math.round(property.price * s.priceFactor);
          return (
            <div key={s.name} className="bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.months}</p>
                </div>
              </div>
              <p className="text-base font-bold">{fmtPrice(avgPrice)}</p>
              <div className={`flex items-center gap-0.5 text-xs mt-0.5 ${s.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {s.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.change > 0 ? '+' : ''}{s.change}%
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── 19. Renovation Estimator ───────────────────────────────────────────────

export function RenovationEstimator({ property }: FeatureProps) {
  const categories = [
    { name: 'Kitchen', costLow: 15000, costHigh: 45000, priority: 'High', icon: UtensilsCrossed },
    { name: 'Bathroom', costLow: 8000, costHigh: 25000, priority: 'Medium', icon: Bath },
    { name: 'Flooring', costLow: 5000, costHigh: 15000, priority: 'Low', icon: Square },
    { name: 'Paint', costLow: 2000, costHigh: 6000, priority: 'Low', icon: Droplets },
    { name: 'Landscaping', costLow: 3000, costHigh: 12000, priority: 'Medium', icon: TreePine },
  ];

  const totalLow = categories.reduce((a, b) => a + b.costLow, 0);
  const totalHigh = categories.reduce((a, b) => a + b.costHigh, 0);

  const priorityColor: Record<string, string> = {
    High: 'bg-red-500/10 text-red-500',
    Medium: 'bg-amber-500/10 text-amber-500',
    Low: 'bg-emerald-500/10 text-emerald-500',
  };

  return (
    <GlassCard>
      <SectionTitle icon={Hammer} title="Renovation Estimator" />
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-xl p-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated Total</p>
          <p className="text-lg font-bold">{fmtPrice(totalLow)} – {fmtPrice(totalHigh)}</p>
        </div>
        <DollarSign className="w-8 h-8 text-emerald-500/50" />
      </div>
      <div className="space-y-2">
        {categories.map((c, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-xl p-2.5 hover:bg-muted/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
              <c.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColor[c.priority]}`}>{c.priority}</span>
              </div>
              <p className="text-xs text-muted-foreground">{fmtPrice(c.costLow)} – {fmtPrice(c.costHigh)}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 20. Rental Yield Calculator ────────────────────────────────────────────

export function RentalYieldCalculator({ property }: FeatureProps) {
  const [annualIncome, setAnnualIncome] = useState(Math.round(property.price * 0.06));
  const expenses = [
    { name: 'Property Tax', amount: Math.round(property.price * 0.012) },
    { name: 'Insurance', amount: Math.round(property.price * 0.004) },
    { name: 'Maintenance', amount: Math.round(property.price * 0.005) },
    { name: 'Management', amount: Math.round(annualIncome * 0.08) },
  ];
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const netIncome = annualIncome - totalExpenses;
  const netYield = ((netIncome / property.price) * 100).toFixed(1);
  const capRate = ((netIncome / property.price) * 100).toFixed(1);
  const cashOnCash = (((netIncome - property.price * 0.06 * 0.065) / (property.price * 0.2)) * 100).toFixed(1);

  return (
    <GlassCard>
      <SectionTitle icon={PiggyBank} title="Rental Yield Calculator" />
      <div className="mb-4">
        <label className="text-xs text-muted-foreground">Annual Rental Income</label>
        <div className="mt-1 flex items-center bg-muted/20 rounded-lg px-3 py-2">
          <span className="text-sm text-muted-foreground mr-1">$</span>
          <input type="text" value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value))} className="w-full bg-transparent text-sm font-medium outline-none" />
          <span className="text-xs text-muted-foreground">/yr</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-400/5 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">Net Yield</p>
          <p className="text-base font-bold text-emerald-500">{netYield}%</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-400/5 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">Cap Rate</p>
          <p className="text-base font-bold text-amber-500">{capRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/10 to-cyan-400/5 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">CoC Return</p>
          <p className="text-base font-bold text-teal-500">{cashOnCash}%</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium">Annual Expenses</p>
        {expenses.map((e, i) => (
          <div key={i} className="flex items-center justify-between text-xs bg-muted/20 rounded-lg px-3 py-2">
            <span className="text-muted-foreground">{e.name}</span>
            <span className="font-medium">{fmtPrice(e.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs border-t pt-2 mt-1">
          <span className="font-medium">Net Income</span>
          <span className={`font-bold ${netIncome >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPrice(netIncome)}</span>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── 21. Lifestyle Match ────────────────────────────────────────────────────

export function LifestyleMatch({ property }: FeatureProps) {
  const lifestyles = [
    { name: 'Urban Explorer', icon: Building2, match: 88, desc: 'High walkability, dining & entertainment' },
    { name: 'Suburban Family', icon: Home, match: 75, desc: 'Spacious, near schools & parks' },
    { name: 'Beach Lover', icon: Waves, match: 42, desc: 'Coastal proximity & outdoor living' },
    { name: 'Mountain Retreat', icon: Mountain, match: 35, desc: 'Nature, privacy & scenic views' },
  ];

  const getMatchColor = (match: number) => {
    if (match >= 80) return 'from-emerald-500 to-teal-400';
    if (match >= 60) return 'from-teal-500 to-cyan-400';
    return 'from-amber-500 to-orange-400';
  };

  return (
    <GlassCard>
      <SectionTitle icon={Heart} title="Lifestyle Match" />
      <p className="text-xs text-muted-foreground mb-4">How well does this property match your lifestyle?</p>
      <div className="space-y-2.5">
        {lifestyles.map((l, i) => (
          <div key={i} className="bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getMatchColor(l.match)} flex items-center justify-center shadow-sm`}>
                <l.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{l.name}</p>
                  <span className={`text-sm font-bold bg-gradient-to-r ${getMatchColor(l.match)} bg-clip-text text-transparent`}>{l.match}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{l.desc}</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${getMatchColor(l.match)} transition-all duration-1000`} style={{ width: `${l.match}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 22. Disaster Risk Assessment ───────────────────────────────────────────

export function DisasterRiskAssessment({ property }: FeatureProps) {
  const risks = [
    { name: 'Earthquake', level: 'Low' as const, value: 15, icon: MountainSnow },
    { name: 'Flood', level: 'Medium' as const, value: 45, icon: Droplets },
    { name: 'Hurricane', level: 'Low' as const, value: 10, icon: Wind },
    { name: 'Wildfire', level: 'Low' as const, value: 8, icon: Flame },
  ];

  const levelStyles: Record<string, { color: string; bg: string; bar: string }> = {
    Low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-gradient-to-r from-emerald-500 to-teal-400' },
    Medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-gradient-to-r from-amber-500 to-orange-400' },
    High: { color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-gradient-to-r from-red-500 to-rose-400' },
  };

  return (
    <GlassCard>
      <SectionTitle icon={AlertTriangle} title="Disaster Risk Assessment" />
      <div className="space-y-3">
        {risks.map((r, i) => {
          const style = levelStyles[r.level];
          return (
            <div key={i} className="bg-muted/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <r.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{r.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.color} ${style.bg}`}>{r.level}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div className={`h-full rounded-full ${style.bar} transition-all duration-1000`} style={{ width: `${r.value}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Risk factor: {r.value}/100</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs bg-emerald-500/5 rounded-lg p-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="text-muted-foreground">Overall risk: Low. Property is in a safe zone.</span>
      </div>
    </GlassCard>
  );
}

// ─── 23. Accessibility Score ────────────────────────────────────────────────

export function AccessibilityScore({ property }: FeatureProps) {
  const features = [
    { name: 'Wheelchair Access', icon: Accessibility, score: true },
    { name: 'Elevator', icon: ArrowUpRight, score: true },
    { name: 'Ramps', icon: Mountain, score: true },
    { name: 'Wide Doors', icon: DoorOpen, score: true },
    { name: 'Accessible Bath', icon: Bath, score: false },
    { name: 'Visual Alerts', icon: Lightbulb, score: true },
  ];
  const accessibleCount = features.filter(f => f.score).length;
  const totalScore = Math.round((accessibleCount / features.length) * 100);

  return (
    <GlassCard>
      <SectionTitle icon={Accessibility} title="Accessibility Score" />
      <div className="flex items-center gap-4 mb-4">
        <CircularProgress value={totalScore} size={80} strokeWidth={6} />
        <div>
          <p className="text-sm font-medium">Mostly Accessible</p>
          <p className="text-xs text-muted-foreground">{accessibleCount}/{features.length} features available</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {features.map((f, i) => (
          <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg ${f.score ? 'bg-emerald-500/5' : 'bg-muted/20'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${f.score ? 'bg-emerald-500/10' : 'bg-muted/30'}`}>
              <f.icon className={`w-3.5 h-3.5 ${f.score ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">{f.name}</p>
              <p className={`text-[10px] ${f.score ? 'text-emerald-500' : 'text-muted-foreground'}`}>{f.score ? 'Available' : 'Not available'}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 24. Family Friendliness ────────────────────────────────────────────────

export function FamilyFriendliness({ property }: FeatureProps) {
  const scores = [
    { name: 'Parks & Playgrounds', value: 92, icon: TreePine },
    { name: 'Schools Quality', value: 88, icon: GraduationCap },
    { name: 'Safety Rating', value: 91, icon: Shield },
    { name: 'Healthcare', value: 85, icon: Stethoscope },
    { name: 'Family Community', value: 87, icon: Users },
  ];
  const overall = Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length);

  return (
    <GlassCard>
      <SectionTitle icon={Baby} title="Family Friendliness" />
      <div className="flex items-center gap-3 mb-4 bg-gradient-to-r from-emerald-500/10 to-teal-400/5 rounded-xl p-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
          {overall}
        </div>
        <div>
          <p className="text-sm font-medium">Great for Families</p>
          <p className="text-xs text-muted-foreground">Top 20% family-friendly areas</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {scores.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <s.icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{s.name}</span>
              </div>
              <span className="font-semibold text-emerald-500">{s.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${s.value >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-teal-500 to-cyan-400'}`} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 25. Grocery Delivery ───────────────────────────────────────────────────

export function GroceryDelivery({ property }: FeatureProps) {
  const stores = [
    { name: 'Fresh Mart', type: 'Supermarket', delivery: '30 min', minOrder: '$25', rating: 4.6, icon: ShoppingBag },
    { name: 'Organic Valley', type: 'Organic', delivery: '45 min', minOrder: '$35', rating: 4.8, icon: Leaf },
    { name: 'QuickGrocery', type: 'Express', delivery: '15 min', minOrder: '$10', rating: 4.3, icon: Truck },
    { name: 'SeaWorld Fish', type: 'Specialty', delivery: '60 min', minOrder: '$40', rating: 4.5, icon: Fish },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Truck} title="Grocery Delivery" />
      <p className="text-xs text-muted-foreground mb-3">{stores.length} stores delivering to your area</p>
      <div className="space-y-2">
        {stores.map((s, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-400/10 flex items-center justify-center">
              <s.icon className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded-full bg-muted/50">{s.type}</span>
                <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" />{s.delivery}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="text-xs font-medium">{s.rating}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Min: {s.minOrder}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 26. Similar Properties ─────────────────────────────────────────────────

export function SimilarProperties({ property }: FeatureProps) {
  const similar = [
    { price: Math.round(property.price * 0.95), location: '123 Oak Street', beds: property.bedrooms || 3, baths: property.bathrooms || 2, match: 94, area: Math.round(property.area * 0.95) },
    { price: Math.round(property.price * 1.05), location: '456 Maple Ave', beds: (property.bedrooms || 3) + 1, baths: property.bathrooms || 2, match: 87, area: Math.round(property.area * 1.1) },
    { price: Math.round(property.price * 0.98), location: '789 Cedar Lane', beds: property.bedrooms || 3, baths: (property.bathrooms || 2) + 1, match: 82, area: Math.round(property.area * 1.02) },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Home} title="Similar Properties" />
      <div className="space-y-3">
        {similar.map((s, i) => (
          <div key={i} className="bg-muted/20 rounded-xl p-3 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">{fmtPrice(s.price)}</p>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.match >= 90 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Target className="w-2.5 h-2.5" /> {s.match}% match>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {s.location}>
            </p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" /> {s.beds} beds</span>
              <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" /> {s.baths} baths</span>
              <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" /> {fmtArea(s.area)}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 27. Property History Timeline ──────────────────────────────────────────

export function PropertyHistoryTimeline({ property }: FeatureProps) {
  const events = [
    { date: 'Dec 2024', title: 'Price Reduced', desc: `${fmtPrice(property.price)} — 3% below asking`, type: 'price' as const, icon: DollarSign },
    { date: 'Oct 2024', title: 'Listed for Sale', desc: `Originally listed at ${fmtPrice(Math.round(property.price * 1.03))}`, type: 'status' as const, icon: Tag },
    { date: 'Jul 2024', title: 'Renovation Done', desc: 'Kitchen and bathroom remodeled', type: 'milestone' as const, icon: Hammer },
    { date: 'Mar 2020', title: 'Last Sold', desc: `Purchased for ${fmtPrice(Math.round(property.price * 0.65))}`, type: 'price' as const, icon: DollarSign },
    { date: `${property.yearBuilt || 2015}`, title: 'Originally Built', desc: 'New construction completed', type: 'milestone' as const, icon: Building2 },
  ];

  const typeColors: Record<string, string> = {
    price: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    status: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    milestone: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
  };

  const dotColors: Record<string, string> = {
    price: 'bg-amber-500',
    status: 'bg-emerald-500',
    milestone: 'bg-teal-500',
  };

  return (
    <GlassCard>
      <SectionTitle icon={Clock} title="Property History" />
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 via-teal-500/30 to-transparent" />
        <div className="space-y-4">
          {events.map((e, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full ${dotColors[e.type]} border-2 border-card`} style={{ left: '-1.375rem' }} />
              <div className={`rounded-lg border p-2.5 ${typeColors[e.type]}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-medium">{e.title}</p>
                  <span className="text-[10px] opacity-60">{e.date}</span>
                </div>
                <p className="text-[10px] opacity-80">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── 28. Market Benchmark ───────────────────────────────────────────────────

export function MarketBenchmark({ property }: FeatureProps) {
  const pricePerSqm = Math.round(property.price / property.area);
  const benchmarks = [
    { label: 'Price/sqm', propertyVal: pricePerSqm, marketVal: Math.round(pricePerSqm * 0.95), unit: '$/ft²' },
    { label: 'Days on Market', propertyVal: 25, marketVal: 45, unit: 'days' },
    { label: 'Price Trend', propertyVal: 4.2, marketVal: 2.8, unit: '%/yr' },
    { label: 'Yield', propertyVal: 5.8, marketVal: 4.5, unit: '%' },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={BarChart3} title="Market Benchmark" />
      <p className="text-xs text-muted-foreground mb-4">Property vs {property.city?.name || 'Market'} Average</p>
      <div className="space-y-3">
        {benchmarks.map((b, i) => {
          const maxVal = Math.max(b.propertyVal, b.marketVal) * 1.2;
          const propPct = (b.propertyVal / maxVal) * 100;
          const mktPct = (b.marketVal / maxVal) * 100;
          const isBetter = b.label === 'Days on Market' ? b.propertyVal < b.marketVal : b.propertyVal > b.marketVal;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted-foreground">{b.unit}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12">Property</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                    <div className={`h-full rounded-full ${isBetter ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`} style={{ width: `${propPct}%` }} />
                  </div>
                  <span className="text-[10px] font-medium w-12 text-right">{typeof b.propertyVal === 'number' ? (b.propertyVal >= 100 ? fmtPrice(b.propertyVal) : b.propertyVal) : b.propertyVal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12">Market</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                    <div className="h-full rounded-full bg-muted-foreground/20" style={{ width: `${mktPct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{typeof b.marketVal === 'number' ? (b.marketVal >= 100 ? fmtPrice(b.marketVal) : b.marketVal) : b.marketVal}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── 29. Energy Efficiency ──────────────────────────────────────────────────

export function EnergyEfficiency({ property }: FeatureProps) {
  const rating = 'B+';
  const monthlyCost = 145;
  const solarPotential = 78;
  const ratingScale = ['A++', 'A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'G'];
  const currentIdx = ratingScale.indexOf(rating);

  const tips = [
    'Upgrade insulation to save 15%',
    'Install double-glazed windows',
    'Consider solar panels — high potential',
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Zap} title="Energy Efficiency" />
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
          {rating}
        </div>
        <div>
          <p className="text-sm font-medium">Above Average</p>
          <p className="text-xs text-muted-foreground">Est. monthly: <span className="font-semibold text-foreground">{fmtPrice(monthlyCost)}</span></p>
        </div>
      </div>
      {/* Rating scale */}
      <div className="flex items-center gap-0.5 mb-4 overflow-x-auto pb-1">
        {ratingScale.map((r, i) => (
          <div key={i} className={`flex-1 min-w-[24px] h-8 rounded flex items-center justify-center text-[10px] font-medium transition-all ${i <= currentIdx ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white' : i <= currentIdx + 2 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted/20 text-muted-foreground'}`}>
            {r}
          </div>
        ))}
      </div>
      {/* Solar potential */}
      <div className="bg-amber-500/5 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /> Solar Potential</span>
          <span className="text-xs font-bold text-amber-500">{solarPotential}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000" style={{ width: `${solarPotential}%` }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium">Efficiency Tips</p>
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{t}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 30. Gamified Exploration ───────────────────────────────────────────────

export function GamifiedExploration({ property }: FeatureProps) {
  const points = 2450;
  const level = 'Explorer';
  const badges = [
    { name: 'Explorer', icon: Compass, earned: true, desc: 'Viewed 10+ properties' },
    { name: 'Analyst', icon: BarChart3, earned: true, desc: 'Used 5+ analysis tools' },
    { name: 'Collector', icon: Heart, earned: true, desc: 'Saved 5+ favorites' },
    { name: 'Expert', icon: Award, earned: false, desc: 'Complete all quizzes' },
    { name: 'Pioneer', icon: MapPinned, earned: false, desc: 'Explore 5 cities' },
    { name: 'Investor', icon: TrendingUp, earned: false, desc: 'Run 3 ROI analyses' },
  ];
  const earnedCount = badges.filter(b => b.earned).length;
  const progress = Math.round((earnedCount / badges.length) * 100);

  const leaderboard = [
    { name: 'Sarah M.', pts: 5200, rank: 1 },
    { name: 'Ahmed K.', pts: 4100, rank: 2 },
    { name: 'You', pts: points, rank: 3 },
    { name: 'Emily R.', pts: 1800, rank: 4 },
  ];

  return (
    <GlassCard>
      <SectionTitle icon={Gamepad2} title="Gamified Exploration" />
      {/* Points & Level */}
      <div className="flex items-center gap-4 mb-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/5 rounded-xl p-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent"><AnimatedNumber value={points} /></p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">{level}</span>
          </div>
          <p className="text-xs text-muted-foreground">Level {Math.floor(points / 1000) + 1} · {1000 - (points % 1000)} pts to next</p>
        </div>
      </div>
      {/* Badges */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">Badges ({earnedCount}/{badges.length})</p>
          <span className="text-[10px] text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden mb-3">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b, i) => (
            <div key={i} className={`rounded-xl p-2 text-center transition-all ${b.earned ? 'bg-gradient-to-br from-amber-500/10 to-orange-400/5 border border-amber-500/20' : 'bg-muted/20 opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${b.earned ? 'bg-gradient-to-br from-amber-500 to-orange-400' : 'bg-muted/30'}`}>
                <b.icon className={`w-4 h-4 ${b.earned ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-[10px] font-medium">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Leaderboard */}
      <div>
        <p className="text-xs font-medium mb-2">Leaderboard</p>
        <div className="space-y-1.5">
          {leaderboard.map((l, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${l.name === 'You' ? 'bg-amber-500/10 font-medium' : 'bg-muted/20'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${l.rank === 1 ? 'bg-amber-500 text-white' : l.rank === 2 ? 'bg-slate-400 text-white' : l.rank === 3 ? 'bg-orange-400 text-white' : 'bg-muted/30 text-muted-foreground'}`}>{l.rank}</span>
              <span className="flex-1">{l.name}</span>
              <span className={l.name === 'You' ? 'text-amber-500 font-bold' : 'text-muted-foreground'}>{fmt(l.pts)} pts</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
