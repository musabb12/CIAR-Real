import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const FEATURES = [
  { key: 'ai_valuation', name: 'AI Property Valuation', description: 'AI-powered property value estimation based on market data', category: 'ai', icon: 'Brain', order: 1 },
  { key: 'virtual_tour', name: 'Virtual Tour Viewer', description: '360° panoramic virtual property tours', category: 'tools', icon: 'Eye', order: 2 },
  { key: 'roi_calculator', name: 'Investment ROI Calculator', description: 'Calculate return on investment for any property', category: 'analytics', icon: 'TrendingUp', order: 3 },
  { key: 'neighborhood', name: 'Neighborhood Insights', description: 'Detailed area analysis with safety, schools, amenities', category: 'analytics', icon: 'MapPin', order: 4 },
  { key: 'walkability', name: 'Walkability & Transit Score', description: 'Walk score and public transit accessibility rating', category: 'analytics', icon: 'Footprints', order: 5 },
  { key: 'price_trends', name: 'Price Trend Analysis', description: 'Historical price data with interactive charts', category: 'analytics', icon: 'BarChart3', order: 6 },
  { key: 'price_alerts', name: 'Smart Price Alerts', description: 'Get notified when property prices drop', category: 'tools', icon: 'Bell', order: 7 },
  { key: 'reviews', name: 'Property Reviews', description: 'User reviews and ratings for properties', category: 'social', icon: 'Star', order: 8 },
  { key: 'floor_plan', name: 'Floor Plan Viewer', description: 'Interactive property floor plans', category: 'tools', icon: 'LayoutGrid', order: 9 },
  { key: 'heatmap', name: 'Price Heatmap', description: 'Visual price heatmap by area', category: 'analytics', icon: 'Flame', order: 10 },
  { key: 'schools', name: 'School District Ratings', description: 'Nearby school quality ratings', category: 'analytics', icon: 'GraduationCap', order: 11 },
  { key: 'commute', name: 'Commute Calculator', description: 'Estimate commute times to major hubs', category: 'tools', icon: 'Car', order: 12 },
  { key: 'carbon', name: 'Carbon Footprint Rating', description: 'Environmental impact and eco rating', category: 'analytics', icon: 'Leaf', order: 13 },
  { key: 'smart_home', name: 'Smart Home Compatibility', description: 'IoT and smart home device compatibility', category: 'tools', icon: 'Wifi', order: 14 },
  { key: 'noise', name: 'Noise Level Assessment', description: 'Environmental noise level analysis', category: 'analytics', icon: 'Volume2', order: 15 },
  { key: 'pet_friendly', name: 'Pet Friendliness Score', description: 'Pet-friendly amenities and policies', category: 'tools', icon: 'Dog', order: 16 },
  { key: 'nightlife', name: 'Nightlife Proximity', description: 'Entertainment and nightlife nearby', category: 'analytics', icon: 'Music', order: 17 },
  { key: 'seasonal', name: 'Seasonal Pricing', description: 'Price trends and analysis by season', category: 'analytics', icon: 'CalendarDays', order: 18 },
  { key: 'renovation', name: 'Renovation Estimator', description: 'Estimate renovation and improvement costs', category: 'tools', icon: 'Hammer', order: 19 },
  { key: 'rental_yield', name: 'Rental Yield Calculator', description: 'Calculate potential rental ROI', category: 'analytics', icon: 'Coin', order: 20 },
  { key: 'lifestyle', name: 'Lifestyle Match', description: 'AI-powered lifestyle preference matching', category: 'ai', icon: 'Heart', order: 21 },
  { key: 'disaster', name: 'Disaster Risk Assessment', description: 'Natural disaster risk evaluation', category: 'analytics', icon: 'ShieldAlert', order: 22 },
  { key: 'accessibility', name: 'Accessibility Score', description: 'Accessibility rating for disabled persons', category: 'tools', icon: 'Accessibility', order: 23 },
  { key: 'family', name: 'Family Friendliness', description: 'Family-oriented amenities score', category: 'analytics', icon: 'Users', order: 24 },
  { key: 'grocery', name: 'Grocery & Delivery', description: 'Nearby grocery and delivery coverage', category: 'tools', icon: 'ShoppingCart', order: 25 },
  { key: 'similarity', name: 'Similar Properties', description: 'Find properties similar to current one', category: 'tools', icon: 'Copy', order: 26 },
  { key: 'timeline', name: 'Property History', description: 'Track price and status changes over time', category: 'analytics', icon: 'History', order: 27 },
  { key: 'benchmark', name: 'Market Benchmark', description: 'Compare property against market averages', category: 'analytics', icon: 'Gauge', order: 28 },
  { key: 'energy', name: 'Energy Efficiency', description: 'Energy performance rating and costs', category: 'analytics', icon: 'Zap', order: 29 },
  { key: 'gamification', name: 'Gamified Exploration', description: 'Earn points and badges while exploring', category: 'general', icon: 'Trophy', order: 30 },
];

export async function POST() {
  try {
    let created = 0;
    for (const f of FEATURES) {
      const exists = await db.featureToggle.findUnique({ where: { key: f.key } });
      if (!exists) {
        await db.featureToggle.create({ data: f });
        created++;
      }
    }
    return NextResponse.json({ message: `Seeded ${created} new features`, total: FEATURES.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
