import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCmHVfolzMZ8Kz8brXmAVrghkCLD2oY21w",
  authDomain: "swifttask-878fb.firebaseapp.com",
  projectId: "swifttask-878fb",
  storageBucket: "swifttask-878fb.firebasestorage.app",
  messagingSenderId: "964194703299",
  appId: "1:964194703299:web:e15aeb7d78778916c08f76",
  databaseURL: "https://swifttask-878fb-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// ─────────────────────────────────────────────────────────
// SKILL TAXONOMY — NO "Beauty & Grooming" parent
// ─────────────────────────────────────────────────────────
export const SKILL_TAXONOMY: Record<string, string[]> = {
  'Plumbing':       ['plumbing','pipe','water','leak','tap','drain','toilet','bathroom','general repair','handyman'],
  'Electrical':     ['electrical','electric','wiring','generator','inverter','light','socket','switch','general repair','handyman'],
  'Tech Repair':    ['tech','repair','laptop','phone','computer','screen','gadget','electronics','technician'],
  'Delivery':       ['delivery','dispatch','rider','logistics','courier','transport','errand'],
  'Cleaning':       ['cleaning','cleaner','housekeeper','laundry','sweep','mop','domestic'],
  'Mechanic':       ['mechanic','car','auto','vehicle','engine','brake','tyre','motor'],
  'Barbing':        ['barber','barbing','haircut','fade','trim','shave','low cut','lineup','grooming'],
  'Hair Dressing':  ['hair dresser','hairdresser','hairdressing','weave','braid','braiding','locs','relaxer','treatment','styling','blow dry'],
  'Nail Technician':['nail technician','nails','manicure','pedicure','gel','acrylic','nail art','nail tech'],
  'Other':          ['handyman','general','maintenance','labour','help'],
};

export const ALL_CATEGORIES = [
  'Plumbing','Electrical','Tech Repair','Delivery',
  'Cleaning','Mechanic','Barbing','Hair Dressing','Nail Technician','Other'
];

// Category-aware urgency expiry hours
export const URGENCY_HOURS: Record<string, Record<string, number>> = {
  'Plumbing':       { now: 2,  today: 8,  flexible: 168 },
  'Electrical':     { now: 2,  today: 8,  flexible: 168 },
  'Delivery':       { now: 1,  today: 6,  flexible: 72  },
  'Tech Repair':    { now: 4,  today: 12, flexible: 168 },
  'Mechanic':       { now: 4,  today: 12, flexible: 168 },
  'Cleaning':       { now: 4,  today: 12, flexible: 168 },
  'Barbing':        { now: 4,  today: 24, flexible: 168 },
  'Hair Dressing':  { now: 6,  today: 24, flexible: 168 },
  'Nail Technician':{ now: 6,  today: 24, flexible: 168 },
  'Other':          { now: 4,  today: 24, flexible: 168 },
};


export function getCategoryFallback(category: string): string[] {
  const fallbacks: Record<string, string[]> = {
    'Plumbing':       ['General Repair','Other'],
    'Electrical':     ['General Repair','Other'],
    'Tech Repair':    ['Other'],
    'Delivery':       ['Other'],
    'Cleaning':       ['Other'],
    'Mechanic':       ['General Repair','Other'],
    'Barbing':        ['Hair Dressing'],
    'Hair Dressing':  ['Barbing'],
    'Nail Technician':['Other'],
    'Other':          [],
  };
  return fallbacks[category] || [];
}

const GENERAL_SKILLS = ['handyman','general repair','general','maintenance'];

function getSkillScore(skills: string[], category: string): number {
  if (!skills?.length) return 0.2;
  const related = SKILL_TAXONOMY[category] || [];
  let best = 0.0;
  for (const skill of skills) {
    const s = skill.toLowerCase();
    const c = category.toLowerCase();
    if (s === c || s.includes(c) || c.includes(s)) { best = 1.0; break; }
    if (related.slice(0,3).some(r => s.includes(r) || r.includes(s))) best = Math.max(best, 0.85);
    if (related.some(r => s.includes(r) || r.includes(s))) best = Math.max(best, 0.70);
    if (GENERAL_SKILLS.some(g => s.includes(g))) best = Math.max(best, 0.40);
  }
  return best || 0.15;
}

function computeDecayedRating(reviews: Array<{rating:number;createdAt:number}>): number {
  if (!reviews?.length) return 3.0;
  const now = Date.now();
  let ws = 0, tw = 0;
  for (const r of reviews) {
    const w = Math.exp(-0.01 * (now - r.createdAt) / 86400000);
    ws += r.rating * w; tw += w;
  }
  return tw > 0 ? ws / tw : 3.0;
}

// ─────────────────────────────────────────────────────────
// MATCH SCORE — fixed conflicts
// 1. newProviderBoost is UNIFIED with trust:
//    new providers get boost in match AND a neutral (not penalised) trust
// 2. responseSpeed now uses real chat response data when available
// 3. rankProviders() is called correctly
// ─────────────────────────────────────────────────────────
export function calculateMatchScore(provider: any, request: any): number {
  const skills = provider.providerProfile?.skills || [];
  const jobs = provider.stats?.jobsCompleted || 0;
  const rating = provider.stats?.rating || 0;
  const disputeRate = provider.stats?.disputeRate || 0;
  const cancellationRate = provider.stats?.cancellationRate || 0;
  const completionRate = provider.stats?.completionRate || 0;
  const responseTimeMins = provider.providerProfile?.responseTimeMins || 0;
  const avgPrice = provider.providerProfile?.avgPrice || 0;
  const distanceKm = provider.distanceKm || 5;
  const reviews = provider.reviews || [];
  const serviceMode = provider.providerProfile?.serviceMode || 'mobile';
  const isNew = jobs < 5;

  // 1. RESPONSE SPEED — uses real responseTimeMins when available
  // responseTimeMins is now written by chat tracking (see chatroom.tsx)
  // New providers: neutral 0.45 (not penalised, not boosted)
  // Known providers: real data
  let responseSpeed: number;
  if (isNew || responseTimeMins === 0) {
    responseSpeed = 0.45; // Neutral — unknown but not suspicious
  } else {
    responseSpeed = Math.max(0.1, 1 - (responseTimeMins / 60));
  }

  // 2. DISTANCE — Lagos traffic bands
  let distanceFactor: number;
  if (serviceMode === 'fixed') {
    // Fixed salon/shop — customers travel to them, distance less critical
    distanceFactor = distanceKm <= 3 ? 1.0 : distanceKm <= 7 ? 0.85 : distanceKm <= 15 ? 0.65 : 0.3;
  } else {
    distanceFactor = distanceKm <= 2 ? 1.0 : distanceKm <= 5 ? 0.80 : distanceKm <= 10 ? 0.60 : distanceKm <= 15 ? 0.35 : 0.10;
  }

  // 3. SKILL MATCH
  const skillMatch = getSkillScore(skills, request.category);

  // 4. RELIABILITY — correct priors, no frozen values
  const effectiveRating = reviews.length > 0 ? computeDecayedRating(reviews) : (rating > 0 ? rating : 3.2);
  const reliability =
    (effectiveRating / 5)                       * 0.40 +
    (jobs >= 3 ? completionRate  : 0.50)         * 0.30 +
    (jobs >= 3 ? (1-disputeRate) : 0.80)         * 0.20 +
    (jobs >= 3 ? (1-cancellationRate) : 0.85)    * 0.10;

  // 5. COMPLETION PROB
  const completionProb = jobs >= 3 ? completionRate : 0.50;

  // 6. PRICE FIT — zero guard
  const budgetMid = ((request.budgetMin || 0) + (request.budgetMax || 0)) / 2;
  const priceFit = (budgetMid === 0 || avgPrice === 0) ? 0.50
    : Math.max(0, 1 - Math.abs(avgPrice - budgetMid) / budgetMid);

  const baseScore =
    responseSpeed  * 0.20 +
    distanceFactor * 0.22 +
    skillMatch     * 0.22 +
    reliability    * 0.20 +
    completionProb * 0.10 +
    priceFit       * 0.06;

  // NEW PROVIDER BOOST — unified signal
  // New providers get +0.12 in match score
  // Trust score also gives them neutral (not penalised) treatment
  // Both signals say: "untested but promising" — consistent messaging
  const newProviderBoost = isNew ? 0.12 : 0.0;

  // EXPERIENCE BONUS — logarithmic
  const experienceBonus = jobs > 0
    ? Math.min(0.08, 0.08 * Math.log10(jobs + 1) / Math.log10(50)) : 0;

  return Math.round(Math.min(1.0, baseScore + newProviderBoost + experienceBonus) * 100) / 100;
}

// ─────────────────────────────────────────────────────────
// TRUST SCORE — unified with match score for new providers
// New providers: neutral trust (not penalised by ageFactor)
// Established: full decay + velocity checks
// ─────────────────────────────────────────────────────────
export function calculateTrustScore(provider: any): number {
  const jobs = provider.stats?.jobsCompleted || 0;
  const rating = provider.stats?.rating || 0;
  const completionRate = provider.stats?.completionRate || 0;
  const disputeRate = provider.stats?.disputeRate || 0;
  const cancellationRate = provider.stats?.cancellationRate || 0;
  const responseRate = provider.stats?.responseRate || 0;
  const reviews = provider.reviews || [];
  const accountAgeDays = provider.createdAt
    ? (Date.now() - new Date(provider.createdAt).getTime()) / 86400000 : 0;
  const isNew = jobs < 5;

  // NEW PROVIDERS: return a consistent neutral trust score
  // Matches the "untested but promising" signal from match score boost
  // Customers see: "New provider — no reviews yet" which is honest
  if (isNew) return 0.45;

  // ESTABLISHED PROVIDERS: full scoring
  const decayedRating = reviews.length > 0
    ? computeDecayedRating(reviews) : (rating > 0 ? rating : 3.0);

  const jobsPerWeek = accountAgeDays > 0 ? (jobs / accountAgeDays) * 7 : 0;
  const velocityPenalty = jobsPerWeek > 15 ? 0.15 : 0;
  const experienceBonus = Math.min(0.10, 0.10 * Math.log10(jobs + 1) / Math.log10(50));

  const rawScore =
    (decayedRating / 5) * 0.35 +
    completionRate      * 0.25 +
    (1 - disputeRate)   * 0.20 +
    responseRate        * 0.15 +
    (1-cancellationRate)* 0.05 +
    experienceBonus;

  return Math.round(Math.min(1, Math.max(0, rawScore - velocityPenalty)) * 100) / 100;
}

export function calculateBadges(provider: any) {
  const trust = calculateTrustScore(provider);
  const jobs = provider.stats?.jobsCompleted || 0;
  const rating = provider.stats?.rating || 0;
  const accountAgeDays = provider.createdAt
    ? (Date.now() - new Date(provider.createdAt).getTime()) / 86400000 : 0;
  const jobsPerWeek = accountAgeDays > 0 ? (jobs / accountAgeDays) * 7 : 0;
  const suspicious = jobsPerWeek > 15 && jobs > 20;
  return {
    phoneVerified: provider.badges?.phoneVerified || false,
    newProvider:   jobs < 5,
    rising:        jobs >= 1  && jobs < 15  && rating >= 4.0  && !suspicious,
    trusted:       jobs >= 5  && trust >= 0.65 && !suspicious,
    topProvider:   jobs >= 10 && rating >= 4.5 && trust >= 0.75 && !suspicious,
    elite:         jobs >= 50 && rating >= 4.8 && trust >= 0.88 && accountAgeDays >= 90 && !suspicious,
    flagged:       suspicious,
  };
}

// ─────────────────────────────────────────────────────────
// rankProviders — NOW ACTUALLY CALLED IN PROVIDER HOME
// ─────────────────────────────────────────────────────────
export function rankProviders(providers: any[], request: any): any[] {
  return providers
    .filter(p => p.isOnline || p.providerProfile?.isOnline)
    .map(p => ({
      ...p,
      matchScore: calculateMatchScore(p, request),
      trustScore: calculateTrustScore(p),
      badges: calculateBadges(p),
    }))
    .sort((a, b) => {
      const diff = b.matchScore - a.matchScore;
      return Math.abs(diff) > 0.05 ? diff : b.trustScore - a.trustScore;
    });
}

export const SERVICE_CATEGORIES = [
  { id: 'inverter_solar', icon: '🔋', label: 'Inverter & Solar', keywords: ['inverter', 'solar', 'panel', 'battery', 'ups', 'power backup', 'installation'] },
  { id: 'ac_specialist', icon: '❄️', label: 'AC Specialist', keywords: ['ac', 'air condition', 'split unit', 'window unit', 'cooling', 'aircon', 'hvac'] },
  { id: 'generator_mechanic', icon: '⚡', label: 'Generator Mechanic', keywords: ['generator', 'gen', 'mikano', 'lister', 'perkins', 'cummins', 'diesel', 'petrol', 'engine'] },
  { id: 'deep_cleaning', icon: '🧼', label: 'Deep Cleaning', keywords: ['clean', 'fumigat', 'wash', 'scrub', 'post construction', 'industrial', 'disinfect', 'sanitize'] },
  { id: 'borehole_plumbing', icon: '🚰', label: 'Borehole & Plumbing', keywords: ['plumb', 'pipe', 'borehole', 'water', 'tap', 'drain', 'toilet', 'pump', 'leak', 'burst'] },
  { id: 'smart_home_cctv', icon: '👨‍💻', label: 'Smart Home & CCTV', keywords: ['cctv', 'camera', 'smart home', 'fibre', 'network', 'wifi', 'cable', 'security', 'automation'] },
  { id: 'vehicle_diagnostics', icon: '🚗', label: 'Vehicle Diagnostics', keywords: ['car', 'vehicle', 'mechanic', 'engine', 'brake', 'tyre', 'ecu', 'diagnostic', 'auto', 'oil'] },
  { id: 'elite_barber_hair', icon: '💈', label: 'Barber & Hair Pro', keywords: ['barb', 'haircut', 'cut', 'fade', 'trim', 'weave', 'braid', 'locs', 'hair', 'style'] },
  { id: 'luxury_nail_spa', icon: '💅', label: 'Nail & Spa', keywords: ['nail', 'manicure', 'pedicure', 'gel', 'acrylic', 'spa', 'esthetician', 'lash'] },
  { id: 'secured_logistics', icon: '📦', label: 'Logistics & Courier', keywords: ['deliver', 'dispatch', 'courier', 'rider', 'haulage', 'pickup', 'dropoff', 'send', 'move'] },
] as const;

export type CategoryId = typeof SERVICE_CATEGORIES[number]['id'];

export const CATEGORY_PRICE_CONFIG: Record<string, {floor:number;ceiling:number}> = {
  inverter_solar: { floor: 15000, ceiling: 150000 },
  ac_specialist: { floor: 10000, ceiling: 80000 },
  generator_mechanic: { floor: 10000, ceiling: 100000 },
  deep_cleaning: { floor: 20000, ceiling: 200000 },
  borehole_plumbing: { floor: 8000, ceiling: 150000 },
  smart_home_cctv: { floor: 20000, ceiling: 300000 },
  vehicle_diagnostics: { floor: 10000, ceiling: 150000 },
  elite_barber_hair: { floor: 5000, ceiling: 50000 },
  luxury_nail_spa: { floor: 8000, ceiling: 60000 },
  secured_logistics: { floor: 3000, ceiling: 50000 },
};

export function getExpiryHours(category: string, urgency: string): number {
  if (urgency === 'now') return 4;
  if (urgency === 'today') return 24;
  // Premium infra categories get 72h flexible window
  const infra = ['inverter_solar','ac_specialist','generator_mechanic','borehole_plumbing','smart_home_cctv','vehicle_diagnostics'];
  return infra.includes(category) ? 96 : 72;
}
