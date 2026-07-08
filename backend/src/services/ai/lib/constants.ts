// JanNiti AI Platform Constants

export const APP_NAME = "JanNiti AI";
export const APP_TAGLINE = "AI-Powered Constituency Intelligence";
export const APP_VERSION = "2.5.0";

export const DEMO_CONSTITUENCY = {
  id: "c1000001-0000-0000-0000-000000000001",
  name: "Varanasi",
  state: "Uttar Pradesh",
  district: "Varanasi",
  type: "lok_sabha",
  mpName: "Hon. Rajesh Kumar Singh",
  mpParty: "Independent",
  population: 1998900,
  area: 1535,
  totalVillages: 1642,
  totalWards: 110,
  literacyRate: 72.4,
  avgIncome: 185000,
  developmentIndex: 0.64,
  healthScore: 68.5,
  educationScore: 71.2,
  infraScore: 58.4,
  waterScore: 62.8,
  digitalScore: 45.2,
  centerLat: 25.3176,
  centerLng: 82.9739,
};

export const SDG_GOALS = [
  { id: 1, name: "No Poverty", color: "#E5243B" },
  { id: 2, name: "Zero Hunger", color: "#DDA63A" },
  { id: 3, name: "Good Health", color: "#4C9F38" },
  { id: 4, name: "Quality Education", color: "#C5192D" },
  { id: 5, name: "Gender Equality", color: "#FF3A21" },
  { id: 6, name: "Clean Water", color: "#26BDE2" },
  { id: 7, name: "Clean Energy", color: "#FCC30B" },
  { id: 8, name: "Decent Work", color: "#A21942" },
  { id: 9, name: "Infrastructure", color: "#FD6925" },
  { id: 10, name: "Reduced Inequalities", color: "#DD1367" },
  { id: 11, name: "Sustainable Cities", color: "#FD9D24" },
  { id: 12, name: "Responsible Consumption", color: "#BF8B2E" },
  { id: 13, name: "Climate Action", color: "#3F7E44" },
  { id: 14, name: "Life Below Water", color: "#0A97D9" },
  { id: 15, name: "Life on Land", color: "#56C02B" },
  { id: 16, name: "Peace & Justice", color: "#00689D" },
  { id: 17, name: "Partnerships", color: "#19486A" },
];

export const GOVT_SCHEMES = [
  { id: "mplads", name: "MPLADS", ministry: "MoSPI", maxFunding: 50000000 },
  { id: "pmay", name: "PM Awas Yojana", ministry: "MoHUA", maxFunding: 150000 },
  { id: "pmgsy", name: "PM Gram Sadak Yojana", ministry: "MoRD", maxFunding: 10000000 },
  { id: "jjm", name: "Jal Jeevan Mission", ministry: "MoJS", maxFunding: 50000000 },
  { id: "pmksy", name: "PM Krishi Sinchayee Yojana", ministry: "MoA", maxFunding: 20000000 },
  { id: "samagra", name: "Samagra Shiksha", ministry: "MoE", maxFunding: 25000000 },
  { id: "nhm", name: "National Health Mission", ministry: "MoHFW", maxFunding: 30000000 },
  { id: "ddugjy", name: "DDUGJY", ministry: "MoP", maxFunding: 15000000 },
  { id: "bharatnet", name: "BharatNet", ministry: "MoC", maxFunding: 20000000 },
  { id: "swachh", name: "Swachh Bharat Mission", ministry: "MoJS", maxFunding: 10000000 },
];

export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
];

export const SECTORS = [
  { id: "healthcare", name: "Healthcare", icon: "Stethoscope", color: "#EF4444" },
  { id: "education", name: "Education", icon: "GraduationCap", color: "#3B82F6" },
  { id: "water_sanitation", name: "Water & Sanitation", icon: "Droplets", color: "#06B6D4" },
  { id: "roads_transport", name: "Roads & Transport", icon: "Truck", color: "#8B5CF6" },
  { id: "agriculture", name: "Agriculture", icon: "Wheat", color: "#22C55E" },
  { id: "energy_digital", name: "Energy & Digital", icon: "Zap", color: "#F97316" },
  { id: "housing", name: "Housing", icon: "Home", color: "#F59E0B" },
  { id: "environment", name: "Environment", icon: "TreePine", color: "#10B981" },
  { id: "social_welfare", name: "Social Welfare", icon: "Heart", color: "#EC4899" },
  { id: "skill_youth", name: "Skill & Youth", icon: "Briefcase", color: "#14B8A6" },
];

export const AI_CAPABILITIES = [
  "Multilingual Speech-to-Text (22 Indian languages)",
  "Real-time Translation via Bhashini API",
  "OCR for Document Scanning",
  "Image Understanding & Analysis",
  "Semantic Clustering & Duplicate Detection",
  "Sentiment & Urgency Analysis",
  "Topic Extraction & Classification",
  "Spam & Abuse Detection",
  "Geolocation Inference",
  "Demand Forecasting",
  "Infrastructure Gap Analysis",
  "Project Recommendation Engine",
  "Explainable AI Prioritization",
  "Budget Optimization",
  "Scheme Eligibility Matching",
  "Conversational AI Copilot",
];
