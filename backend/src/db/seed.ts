import "dotenv/config";
import { db } from "./index";
import {
  users, constituencies, villages, submissions, clusters,
  projects, budgetAllocations, resolutionProofs, kpiSnapshots,
} from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

// Admin credentials are loaded from environment variables.
// Citizen test accounts use passwords from env or defaults for dev only.

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data (reverse FK order)
  await db.execute(sql`TRUNCATE resolution_proofs, kpi_snapshots, budget_allocations, projects, clusters, submissions, villages, users, constituencies CASCADE`);

  // Read admin passwords from env (each admin has their own)
  const adminPasswordDarshit = process.env.ADMIN_PASSWORD_DARSHIT;
  const adminPasswordAaryan = process.env.ADMIN_PASSWORD_AARYAN;
  const adminPasswordDharmik = process.env.ADMIN_PASSWORD_DHARMIK;
  const citizenPassword = process.env.CITIZEN_PASSWORD || "citizen123";

  if (!adminPasswordDarshit || !adminPasswordAaryan || !adminPasswordDharmik) {
    console.error("❌ All admin passwords are required:");
    console.error("   ADMIN_PASSWORD_DARSHIT, ADMIN_PASSWORD_AARYAN, ADMIN_PASSWORD_DHARMIK");
    process.exit(1);
  }

  const hashDarshit = await bcrypt.hash(adminPasswordDarshit, 10);
  const hashAaryan = await bcrypt.hash(adminPasswordAaryan, 10);
  const hashDharmik = await bcrypt.hash(adminPasswordDharmik, 10);
  const passwordCitizen = await bcrypt.hash(citizenPassword, 10);

  // --- CONSTITUENCY ---
  console.log("📍 Creating constituency...");
  const [constituency] = await db.insert(constituencies).values({
    name: "Varanasi",
    state: "Uttar Pradesh",
    district: "Varanasi",
    type: "lok_sabha",
    mpName: "Hon. Rajesh Kumar Singh",
    population: 1998900,
    area: 1535,
    totalVillages: 1642,
    totalWards: 110,
    literacyRate: 72.4,
    avgIncome: 185000,
    developmentIndex: 0.64,
    centerLat: 25.3176,
    centerLng: 82.9739,
  }).returning();

  const CID = constituency.id;

  // --- USERS ---
  console.log("👤 Creating users...");
  const [darshit, aaryan, dharmik, ramesh, sunita] = await db.insert(users).values([
    { email: "darshit@janniti.in", passwordHash: hashDarshit, name: "Darshit Patel", role: "admin", constituencyId: CID, phone: "9876543210", language: "en" },
    { email: "aaryan@janniti.in", passwordHash: hashAaryan, name: "Aaryan Shah", role: "admin", constituencyId: CID, phone: "9876543211", language: "en" },
    { email: "dharmik@janniti.in", passwordHash: hashDharmik, name: "Dharmik Joshi", role: "admin", constituencyId: CID, phone: "9876543212", language: "en" },
    { email: "ramesh.kumar@gmail.com", passwordHash: passwordCitizen, name: "Ramesh Kumar", role: "citizen", constituencyId: CID, phone: "9123456780", language: "hi" },
    { email: "sunita.devi@gmail.com", passwordHash: passwordCitizen, name: "Sunita Devi", role: "citizen", constituencyId: CID, phone: "9123456781", language: "hi" },
  ] as any[]).returning();

  // --- VILLAGES ---
  console.log("🏘️  Creating villages...");
  const villageData = [
    { name: "Ramnagar", block: "Ramnagar", panchayat: "Ramnagar GP", population: 28500, households: 5700, literacyRate: 68.2, scStPopulation: 32.1, lat: 25.2717, lng: 83.0280, infrastructureScore: 0.52, developmentRank: 45 },
    { name: "Sarnath", block: "Sarnath", panchayat: "Sarnath GP", population: 15200, households: 3040, literacyRate: 78.5, scStPopulation: 18.3, lat: 25.3813, lng: 83.0228, infrastructureScore: 0.71, developmentRank: 12 },
    { name: "Cholapur", block: "Cholapur", panchayat: "Cholapur GP", population: 22100, households: 4420, literacyRate: 62.1, scStPopulation: 38.7, lat: 25.4012, lng: 82.9100, infrastructureScore: 0.38, developmentRank: 89 },
    { name: "Pindra", block: "Pindra", panchayat: "Pindra GP", population: 31800, households: 6360, literacyRate: 59.8, scStPopulation: 41.2, lat: 25.2100, lng: 82.8500, infrastructureScore: 0.35, developmentRank: 102 },
    { name: "Harahua", block: "Harahua", panchayat: "Harahua GP", population: 19400, households: 3880, literacyRate: 65.3, scStPopulation: 29.8, lat: 25.1800, lng: 83.0900, infrastructureScore: 0.45, developmentRank: 67 },
    { name: "Kashi Vidyapeeth", block: "City", panchayat: "Ward 42", population: 45200, households: 9040, literacyRate: 82.7, scStPopulation: 15.2, lat: 25.3100, lng: 82.9900, infrastructureScore: 0.78, developmentRank: 5 },
    { name: "Sevapuri", block: "Sevapuri", panchayat: "Sevapuri GP", population: 16800, households: 3360, literacyRate: 61.5, scStPopulation: 35.6, lat: 25.2400, lng: 83.1200, infrastructureScore: 0.41, developmentRank: 78 },
    { name: "Arajiline", block: "Arajiline", panchayat: "Arajiline GP", population: 24600, households: 4920, literacyRate: 64.8, scStPopulation: 33.4, lat: 25.3500, lng: 82.8800, infrastructureScore: 0.44, developmentRank: 71 },
  ];

  const villageRows = await db.insert(villages).values(
    villageData.map(v => ({ ...v, constituencyId: CID }))
  ).returning();

  // Create a lookup map
  const V = Object.fromEntries(villageRows.map(v => [v.name, v.id]));

  // --- CLUSTERS ---
  console.log("🧩 Creating clusters...");
  const clusterRows = await db.insert(clusters).values([
    { constituencyId: CID, name: "Healthcare Access Crisis", sector: "healthcare", submissionCount: 45, avgSentiment: -0.68, avgUrgency: 0.89, trendDirection: "rising", hotspotScore: 92, representativeText: "PHC has no doctors for months", affectedVillages: ["Pindra", "Ramnagar", "Sevapuri"] },
    { constituencyId: CID, name: "Water Supply Emergency", sector: "water_sanitation", submissionCount: 38, avgSentiment: -0.75, avgUrgency: 0.92, trendDirection: "critical", hotspotScore: 95, representativeText: "Water pipeline broken, 5700 households affected", affectedVillages: ["Ramnagar"] },
    { constituencyId: CID, name: "Education Infrastructure Gap", sector: "education", submissionCount: 30, avgSentiment: -0.42, avgUrgency: 0.72, trendDirection: "stable", hotspotScore: 74, representativeText: "School overcrowded, children sit on floor", affectedVillages: ["Cholapur", "Arajiline"] },
    { constituencyId: CID, name: "Flood Protection", sector: "environment", submissionCount: 22, avgSentiment: -0.58, avgUrgency: 0.87, trendDirection: "seasonal", hotspotScore: 85, representativeText: "Every monsoon floods 300 homes", affectedVillages: ["Harahua"] },
    { constituencyId: CID, name: "Rural Connectivity", sector: "roads_transport", submissionCount: 18, avgSentiment: -0.45, avgUrgency: 0.68, trendDirection: "stable", hotspotScore: 70, representativeText: "Road damaged, ambulances cannot pass", affectedVillages: ["Harahua", "Sevapuri"] },
    { constituencyId: CID, name: "Digital Divide", sector: "energy_digital", submissionCount: 12, avgSentiment: -0.35, avgUrgency: 0.55, trendDirection: "stable", hotspotScore: 58, representativeText: "No mobile network in 5km radius", affectedVillages: ["Arajiline", "Pindra"] },
    { constituencyId: CID, name: "Agricultural Infrastructure", sector: "agriculture", submissionCount: 15, avgSentiment: -0.48, avgUrgency: 0.82, trendDirection: "seasonal", hotspotScore: 78, representativeText: "Irrigation canal blocked, crops at risk", affectedVillages: ["Sevapuri", "Pindra"] },
    { constituencyId: CID, name: "Youth Employment", sector: "skill_youth", submissionCount: 14, avgSentiment: 0.15, avgUrgency: 0.42, trendDirection: "stable", hotspotScore: 45, representativeText: "Need vocational training center", affectedVillages: ["Sarnath", "Kashi Vidyapeeth"] },
  ] as any[]).returning();

  const C = Object.fromEntries(clusterRows.map(c => [c.name, c.id]));

  // --- SUBMISSIONS (110 total) ---
  console.log("📝 Creating 110 submissions...");

  const sectors = ["education","healthcare","water_sanitation","roads_transport","agriculture","energy_digital","housing","environment","social_welfare","skill_youth"] as const;
  const channels = ["web","whatsapp","sms","voice","offline","mobile_app"] as const;
  const statuses = ["pending","verified","clustered","prioritized","in_progress","completed","rejected"] as const;

  // Helper to generate dates spread over last 6 months
  const randomDate = (daysBack: number) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    return d;
  };

  // Curated first 20 submissions (consistent with projects/resolutions)
  const curatedSubmissions = [
    { title: "PHC lacks doctors and essential medicines", description: "Primary Health Centre in Pindra has no doctor for 6 months. Only one nurse available. No basic medicines. Patients travel 25km to district hospital.", sector: "healthcare", village: "Pindra", cluster: "Healthcare Access Crisis", sentiment: -0.65, urgency: 0.92, status: "completed", channel: "whatsapp", upvotes: 287, citizen: ramesh.id },
    { title: "Water pipeline broken for 3 weeks – Ramnagar", description: "Main water supply pipeline broke 3 weeks ago. 5700 households without clean water. Buying tanker water at ₹500/day.", sector: "water_sanitation", village: "Ramnagar", cluster: "Water Supply Emergency", sentiment: -0.82, urgency: 0.95, status: "completed", channel: "sms", upvotes: 198, citizen: sunita.id },
    { title: "Primary school needs additional classrooms", description: "Village primary school has only 3 classrooms for 450 students. Children sit on floor, no ventilation. Need 4 more classrooms.", sector: "education", village: "Cholapur", cluster: "Education Infrastructure Gap", sentiment: -0.3, urgency: 0.78, status: "prioritized", channel: "web", upvotes: 142, citizen: ramesh.id },
    { title: "Road between Harahua and Sevapuri badly damaged", description: "Road completely damaged. During monsoon ambulances cannot pass. Pregnant woman had to be carried 5km.", sector: "roads_transport", village: "Harahua", cluster: "Rural Connectivity", sentiment: -0.45, urgency: 0.7, status: "in_progress", channel: "voice", upvotes: 89, citizen: sunita.id },
    { title: "Irrigation canal needs repair before Rabi season", description: "Main irrigation canal serving 2000 hectares is blocked with silt. Farmers will lose Rabi crop if not cleared.", sector: "agriculture", village: "Sevapuri", cluster: "Agricultural Infrastructure", sentiment: -0.5, urgency: 0.85, status: "verified", channel: "web", upvotes: 156, citizen: ramesh.id },
    { title: "No mobile network in 5km radius – Arajiline", description: "Arajiline and surrounding 3 villages have no mobile network. Students cannot access online education.", sector: "energy_digital", village: "Arajiline", cluster: "Digital Divide", sentiment: -0.4, urgency: 0.6, status: "pending", channel: "offline", upvotes: 67, citizen: sunita.id },
    { title: "Anganwadi center building is dilapidated", description: "Anganwadi center roof leaking, walls cracked. 85 children at risk. Building may collapse during monsoon.", sector: "social_welfare", village: "Cholapur", cluster: "Education Infrastructure Gap", sentiment: -0.55, urgency: 0.75, status: "completed", channel: "web", upvotes: 112, citizen: ramesh.id },
    { title: "Solar street lights not working – Pindra", description: "20 solar street lights installed 2 years ago. 18 now non-functional. No maintenance. Village dark at night.", sector: "energy_digital", village: "Pindra", cluster: "Digital Divide", sentiment: -0.35, urgency: 0.5, status: "completed", channel: "whatsapp", upvotes: 45, citizen: sunita.id },
    { title: "Request for vocational training center – Sarnath", description: "Youth unemployment high. Many want to learn skills but nearest ITI is 45km away. Need welding, electrician courses.", sector: "skill_youth", village: "Sarnath", cluster: "Youth Employment", sentiment: 0.2, urgency: 0.4, status: "in_progress", channel: "web", upvotes: 203, citizen: ramesh.id },
    { title: "Community health center needs upgrade – Ramnagar", description: "CHC building old, no ICU, no operation theater. Serious cases referred to Varanasi, many die on the way.", sector: "healthcare", village: "Ramnagar", cluster: "Healthcare Access Crisis", sentiment: -0.7, urgency: 0.88, status: "verified", channel: "mobile_app", upvotes: 321, citizen: sunita.id },
    { title: "Flood protection wall urgently needed – Harahua", description: "Every monsoon Ganga floods 300 homes. Lost 2 lives last year. Need permanent embankment.", sector: "environment", village: "Harahua", cluster: "Flood Protection", sentiment: -0.6, urgency: 0.9, status: "prioritized", channel: "web", upvotes: 278, citizen: ramesh.id },
    { title: "PM Awas Yojana houses incomplete – Kashi Vidyapeeth", description: "50 PMAY houses sanctioned 2 years ago. Only foundations completed. Beneficiaries in temporary shelters.", sector: "housing", village: "Kashi Vidyapeeth", cluster: "Healthcare Access Crisis", sentiment: -0.5, urgency: 0.55, status: "pending", channel: "web", upvotes: 94, citizen: sunita.id },
    { title: "Drainage overflow during rains – Sarnath", description: "Drain near main market overflows every rain. Raw sewage on streets. Health hazard for 5000 residents.", sector: "water_sanitation", village: "Sarnath", cluster: "Water Supply Emergency", sentiment: -0.6, urgency: 0.7, status: "verified", channel: "whatsapp", upvotes: 88, citizen: ramesh.id },
    { title: "Electric poles tilting dangerously – Sevapuri", description: "5 electric poles near school tilting at 45 degrees. Children pass daily. One already fell last month.", sector: "energy_digital", village: "Sevapuri", cluster: "Rural Connectivity", sentiment: -0.7, urgency: 0.88, status: "verified", channel: "mobile_app", upvotes: 134, citizen: sunita.id },
    { title: "Need playground for children – Arajiline", description: "No playground in village. Children play on road, 2 accidents this year. Request open space development.", sector: "skill_youth", village: "Arajiline", cluster: "Youth Employment", sentiment: -0.2, urgency: 0.35, status: "pending", channel: "web", upvotes: 56, citizen: ramesh.id },
    { title: "Mid-day meal quality poor – Cholapur school", description: "Children getting sick after mid-day meals. Rice has insects. No proper kitchen facility.", sector: "education", village: "Cholapur", cluster: "Education Infrastructure Gap", sentiment: -0.8, urgency: 0.85, status: "clustered", channel: "voice", upvotes: 178, citizen: sunita.id },
    { title: "Public toilet facility needed near market – Ramnagar", description: "No public toilet in market area. 10000 daily visitors. Open defecation increasing.", sector: "water_sanitation", village: "Ramnagar", cluster: "Water Supply Emergency", sentiment: -0.5, urgency: 0.6, status: "pending", channel: "sms", upvotes: 72, citizen: ramesh.id },
    { title: "Hand pump water contaminated – Pindra", description: "Iron content very high in hand pump water. Yellow color. 200 families affected. Skin diseases spreading.", sector: "water_sanitation", village: "Pindra", cluster: "Water Supply Emergency", sentiment: -0.7, urgency: 0.8, status: "verified", channel: "whatsapp", upvotes: 145, citizen: sunita.id },
    { title: "Bus service discontinued – Harahua to Varanasi", description: "Only bus service connecting Harahua to city cancelled 3 months ago. 500 daily commuters stranded.", sector: "roads_transport", village: "Harahua", cluster: "Rural Connectivity", sentiment: -0.55, urgency: 0.65, status: "clustered", channel: "web", upvotes: 167, citizen: ramesh.id },
    { title: "Scholarship information not reaching students", description: "Government scholarships available but no awareness campaign. SC/ST students missing deadlines.", sector: "social_welfare", village: "Pindra", cluster: "Education Infrastructure Gap", sentiment: -0.3, urgency: 0.5, status: "pending", channel: "offline", upvotes: 98, citizen: sunita.id },
  ];

  // Generate 90 more submissions programmatically
  const moreSubmissions: typeof curatedSubmissions = [];
  const problemTemplates = [
    { t: "Broken hand pump – {v}", d: "Hand pump in {v} not working for {n} days. {h} families fetch water from 2km away.", s: "water_sanitation", c: "Water Supply Emergency" },
    { t: "Street light not working near {v} chowk", d: "Street lights at main chowk in {v} are off for {n} weeks. Women feel unsafe at night.", s: "energy_digital", c: "Digital Divide" },
    { t: "Pothole-ridden road in {v}", d: "Main road through {v} has {n} large potholes. Two-wheelers skid regularly. 3 accidents this month.", s: "roads_transport", c: "Rural Connectivity" },
    { t: "School boundary wall collapsed – {v}", d: "Boundary wall of government school in {v} collapsed. Children enter from open side near busy road.", s: "education", c: "Education Infrastructure Gap" },
    { t: "Stray cattle menace – {v}", d: "Over {n} stray cattle roaming streets of {v}. Destroying crops and blocking roads. 2 people injured.", s: "agriculture", c: "Agricultural Infrastructure" },
    { t: "Overflowing garbage dump – {v}", d: "Garbage not collected for {n} weeks in {v}. Dump overflowing near residential area. Mosquito breeding.", s: "environment", c: "Flood Protection" },
    { t: "PHC medicine shortage – {v}", d: "PHC in {v} has no fever medicine, no antibiotics for {n} weeks. Patients turned away.", s: "healthcare", c: "Healthcare Access Crisis" },
    { t: "Wifi/internet connectivity issue – {v}", d: "CSC center in {v} has no internet for {n} days. 50 pending Aadhaar applications stuck.", s: "energy_digital", c: "Digital Divide" },
    { t: "Leaking water tank – {v}", d: "Overhead water tank in {v} leaking from 3 sides. Wasting {n}000 liters daily. Built only 2 years ago.", s: "water_sanitation", c: "Water Supply Emergency" },
    { t: "Need bridge over nala – {v}", d: "Nala between two parts of {v} has no bridge. During rains children cannot reach school. {n} families affected.", s: "roads_transport", c: "Rural Connectivity" },
    { t: "Ration shop irregularities – {v}", d: "Fair price shop in {v} opens only {n} days a month. Dealer sells grain in black market.", s: "social_welfare", c: "Healthcare Access Crisis" },
    { t: "Broken transformer – {v}", d: "Transformer in {v} burnt {n} days ago. 300 houses without electricity. Crops drying without irrigation pump.", s: "energy_digital", c: "Agricultural Infrastructure" },
    { t: "Teacher shortage in primary school – {v}", d: "Only {n} teacher for 5 classes in {v} primary school. 200 students getting no education.", s: "education", c: "Education Infrastructure Gap" },
    { t: "Need ambulance service – {v}", d: "Nearest ambulance 30km from {v}. Last month a snakebite patient died waiting. Population {n}000.", s: "healthcare", c: "Healthcare Access Crisis" },
    { t: "Youth demand sports ground – {v}", d: "{n} young people in {v} have nowhere to play. Request conversion of unused govt land to playground.", s: "skill_youth", c: "Youth Employment" },
  ];

  const villageNames = Object.keys(V);
  const citizens = [ramesh.id, sunita.id];

  for (let i = 0; i < 90; i++) {
    const tmpl = problemTemplates[i % problemTemplates.length];
    const villageName = villageNames[i % villageNames.length];
    const n = Math.floor(Math.random() * 20) + 3;
    const h = Math.floor(Math.random() * 500) + 50;

    moreSubmissions.push({
      title: tmpl.t.replace("{v}", villageName),
      description: tmpl.d.replace("{v}", villageName).replace("{n}", String(n)).replace("{h}", String(h)),
      sector: tmpl.s as any,
      village: villageName,
      cluster: tmpl.c,
      sentiment: -(Math.random() * 0.7 + 0.1),
      urgency: Math.random() * 0.6 + 0.3,
      status: statuses[Math.floor(Math.random() * 5)] as any, // skip completed/rejected for generated
      channel: channels[Math.floor(Math.random() * channels.length)] as any,
      upvotes: Math.floor(Math.random() * 200) + 5,
      citizen: citizens[i % 2],
    });
  }

  const allSubmissionData = [...curatedSubmissions, ...moreSubmissions];

  const submissionRows = await db.insert(submissions).values(
    allSubmissionData.map((s, idx) => ({
      citizenId: s.citizen,
      constituencyId: CID,
      villageId: V[s.village],
      channel: s.channel as any,
      status: s.status as any,
      originalText: s.description,
      translatedText: s.description,
      originalLanguage: "hi",
      title: s.title,
      description: s.description,
      sector: s.sector as any,
      category: s.sector,
      sentimentScore: s.sentiment,
      sentimentLabel: s.sentiment < -0.5 ? "very_negative" : s.sentiment < -0.2 ? "negative" : s.sentiment < 0.2 ? "neutral" : "positive",
      urgencyScore: s.urgency,
      impactScore: Math.random() * 0.5 + 0.4,
      clusterId: C[s.cluster] ?? null,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      topics: [s.sector, s.village.toLowerCase()],
      keywords: s.title.split(" ").slice(0, 5),
      lat: (villageData.find(vd => vd.name === s.village)?.lat ?? 25.3) + (Math.random() - 0.5) * 0.02,
      lng: (villageData.find(vd => vd.name === s.village)?.lng ?? 83.0) + (Math.random() - 0.5) * 0.02,
      address: `${s.village}, Varanasi, Uttar Pradesh`,
      upvotes: s.upvotes,
      createdAt: randomDate(180),
    }))
  ).returning();

  console.log(`   ✅ ${submissionRows.length} submissions created`);

  // Build submission lookup by title (for linking resolutions)
  const SUB = Object.fromEntries(submissionRows.map(s => [s.title!, s.id]));

  // --- PROJECTS ---
  console.log("🏗️  Creating projects...");
  const projectRows = await db.insert(projects).values([
    { constituencyId: CID, title: "PHC Upgrade & Staffing – Pindra Block", description: "Upgrade Pindra PHC to 30-bed facility with 2 MBBS doctors, 4 nurses, essential equipment.", sector: "healthcare", status: "approved", priority: "critical", aiPriorityScore: 94.2, estimatedCost: 4500000, allocatedBudget: 4500000, estimatedBeneficiaries: 31800, completionPercentage: 15, sdgGoals: [3, 10], demandScore: 92, feasibilityScore: 85, socialImpactScore: 96, environmentalImpactScore: 72, infrastructureGapScore: 88, linkedSubmissionCount: 45, villageIds: [V["Pindra"], V["Sevapuri"]] },
    { constituencyId: CID, title: "Water Supply Network Restoration – Ramnagar", description: "Complete rehabilitation of 15km water pipeline. Install 3 tube wells, overhead tank 50,000L.", sector: "water_sanitation", status: "completed", priority: "critical", aiPriorityScore: 91.8, estimatedCost: 3200000, allocatedBudget: 3200000, estimatedBeneficiaries: 28500, completionPercentage: 100, sdgGoals: [6, 11], demandScore: 88, feasibilityScore: 90, socialImpactScore: 94, environmentalImpactScore: 80, infrastructureGapScore: 92, linkedSubmissionCount: 67, villageIds: [V["Ramnagar"]] },
    { constituencyId: CID, title: "Flood Protection Embankment – Harahua", description: "Construct 2.5km reinforced concrete embankment along Ganga river.", sector: "environment", status: "proposed", priority: "high", aiPriorityScore: 87.5, estimatedCost: 8500000, allocatedBudget: 0, estimatedBeneficiaries: 19400, completionPercentage: 0, sdgGoals: [11, 13], demandScore: 85, feasibilityScore: 72, socialImpactScore: 90, environmentalImpactScore: 88, infrastructureGapScore: 78, linkedSubmissionCount: 42, villageIds: [V["Harahua"]] },
    { constituencyId: CID, title: "Model School Construction – Cholapur", description: "New 12-classroom school with lab, computer room, library, playground.", sector: "education", status: "approved", priority: "high", aiPriorityScore: 85.1, estimatedCost: 6200000, allocatedBudget: 5000000, estimatedBeneficiaries: 22100, completionPercentage: 8, sdgGoals: [4, 5, 10], demandScore: 78, feasibilityScore: 88, socialImpactScore: 92, environmentalImpactScore: 65, infrastructureGapScore: 85, linkedSubmissionCount: 23, villageIds: [V["Cholapur"], V["Arajiline"]] },
    { constituencyId: CID, title: "Irrigation Canal Renovation – Sevapuri", description: "Dredge and line 8km canal. Install 5 water regulation gates, solar pumping.", sector: "agriculture", status: "proposed", priority: "high", aiPriorityScore: 82.3, estimatedCost: 5800000, allocatedBudget: 0, estimatedBeneficiaries: 16800, completionPercentage: 0, sdgGoals: [2, 12], demandScore: 80, feasibilityScore: 82, socialImpactScore: 85, environmentalImpactScore: 75, infrastructureGapScore: 80, linkedSubmissionCount: 28, villageIds: [V["Sevapuri"], V["Pindra"]] },
    { constituencyId: CID, title: "4G Mobile Tower – Arajiline Cluster", description: "Install 4G tower with 10km coverage. BharatNet backhaul + community digital center.", sector: "energy_digital", status: "proposed", priority: "medium", aiPriorityScore: 71.4, estimatedCost: 2500000, allocatedBudget: 0, estimatedBeneficiaries: 24600, completionPercentage: 0, sdgGoals: [9, 4], demandScore: 62, feasibilityScore: 92, socialImpactScore: 70, environmentalImpactScore: 55, infrastructureGapScore: 75, linkedSubmissionCount: 15, villageIds: [V["Arajiline"]] },
    { constituencyId: CID, title: "Road Widening – Harahua-Sevapuri Link", description: "Widen 12km road to 5.5m with bituminous surface, drainage, solar lights.", sector: "roads_transport", status: "in_progress", priority: "medium", aiPriorityScore: 76.8, estimatedCost: 7200000, allocatedBudget: 7200000, estimatedBeneficiaries: 36200, completionPercentage: 55, sdgGoals: [9, 11], demandScore: 72, feasibilityScore: 85, socialImpactScore: 78, environmentalImpactScore: 60, infrastructureGapScore: 82, linkedSubmissionCount: 34, villageIds: [V["Harahua"], V["Sevapuri"]] },
    { constituencyId: CID, title: "Vocational Training Center – Sarnath", description: "ITI-affiliated center: welding, electrician, plumbing, tailoring, computers. 200/batch.", sector: "skill_youth", status: "in_progress", priority: "medium", aiPriorityScore: 74.2, estimatedCost: 3800000, allocatedBudget: 3800000, estimatedBeneficiaries: 15200, completionPercentage: 25, sdgGoals: [4, 8], demandScore: 68, feasibilityScore: 90, socialImpactScore: 82, environmentalImpactScore: 50, infrastructureGapScore: 65, linkedSubmissionCount: 31, villageIds: [V["Sarnath"], V["Kashi Vidyapeeth"]] },
    { constituencyId: CID, title: "Anganwadi Center Reconstruction – Cholapur", description: "Complete rebuild of dilapidated Anganwadi. New roof, kitchen, toilet, play area.", sector: "social_welfare", status: "completed", priority: "medium", aiPriorityScore: 72.5, estimatedCost: 450000, allocatedBudget: 450000, estimatedBeneficiaries: 4420, completionPercentage: 100, sdgGoals: [1, 2, 4], demandScore: 65, feasibilityScore: 95, socialImpactScore: 88, environmentalImpactScore: 55, infrastructureGapScore: 70, linkedSubmissionCount: 12, villageIds: [V["Cholapur"]] },
    { constituencyId: CID, title: "Solar Street Light Repair – Pindra", description: "Repair 18 non-functional solar street lights. Replace batteries and panels. 3-year AMC.", sector: "energy_digital", status: "completed", priority: "low", aiPriorityScore: 58.4, estimatedCost: 180000, allocatedBudget: 180000, estimatedBeneficiaries: 6360, completionPercentage: 100, sdgGoals: [7, 11], demandScore: 45, feasibilityScore: 95, socialImpactScore: 60, environmentalImpactScore: 70, infrastructureGapScore: 50, linkedSubmissionCount: 8, villageIds: [V["Pindra"]] },
  ] as any[]).returning();

  const P = Object.fromEntries(projectRows.map(p => [p.title, p.id]));
  console.log(`   ✅ ${projectRows.length} projects created`);

  // --- RESOLUTION PROOFS (linked to specific submissions + projects) ---
  console.log("✅ Creating resolution proofs...");
  await db.insert(resolutionProofs).values([
    {
      submissionId: SUB["Water pipeline broken for 3 weeks – Ramnagar"],
      projectId: P["Water Supply Network Restoration – Ramnagar"],
      resolvedBy: darshit.id,
      resolutionType: "full",
      description: "15km pipeline fully restored. 3 new tube wells installed. Overhead tank of 50,000L capacity added. All 5700 households now have running water.",
      photos: ["https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/water_pipe_1.jpg", "https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/water_pipe_2.jpg", "https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/water_tank.jpg"],
      documents: ["https://res.cloudinary.com/demo/raw/upload/v1/janniti/resolutions/completion_cert_water.pdf"],
      budgetUsed: 3150000,
      percentageResolved: 100,
      contractorName: "M/s Kumar Infrastructure Pvt Ltd",
      departmentName: "PWD Varanasi Division",
      workOrderNumber: "WO/VAR/2026/0087",
      completionDate: new Date("2026-01-18"),
      verifiedBy: aaryan.id,
      verifiedAt: new Date("2026-01-20"),
      citizenFeedback: "Very happy with the work. Water quality is good now.",
      citizenRating: 4.5,
    },
    {
      submissionId: SUB["PHC lacks doctors and essential medicines"],
      projectId: P["PHC Upgrade & Staffing – Pindra Block"],
      resolvedBy: aaryan.id,
      resolutionType: "partial",
      description: "2 MBBS doctors posted. Basic medicines stocked for 3 months. X-ray machine installed. Still pending: ECG machine and 2 additional nurses.",
      photos: ["https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/phc_doctors.jpg", "https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/phc_medicines.jpg"],
      documents: ["https://res.cloudinary.com/demo/raw/upload/v1/janniti/resolutions/doctor_posting_order.pdf"],
      budgetUsed: 2800000,
      percentageResolved: 65,
      contractorName: "District Health Department",
      departmentName: "NHM Varanasi",
      workOrderNumber: "NHM/VAR/2026/0034",
      completionDate: new Date("2026-02-05"),
      verifiedBy: dharmik.id,
      verifiedAt: new Date("2026-02-07"),
      citizenFeedback: "Doctors are available now but still no ECG. Better than before.",
      citizenRating: 3.8,
    },
    {
      submissionId: SUB["Anganwadi center building is dilapidated"],
      projectId: P["Anganwadi Center Reconstruction – Cholapur"],
      resolvedBy: dharmik.id,
      resolutionType: "full",
      description: "Complete roof replacement, wall repair, new flooring. Added kitchen with gas connection, toilet block with running water, and small play area for children.",
      photos: ["https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/anganwadi_new.jpg", "https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/anganwadi_kitchen.jpg"],
      documents: ["https://res.cloudinary.com/demo/raw/upload/v1/janniti/resolutions/anganwadi_completion.pdf"],
      budgetUsed: 430000,
      percentageResolved: 100,
      contractorName: "M/s Nirmaan Constructions",
      departmentName: "Women & Child Development Dept",
      workOrderNumber: "WCD/VAR/2025/0156",
      completionDate: new Date("2026-01-25"),
      verifiedBy: darshit.id,
      verifiedAt: new Date("2026-01-27"),
      citizenFeedback: "Building is excellent now. Children are safe and happy.",
      citizenRating: 5.0,
    },
    {
      submissionId: SUB["Solar street lights not working – Pindra"],
      projectId: P["Solar Street Light Repair – Pindra"],
      resolvedBy: darshit.id,
      resolutionType: "full",
      description: "18 out of 20 solar lights repaired. Batteries and panels replaced. 3-year AMC signed with vendor. 2 lights beyond repair – new ones ordered.",
      photos: ["https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/streetlight_1.jpg", "https://res.cloudinary.com/demo/image/upload/v1/janniti/resolutions/streetlight_night.jpg"],
      documents: ["https://res.cloudinary.com/demo/raw/upload/v1/janniti/resolutions/amc_contract_solar.pdf"],
      budgetUsed: 175000,
      percentageResolved: 90,
      contractorName: "M/s SolarTech Solutions",
      departmentName: "Energy Department, UP",
      workOrderNumber: "ED/VAR/2026/0012",
      completionDate: new Date("2026-01-22"),
      verifiedBy: aaryan.id,
      verifiedAt: new Date("2026-01-24"),
      citizenFeedback: "Most lights working now. Women feel safer at night.",
      citizenRating: 4.2,
    },
  ] as any[]);
  console.log("   ✅ 4 resolution proofs created");

  // --- BUDGET ALLOCATIONS ---
  console.log("💰 Creating budget allocations...");
  await db.insert(budgetAllocations).values([
    {
      constituencyId: CID,
      financialYear: "2025-26",
      totalMplads: 50000000,
      allocated: 35200000,
      spent: 24700000,
      sectorBreakdown: {
        healthcare: { allocated: 7500000, spent: 5800000 },
        water_sanitation: { allocated: 6200000, spent: 4900000 },
        education: { allocated: 6500000, spent: 5000000 },
        roads_transport: { allocated: 7200000, spent: 5500000 },
        agriculture: { allocated: 3000000, spent: 1500000 },
        digital_infra: { allocated: 2500000, spent: 1000000 },
        energy: { allocated: 1500000, spent: 700000 },
        social_welfare: { allocated: 800000, spent: 300000 },
      },
    },
    {
      constituencyId: CID,
      financialYear: "2024-25",
      totalMplads: 50000000,
      allocated: 48000000,
      spent: 45200000,
      sectorBreakdown: {
        healthcare: { allocated: 9000000, spent: 8800000 },
        water_sanitation: { allocated: 8500000, spent: 8200000 },
        education: { allocated: 8000000, spent: 7500000 },
        roads_transport: { allocated: 10000000, spent: 9800000 },
        agriculture: { allocated: 5000000, spent: 4500000 },
        digital_infra: { allocated: 3500000, spent: 3000000 },
        energy: { allocated: 2000000, spent: 1800000 },
        social_welfare: { allocated: 2000000, spent: 1600000 },
      },
    },
  ] as any[]);

  // --- KPI SNAPSHOTS ---
  console.log("📊 Creating KPI snapshots...");
  const months = [6, 5, 4, 3, 2, 1, 0];
  await db.insert(kpiSnapshots).values(
    months.map(m => {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const base = 3800 + m * 80;
      return {
        constituencyId: CID,
        snapshotDate: d,
        totalSubmissions: base + Math.floor(Math.random() * 100),
        resolvedSubmissions: Math.floor(base * 0.65) + Math.floor(Math.random() * 50),
        activeProjects: 8 + Math.floor(Math.random() * 5),
        completedProjects: 28 + m * 1,
        totalBudgetUsed: 180000000 + m * 5000000,
        citizenSatisfaction: 68 + Math.random() * 8,
        avgResponseTime: 4.5 - m * 0.1 + Math.random() * 0.5,
        topSectors: ["healthcare", "water_sanitation", "education"],
        metrics: { aiAccuracy: 93 + Math.random() * 3, languagesProcessed: 8 },
      };
    })
  );
  console.log("   ✅ 7 KPI snapshots created");

  // --- DONE ---
  console.log("\n🎉 Seed complete!\n");
  console.log("📈 Data Summary:");
  console.log(`   • 1 constituency (Varanasi)`);
  console.log(`   • 8 villages`);
  console.log(`   • 5 users (3 admin + 2 citizen)`);
  console.log(`   • 8 AI clusters`);
  console.log(`   • ${submissionRows.length} submissions`);
  console.log(`   • ${projectRows.length} projects`);
  console.log(`   • 4 resolution proofs`);
  console.log(`   • 2 budget allocations`);
  console.log(`   • 7 KPI snapshots`);
  console.log("\n👤 Admin emails: darshit@janniti.in, aaryan@janniti.in, dharmik@janniti.in");
  console.log("👤 Citizen emails: ramesh.kumar@gmail.com, sunita.devi@gmail.com");
  console.log("🔑 Passwords were set from ADMIN_PASSWORD and CITIZEN_PASSWORD env vars.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
