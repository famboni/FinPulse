import { CategoryId, CategoryMeta, MatchSource } from '../types/finance';

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  income: {
    id: 'income',
    label: 'Income & Salary',
    color: '#10b981',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30',
    textClass: 'text-emerald-300',
    isFixedCommitted: false,
    isDiscretionary: false,
  },
  housing: {
    id: 'housing',
    label: 'Housing & Rent/Mortgage',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/15 border-blue-500/30',
    textClass: 'text-blue-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  utilities: {
    id: 'utilities',
    label: 'Utilities, Power & Broadband',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/15 border-cyan-500/30',
    textClass: 'text-cyan-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  insurance: {
    id: 'insurance',
    label: 'Insurance & Rates',
    color: '#6366f1',
    bgClass: 'bg-indigo-500/15 border-indigo-500/30',
    textClass: 'text-indigo-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  education: {
    id: 'education',
    label: 'Education, Tuition & Courses',
    color: '#8b5cf6',
    bgClass: 'bg-violet-500/15 border-violet-500/30',
    textClass: 'text-violet-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  credit_cards: {
    id: 'credit_cards',
    label: 'Credit Cards',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/15 border-rose-500/30',
    textClass: 'text-rose-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  groceries: {
    id: 'groceries',
    label: 'Supermarket & Groceries',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/15 border-teal-500/30',
    textClass: 'text-teal-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  transport: {
    id: 'transport',
    label: 'Fuel & Public Transport',
    color: '#0ea5e9',
    bgClass: 'bg-sky-500/15 border-sky-500/30',
    textClass: 'text-sky-300',
    isFixedCommitted: true,
    isDiscretionary: false,
  },
  subscriptions: {
    id: 'subscriptions',
    label: 'Digital Subscriptions & Apps',
    color: '#a855f7',
    bgClass: 'bg-purple-500/15 border-purple-500/30',
    textClass: 'text-purple-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  dining_takeout: {
    id: 'dining_takeout',
    label: 'Dining, Takeout & Delivery',
    color: '#f97316',
    bgClass: 'bg-orange-500/15 border-orange-500/30',
    textClass: 'text-orange-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  coffee_snacks: {
    id: 'coffee_snacks',
    label: 'Cafés, Bakery & Convenience',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/15 border-amber-500/30',
    textClass: 'text-amber-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  shopping: {
    id: 'shopping',
    label: 'Retail & Online Shopping',
    color: '#ec4899',
    bgClass: 'bg-pink-500/15 border-pink-500/30',
    textClass: 'text-pink-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  bnpl: {
    id: 'bnpl',
    label: 'Buy Now, Pay Later (BNPL)',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/15 border-rose-500/30',
    textClass: 'text-rose-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  entertainment: {
    id: 'entertainment',
    label: 'Bars, Events & Leisure',
    color: '#d946ef',
    bgClass: 'bg-fuchsia-500/15 border-fuchsia-500/30',
    textClass: 'text-fuchsia-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  health_fitness: {
    id: 'health_fitness',
    label: 'Health, Pharmacy & Gym',
    color: '#84cc16',
    bgClass: 'bg-lime-500/15 border-lime-500/30',
    textClass: 'text-lime-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  fees_interest: {
    id: 'fees_interest',
    label: 'Bank Fees, Penalties & Interest',
    color: '#ef4444',
    bgClass: 'bg-red-500/15 border-red-500/30',
    textClass: 'text-red-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  gambling_gaming: {
    id: 'gambling_gaming',
    label: 'Betting, Lottery & Gaming',
    color: '#e11d48',
    bgClass: 'bg-rose-600/15 border-rose-600/30',
    textClass: 'text-rose-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  auto_maintenance: {
    id: 'auto_maintenance',
    label: 'Auto Service, Rego & Repairs',
    color: '#64748b',
    bgClass: 'bg-slate-500/15 border-slate-500/30',
    textClass: 'text-slate-300',
    isFixedCommitted: false,
    isDiscretionary: false,
  },
  travel: {
    id: 'travel',
    label: 'Flights, Hotels & Holidays',
    color: '#38bdf8',
    bgClass: 'bg-sky-400/15 border-sky-400/30',
    textClass: 'text-sky-200',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  general: {
    id: 'general',
    label: 'General & Everyday Services',
    color: '#94a3b8',
    bgClass: 'bg-slate-500/20 border-slate-400/30',
    textClass: 'text-slate-200',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
  transfer: {
    id: 'transfer',
    label: 'Internal Transfer / Savings',
    color: '#64748b',
    bgClass: 'bg-slate-600/15 border-slate-500/30',
    textClass: 'text-slate-400',
    isFixedCommitted: false,
    isDiscretionary: false,
  },
  uncategorized: {
    id: 'uncategorized',
    label: 'Uncategorized (Needs Review)',
    color: '#eab308',
    bgClass: 'bg-yellow-500/15 border-yellow-500/40',
    textClass: 'text-yellow-300',
    isFixedCommitted: false,
    isDiscretionary: true,
  },
};

export const ALL_CATEGORIES: CategoryMeta[] = Object.values(CATEGORY_META);

interface MerchantRule {
  pattern: RegExp;
  canonicalName: string;
  category: CategoryId;
  functionalGroup?: string;
  isBNPL?: boolean;
  isFee?: boolean;
}

const KNOWN_MERCHANT_RULES: MerchantRule[] = [
  // Video Streaming
  { pattern: /netflix/i, canonicalName: 'Netflix', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /disney\s*\+|disney\s*plus|walt\s*disney/i, canonicalName: 'Disney+', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /\bneon\b|sky\s*neon|sky\s*tv|sky\s*sport/i, canonicalName: 'Neon / Sky TV', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /apple\s*tv|apple\.com\/bill.*tv/i, canonicalName: 'Apple TV+', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /amazon\s*prime|prime\s*video/i, canonicalName: 'Amazon Prime Video', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /hulu/i, canonicalName: 'Hulu', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /max\.com|hbo\s*max|binge\s*tv|kayosports|stan\.com/i, canonicalName: 'Streaming Service', category: 'subscriptions', functionalGroup: 'Video Streaming' },
  { pattern: /youtube\s*prem|google\s*\*youtube/i, canonicalName: 'YouTube Premium', category: 'subscriptions', functionalGroup: 'Video Streaming' },

  // Music & Audio
  { pattern: /spotify/i, canonicalName: 'Spotify', category: 'subscriptions', functionalGroup: 'Music & Audio' },
  { pattern: /audible/i, canonicalName: 'Audible', category: 'subscriptions', functionalGroup: 'Music & Audio' },
  { pattern: /apple\s*music|tidal\.com|soundcloud/i, canonicalName: 'Music Streaming', category: 'subscriptions', functionalGroup: 'Music & Audio' },

  // Cloud, AI & Software
  { pattern: /ai\s*photo\s*pro|midjourney|openai|chatgpt|claude\.ai|anthropic|perplexity/i, canonicalName: 'AI Subscription', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },
  { pattern: /apple\.com\/bill|icloud/i, canonicalName: 'Apple iCloud+', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },
  { pattern: /google\s*\*google\s*one|google\s*storage|google\s*workspace/i, canonicalName: 'Google One / Cloud', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },
  { pattern: /dropbox/i, canonicalName: 'Dropbox', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },
  { pattern: /adobe/i, canonicalName: 'Adobe Creative Cloud', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },
  { pattern: /microsoft\s*365|msft\s*\*|canva|notion|github|xero|myob/i, canonicalName: 'Software Subscription', category: 'subscriptions', functionalGroup: 'Cloud & AI Tools' },

  // Education, Schools, Universities, Childcare & Courses
  {
    pattern: /udemy|coursera|skillshare|duolingo|masterclass|edx|pluralsight|datacamp|brilliant\.org|khan\s*academy|linkedin\s*learning/i,
    canonicalName: 'Online Course / Learning',
    category: 'education',
    functionalGroup: 'Education',
  },
  {
    pattern: /university|uni\s*of|aut\s*uni|massey\s*uni|victoria\s*uni|otago\s*uni|canterbury\s*uni|waikato\s*uni|unitec|mit\s*manukau|polytechnic|open\s*polytechnic|studylink|student\s*loan/i,
    canonicalName: 'University & Tertiary Tuition',
    category: 'education',
    functionalGroup: 'Education',
  },
  {
    pattern: /kindergarten|kindy|beststart|best\s*start|abc\s*learning|lollipops|childcare|daycare|preschool|pre-school|montessori|playcentre|porse|au\s*pair/i,
    canonicalName: 'Childcare & Early Education',
    category: 'education',
    functionalGroup: 'Education',
  },
  {
    pattern: /\bschool\b|\bcollege\b|\bgrammar\b|kindo|mykindo|kamahori|hero\s*school|music\s*school|swim\s*school|kumon|kip\s*mcgrath|numberworks|tuition|tutoring/i,
    canonicalName: 'School & Tuition Fees',
    category: 'education',
    functionalGroup: 'Education',
  },

  // Gym & Fitness
  { pattern: /cityfitness|city\s*fitness/i, canonicalName: 'CityFitness Gym', category: 'health_fitness', functionalGroup: 'Fitness & Gym' },
  { pattern: /les\s*mills/i, canonicalName: 'Les Mills Gym', category: 'health_fitness', functionalGroup: 'Fitness & Gym' },
  { pattern: /jetts|anytime\s*fitness|f45|planet\s*fitness|equinox|snap\s*fitness|ymca|pilates|yoga|crossfit/i, canonicalName: 'Gym & Fitness', category: 'health_fitness', functionalGroup: 'Fitness & Gym' },

  // Utilities, Power & Telco
  { pattern: /mercury\s*energy|contact\s*energy|genesis\s*energy|meridian\s*energy|electric\s*kiwi|octopus\s*energy|powershop|frank\s*energy|nova\s*energy|trustpower|vector|coned|pg&e|agl|origin\s*energy/i, canonicalName: 'Power & Gas Utility', category: 'utilities', functionalGroup: 'Utilities & Energy' },
  { pattern: /watercare|sydney\s*water|thames\s*water|water\s*rates/i, canonicalName: 'Water Utility', category: 'utilities', functionalGroup: 'Utilities & Energy' },
  { pattern: /spark\s*nz|one\s*nz|vodafone|2degrees|skinny|orcon|slingshot|myrepublic|voyager|now\s*broadband|telstra|optus|comcast|xfinity|verizon|at&t|t-mobile/i, canonicalName: 'Broadband & Mobile', category: 'utilities', functionalGroup: 'Broadband & Telco' },

  // Housing
  { pattern: /rent\s*payment|quinovic|barfoot|ray\s*white|harcourts|lj\s*hooker|bayleys|property\s*mgmt|property\s*management|landlord|mortgage|home\s*loan|body\s*corp/i, canonicalName: 'Rent / Mortgage', category: 'housing', functionalGroup: 'Housing' },

  // Insurance & Council Rates
  { pattern: /tower\s*insurance|aa\s*insurance|state\s*insurance|ami\s*insurance|southern\s*cross|nib\s*health|AIA\s*nz|partners\s*life|chubb|cove\s*insurance|trade\s*me\s*insurance|geico|allstate|progressive|nrn\s*insurance/i, canonicalName: 'Insurance Policy', category: 'insurance', functionalGroup: 'Insurance' },
  { pattern: /auckland\s*council\s*rates|council\s*rates|city\s*council\s*rates/i, canonicalName: 'Council Rates', category: 'insurance', functionalGroup: 'Insurance' },

  // BNPL (Buy Now Pay Later)
  { pattern: /afterpay/i, canonicalName: 'Afterpay', category: 'bnpl', functionalGroup: 'BNPL', isBNPL: true },
  { pattern: /\bzip\s*pay|\bzip\s*co|\bzip\s*nz/i, canonicalName: 'Zip Pay', category: 'bnpl', functionalGroup: 'BNPL', isBNPL: true },
  { pattern: /klarna/i, canonicalName: 'Klarna', category: 'bnpl', functionalGroup: 'BNPL', isBNPL: true },
  { pattern: /laybuy|humm|genoapay|oxipay/i, canonicalName: 'Laybuy / Humm', category: 'bnpl', functionalGroup: 'BNPL', isBNPL: true },
  { pattern: /paypal\s*pay\s*in\s*4|affirm/i, canonicalName: 'PayPal Pay-in-4 / Affirm', category: 'bnpl', functionalGroup: 'BNPL', isBNPL: true },

  // Bank Fees, Overdraft, Penalties
  { pattern: /dishonour\s*fee|dishonor\s*fee|unarranged\s*overdraft|overdraft\s*fee|overdraft\s*interest|late\s*payment\s*fee|nsf\s*fee|foreign\s*currency\s*fee|intl\s*tx\s*fee|monthly\s*account\s*fee|atm\s*fee|card\s*fee|overlimit\s*fee/i, canonicalName: 'Bank Fee / Penalty', category: 'fees_interest', functionalGroup: 'Bank Fees', isFee: true },

  // Supermarkets & Groceries
  { pattern: /woolworths|countdown/i, canonicalName: 'Woolworths Supermarket', category: 'groceries' },
  { pattern: /pak\s*n\s*save|pak'n\s*save|paknsave/i, canonicalName: "PAK'nSAVE", category: 'groceries' },
  { pattern: /new\s*world/i, canonicalName: 'New World', category: 'groceries' },
  { pattern: /farro\s*fresh|four\s*square|fresh\s*choice|supervalue|bin\s*inn|tai\s*ping|asian\s*supermarket|butcher|fruit\s*world|vege\s*market|whole\s*foods|trader\s*joe|kroger|tesco|sainsbury|aldi|coles|costco/i, canonicalName: 'Supermarket & Groceries', category: 'groceries' },

  // Dining, Takeout & Delivery
  { pattern: /uber\s*\*?eats/i, canonicalName: 'Uber Eats', category: 'dining_takeout' },
  { pattern: /doordash|deliveroo|menulog|grubhub|delivereasy/i, canonicalName: 'Food Delivery', category: 'dining_takeout' },
  { pattern: /mcdonald|kfc|burger\s*fuel|burger\s*king|wendy|domino|pizza\s*hut|hell\s*pizza|sals\s*pizza|subway|nando|chipotle|taco\s*bell|pita\s*pit|st\s*pierre|sushi|kebab|fish\s*&\s*chips|fish\s*and\s*chips/i, canonicalName: 'Fast Food & Takeout', category: 'dining_takeout' },
  { pattern: /thai|ramen|bistro|kitchen|restaurant|pizzeria|eatery|grill|diner|trattoria|brasserie|izakaya|dumpling|noodle|bbq|steakhouse|cantina|tapas/i, canonicalName: 'Restaurant & Dining', category: 'dining_takeout' },

  // Cafés, Bakery & Convenience
  { pattern: /daily\s*bread|starbucks|mojo\s*coffee|columbus\s*coffee|allpress|tank\s*juice|coffee\s*club|esquires|sierra\s*coffee|robert\s*harris|muffin\s*break|kristy|cafe|café|espresso|bakery|bakehouse|patisserie|roasters|bagel|donut|gelato|ice\s*cream/i, canonicalName: 'Café & Bakery', category: 'coffee_snacks' },
  { pattern: /night\s*'n\s*day|night\s*n\s*day|dairy|7-eleven|7\s*eleven|four\s*square\s*express|circle\s*k|convenience|vending|minimart|superette/i, canonicalName: 'Convenience & Snacks', category: 'coffee_snacks' },

  // Transport & Fuel
  { pattern: /z\s*energy|bp\s*connect|bp\s*2go|mobil\s*oil|gull\s*service|caltex|npd\s*fuel|waitomo\s*fuel|allied\s*fuel|challenge\s*fuel|shell\s*service|chevron/i, canonicalName: 'Fuel & Service Station', category: 'transport' },
  { pattern: /at\s*hop|auckland\s*transport|snapper|metlink|metrocard|bee\s*card|opal\s*card|tfl\s*gov|mta\s*nyct|uber\s*\*?trip|uber\s*bv|didi|ola\s*cabs|lyft|lime\s*scooter|flamingo\s*scooter|beam\s*scooter|wilson\s*parking|at\s*park|parkmate|parkable|care\s*park|bluebridge|interislander|taxi|shuttles/i, canonicalName: 'Transit, Rideshare & Parking', category: 'transport' },

  // Retail & Shopping
  { pattern: /kmart|the\s*warehouse|warehouse\s*stationery|target|walmart|bunnings|mitre\s*10|place\s*makers|ikea|briscoes|rebel\s*sport|farmers|spotlight|bed\s*bath|freedom\s*furniture|harvey\s*norman|stevens/i, canonicalName: 'Department & Home Store', category: 'shopping' },
  { pattern: /asos|iconic|zara|cotton\s*on|h&m|uniqlo|hallenstein|glassons|barkers|max\s*fashions|postie|kathmandu|macpac|platypus|hype\s*dc|foot\s*locker|mecca|sephora|amazon|amzn|temu|aliexpress|shein|pb\s*tech|jb\s*hi-fi|noel\s*leeming|apple\s*store|whitcoulls|paper\s*plus|mighty\s*ape|trademe|trade\s*me/i, canonicalName: 'Online & Retail Shopping', category: 'shopping' },

  // Entertainment & Bars
  { pattern: /event\s*cinemas|hoyts|reading\s*cinemas|academy\s*cinemas|ticketmaster|ticketek|iticket|moshtix|eventfinda|steam\s*games|playstation|xbox|nintendo|tavern|bar\s*&|brewbar|brewing|pub\b|social\s*club|liquorland|super\s*liquor|bottle-o|big\s*barrel|glengarry|museum|zoo|bowling|golf|mini\s*golf/i, canonicalName: 'Bars, Cinema & Entertainment', category: 'entertainment' },

  // Gambling & Gaming
  { pattern: /lotto\s*nz|mylotto|tab\s*nz|bet365|draftkings|fanduel|skycity\s*casino|christchurch\s*casino|pokerstars|sportsbet|pointsbet/i, canonicalName: 'Lotto & Sports Betting', category: 'gambling_gaming' },

  // Auto Maintenance / Lumpy
  { pattern: /aa\s*auto|vtnz|vinz|waka\s*kotahi|nzta|bridgestone|tony's\s*tyre|beaurepaires|repco|supercheap\s*auto|midas|pit\s*stop|oil\s*changers|panelbeaters|windscreen|novas|smith&smith|mechanic|tyres|auto\s*service|wof\b/i, canonicalName: 'Auto Service, WOF & Rego', category: 'auto_maintenance' },

  // Health & Pharmacy
  { pattern: /chemist\s*warehouse|bargain\s*chemist|unichem|life\s*pharmacy|green\s*cross|pharmacy|medical\s*centre|doctors|gp\s*clinic|white\s*cross|lumino|dental|dentist|orthodontist|optometrist|specsavers|bailey\s*nelson|opsm|physio|physiotherapy|chiropractor|osteopath| acupuncture|counselling|therapy|hospital|labtests/i, canonicalName: 'Medical, Dental & Pharmacy', category: 'health_fitness' },

  // Travel
  { pattern: /air\s*new\s*zealand|air\s*nz|jetstar|qantas|emirates|singapore\s*air|fiji\s*airways|booking\.com|airbnb|expedia|wotif|agoda|hotels\.com|trivago|flight\s*centre|house\s*of\s*travel|hilton|marriott|novotel|ibis|pullman|rydges|sudima|scenic\s*hotel|holiday\s*park|top\s*10|motel|hotel|airport/i, canonicalName: 'Flights & Accommodation', category: 'travel' },

  // General & Everyday Services (Haircut, Post, Drycleaning, Vet/Pet, Trades, Council, Charity)
  {
    pattern: /barber|hairdresser|hair\s*salon|beauty\s*salon|nails|spa\b|massage|waxing|rodney\s*wayne|just\s*cuts|vivo\s*hair/i,
    canonicalName: 'Hair, Barber & Personal Care',
    category: 'general',
  },
  {
    pattern: /nz\s*post|postshop|courier|dhl|fedex|ups|aramex|pack\s*&\s*send|dryclean|dry\s*clean|laundromat|laundry|shoe\s*repair|mister\s*minit|locksmith/i,
    canonicalName: 'Post, Laundry & Everyday Services',
    category: 'general',
  },
  {
    pattern: /animates|pet\s*stock|petstock|pet\s*store|vet\s*clinic|veterinary|vetcare|spca|dog\s*daycare|kennels|cattery/i,
    canonicalName: 'Pets & Veterinary Care',
    category: 'general',
  },
  {
    pattern: /plumber|plumbing|electrician|electrical|builder|handyman|lawnmowing|gardening|hirepool|kennards\s*hire|storage\s*king|national\s*storage|florist|flowers|charity|red\s*cross|salvation\s*army|st\s*john|donation/i,
    canonicalName: 'Home, Trades & Community Services',
    category: 'general',
  },

  // Credit Cards
  {
    pattern: /credit\s*card\s*payment|autopay\s*credit\s*card|visa\s*payment|mastercard\s*payment|amex|american\s*express|gem\s*visa|q\s*card|q\s*mastercard|credit\s*card\s*repay/i,
    canonicalName: 'Credit Card Payment',
    category: 'credit_cards',
    functionalGroup: 'Credit Cards',
  },

  // Internal Transfers
  { pattern: /tfr\s*to|tfr\s*from|internal\s*transfer|transfer\s*to\s*sav|online\s*transfer|kiwisaver|sharesies|hatch\s*invest|kernel\s*wealth|simplicity/i, canonicalName: 'Internal Account / Savings Transfer', category: 'transfer' },

  // Income / Salary
  { pattern: /salary|payroll|wages|direct\s*credit.*ltd|pay\s*run|ird\s*refund|inland\s*revenue|winz|studylink\s*living|employer|acme\s*corp|xero\s*payroll|dividend|interest\s*paid/i, canonicalName: 'Salary / Income', category: 'income' },
];

/**
 * Smart Industry Keyword Heuristic Fallback:
 * When a merchant isn't a well-known chain in KNOWN_MERCHANT_RULES, inspect industry words
 * inside the merchant name / description / bank code so local businesses still auto-assign!
 */
function inferCategoryFromIndustryKeywords(text: string): {
  category: CategoryId;
  reason: string;
} | null {
  const s = text.toLowerCase();

  if (/\b(credit\s*card|mastercard|amex|american\s*express|gem\s*visa|q\s*card)\b/.test(s)) {
    return { category: 'credit_cards', reason: 'Matched credit card keyword' };
  }
  if (/\b(school|college|uni|university|tuition|tutor|academy|kindy|kindergarten|preschool|childcare|daycare|educare|montessori|course|training|polytechnic|textbook|campus)\b/.test(s)) {
    return { category: 'education', reason: 'Matched education/school keyword' };
  }
  if (/\b(supermarket|grocer|grocery|butcher|greengrocer|foodmarket|produce|meats|seafood)\b/.test(s)) {
    return { category: 'groceries', reason: 'Matched grocery/food market keyword' };
  }
  if (/\b(cafe|café|coffee|espresso|roasters|bakery|bakehouse|patisserie|juice|tea\s*house|bagel|donuts|dairy|superette|minimart)\b/.test(s)) {
    return { category: 'coffee_snacks', reason: 'Matched café/bakery/convenience keyword' };
  }
  if (/\b(restaurant|bistro|eatery|kitchen|pizzeria|takeaway|takeout|sushi|thai|indian|chinese|mexican|burgers|kebab|noodle|dumpling|diner|catering)\b/.test(s)) {
    return { category: 'dining_takeout', reason: 'Matched dining/takeout keyword' };
  }
  if (/\b(bar|tavern|pub|brewery|brewbar|liquor|wines|spirits|cinema|theatre|bowling|golf|tickets|amusement|arcade)\b/.test(s)) {
    return { category: 'entertainment', reason: 'Matched entertainment/hospitality keyword' };
  }
  if (/\b(pharmacy|chemist|medical|doctor|clinic|health|dental|dentist|physio|optometrist|optical|chiro|osteopath|gym|fitness|pilates|yoga)\b/.test(s)) {
    return { category: 'health_fitness', reason: 'Matched health/medical/fitness keyword' };
  }
  if (/\b(fuel|petrol|gas\s*station|service\s*station|parking|transit|transport|bus|train|ferry|taxi|cabs|shuttle|tolls)\b/.test(s)) {
    return { category: 'transport', reason: 'Matched transport/fuel/parking keyword' };
  }
  if (/\b(automotive|motors|mechanic|tyres|tires|auto\s*electrical|panel\s*&\s*paint|car\s*wash|wrecker|lubricants)\b/.test(s)) {
    return { category: 'auto_maintenance', reason: 'Matched auto service/repair keyword' };
  }
  if (/\b(airlines|airways|flights|hotel|motel|resort|accommodation|backpackers|lodge|holiday|travel|tour)\b/.test(s)) {
    return { category: 'travel', reason: 'Matched travel/accommodation keyword' };
  }
  if (/\b(power|energy|electricity|gas\s*supply|water|broadband|fibre|telecom|internet|mobile|wireless)\b/.test(s)) {
    return { category: 'utilities', reason: 'Matched utilities/telco keyword' };
  }
  if (/\b(insurance|assurance|underwriters|life\s*cover)\b/.test(s)) {
    return { category: 'insurance', reason: 'Matched insurance keyword' };
  }
  if (/\b(apparel|clothing|fashion|footwear|shoes|boutique|jewellers|jewelry|books|electronics|computers|appliances|furniture|homeware|gift|retail|store|shop|mart)\b/.test(s)) {
    return { category: 'shopping', reason: 'Matched retail/shopping keyword' };
  }
  if (/\b(barber|hair|salon|beauty|nails|spa|massage|post|courier|laundry|dryclean|vet|veterinary|pets|plumber|plumbing|electrical|electrician|builder|hardware|garden|landscaping|storage|cleaning|services|council|charity|donation)\b/.test(s)) {
    return { category: 'general', reason: 'Matched general/everyday service keyword' };
  }

  return null;
}

export function cleanMerchantDisplayName(
  rawMerchant: string,
  description: string
): string {
  let cleaned = (rawMerchant || description || 'Unknown Merchant')
    .replace(
      /^(POS\s*W\/D|EFTPOS|VISA\s*PURCHASE|DEBIT\s*CARD|DIRECT\s*DEBIT|DD|DC|AUTOMATIC\s*PAYMENT|AP|BILL\s*PAYMENT|ONLINE\s*BANKING)\s*/i,
      ''
    )
    .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, '')
    .replace(
      /\b(CARD\s*\d+|REF\s*\d+|AUTH\s*\d+|#[A-Z0-9]{4,}|P\d{5,}|STORE\s*#?\d+)\b/gi,
      ''
    )
    .replace(
      /\s+\b(AUCKLAND|WELLINGTON|CHRISTCHURCH|HAMILTON|TAURANGA|DUNEDIN|QUEENSTOWN|SYDNEY|MELBOURNE|BRISBANE|LONDON|STOCKHOLM|SAN\s*FRANCISCO|NZ|AU|US|GB|UK)\b$/i,
      ''
    )
    .replace(/[*_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned) {
    cleaned = rawMerchant.trim() || description.trim() || 'Unknown Merchant';
  }

  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    cleaned = cleaned
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return cleaned;
}

export function normalizeMerchantAndClassify(
  rawMerchant: string,
  description: string,
  reference: string,
  amount: number,
  userRules: Record<string, CategoryId> = {}
): {
  normalizedMerchant: string;
  category: CategoryId;
  matchSource: MatchSource;
  matchReason: string;
  functionalGroup?: string;
  isBNPL: boolean;
  isFee: boolean;
} {
  const combined = `${rawMerchant} ${description} ${reference}`.trim();
  const cleaned = cleanMerchantDisplayName(rawMerchant, description);
  const lowerClean = cleaned.toLowerCase();

  // 1. Check User / Saved Lookup Rules first
  if (userRules[lowerClean]) {
    const cat = userRules[lowerClean];
    return {
      normalizedMerchant: cleaned,
      category: cat,
      matchSource: 'user_rule',
      matchReason: 'Saved merchant rule',
      isBNPL: cat === 'bnpl',
      isFee: cat === 'fees_interest',
    };
  }

  // 2. Check Known Brand Rules
  for (const rule of KNOWN_MERCHANT_RULES) {
    if (rule.pattern.test(combined)) {
      let finalMerchant = rule.canonicalName;
      if (
        [
          'Café & Bakery',
          'Power & Gas Utility',
          'Broadband & Mobile',
          'Fast Food & Takeout',
          'Restaurant & Dining',
          'Online & Retail Shopping',
          'Department & Home Store',
          'Bars, Cinema & Entertainment',
          'Insurance Policy',
          'Fuel & Service Station',
          'Transit, Rideshare & Parking',
          'School & Tuition Fees',
          'University & Tertiary Tuition',
          'Childcare & Early Education',
          'Online Course / Learning',
          'Hair, Barber & Personal Care',
          'Post, Laundry & Everyday Services',
          'Pets & Veterinary Care',
          'Home, Trades & Community Services',
        ].includes(rule.canonicalName) &&
        cleaned.length >= 3
      ) {
        finalMerchant = cleaned;
      }

      const customCat = userRules[finalMerchant.toLowerCase()];
      return {
        normalizedMerchant: finalMerchant,
        category: customCat || rule.category,
        matchSource: customCat ? 'user_rule' : 'known_brand',
        matchReason: customCat
          ? 'Saved merchant rule'
          : `Matched known merchant (${rule.canonicalName})`,
        functionalGroup: rule.functionalGroup,
        isBNPL: Boolean(rule.isBNPL),
        isFee: Boolean(rule.isFee),
      };
    }
  }

  // 3. Check Smart Industry Keyword Heuristics
  const inferred = inferCategoryFromIndustryKeywords(combined);
  if (inferred) {
    return {
      normalizedMerchant: cleaned,
      category: inferred.category,
      matchSource: 'keyword_heuristic',
      matchReason: inferred.reason,
      isBNPL: inferred.category === 'bnpl',
      isFee: inferred.category === 'fees_interest',
    };
  }

  // 4. Positive amounts default to Income (or shopping refund)
  if (amount > 0) {
    if (/refund|reversal|return/i.test(combined)) {
      return {
        normalizedMerchant: cleaned,
        category: 'shopping',
        matchSource: 'keyword_heuristic',
        matchReason: 'Detected refund/return',
        isBNPL: false,
        isFee: false,
      };
    }
    return {
      normalizedMerchant: cleaned,
      category: 'income',
      matchSource: 'keyword_heuristic',
      matchReason: 'Positive deposit / inflow',
      isBNPL: false,
      isFee: false,
    };
  }

  // 5. Otherwise mark as Uncategorized (so the user can run Smart Online Lookup or assign it!)
  return {
    normalizedMerchant: cleaned,
    category: 'uncategorized',
    matchSource: 'unmatched',
    matchReason: 'Unrecognized merchant name',
    isBNPL: false,
    isFee: false,
  };
}

/**
 * Live Online Merchant Lookup:
 * Queries OpenStreetMap Nominatim public place/business directory to identify what kind of business
 * a merchant name is (e.g., school, cafe, restaurant, supermarket, hairdresser, pharmacy, fuel, shop)
 * and maps it to a FinPulse CategoryId.
 */
export async function lookupMerchantCategoryOnline(
  merchantName: string
): Promise<{
  category: CategoryId;
  matchedPlaceType: string;
  displayName: string;
} | null> {
  const cleanQuery = merchantName
    .replace(/\b(LTD|LIMITED|PTY|INC|CORP|NZ|AU|UK|POS|EFTPOS)\b/gi, '')
    .trim();

  if (cleanQuery.length < 2) return null;

  // First check if sub-tokens match any industry keywords
  const localHeuristic = inferCategoryFromIndustryKeywords(cleanQuery);
  if (localHeuristic) {
    return {
      category: localHeuristic.category,
      matchedPlaceType: localHeuristic.reason,
      displayName: cleanQuery,
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q=${encodeURIComponent(
      cleanQuery
    )}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      category?: string;
      type?: string;
      display_name?: string;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;

    for (const hit of data) {
      const osmCat = (hit.category || '').toLowerCase();
      const osmType = (hit.type || '').toLowerCase();
      const label = `${osmCat}:${osmType}`;

      if (
        ['school', 'university', 'college', 'kindergarten', 'library', 'music_school', 'driving_school', 'language_school'].includes(
          osmType
        )
      ) {
        return {
          category: 'education',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['cafe', 'bakery', 'ice_cream', 'coffee', 'confectionery', 'convenience', 'deli'].includes(osmType)) {
        return {
          category: 'coffee_snacks',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['restaurant', 'fast_food', 'food_court', 'Subway', 'bbq'].includes(osmType)) {
        return {
          category: 'dining_takeout',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['supermarket', 'greengrocer', 'butcher', 'seafood', 'Wholesale', 'grocery'].includes(osmType)) {
        return {
          category: 'groceries',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['bar', 'pub', 'nightclub', 'cinema', 'theatre', 'arts_centre', 'Alcohol', 'wine', 'beverages', 'bowling_alley'].includes(osmType)) {
        return {
          category: 'entertainment',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['pharmacy', 'doctors', 'dentist', 'hospital', 'clinic', 'optician', 'physiotherapist', 'fitness_centre', 'sports_centre', 'gym'].includes(osmType)) {
        return {
          category: 'health_fitness',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['fuel', 'parking', 'bus_station', 'train_station', 'ferry_terminal', 'taxi'].includes(osmType)) {
        return {
          category: 'transport',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['car_repair', 'tyres', 'car_parts', 'car_wash'].includes(osmType)) {
        return {
          category: 'auto_maintenance',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (osmCat === 'tourism' || ['hotel', 'motel', 'hostel', 'guest_house', 'aerodrome'].includes(osmType)) {
        return {
          category: 'travel',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (['hairdresser', 'beauty', 'laundry', 'dry_cleaning', 'post_office', 'veterinary', 'pet', 'florist', 'locksmith', 'storage_rental'].includes(osmType)) {
        return {
          category: 'general',
          matchedPlaceType: `Online Directory: ${osmType.replace('_', ' ')}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (osmCat === 'shop') {
        return {
          category: 'shopping',
          matchedPlaceType: `Online Directory: ${label}`,
          displayName: hit.display_name || cleanQuery,
        };
      }

      if (osmCat === 'office' || osmCat === 'craft') {
        return {
          category: 'general',
          matchedPlaceType: `Online Directory: ${label}`,
          displayName: hit.display_name || cleanQuery,
        };
      }
    }
  } catch {
    // Ignore network errors in offline environments
  }

  return null;
}
