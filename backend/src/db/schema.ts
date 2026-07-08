import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  real,
  serial,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";

// Custom vector type for pgvector extension
const vector = customType<{ data: number[]; dpiType: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      return value
        .slice(1, -1)
        .split(",")
        .map(Number);
    }
    return value as number[];
  },
});

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "citizen",
  "mp",
  "admin",
  "department",
  "analyst",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "verified",
  "clustered",
  "prioritized",
  "in_progress",
  "completed",
  "rejected",
]);

export const submissionChannelEnum = pgEnum("submission_channel", [
  "web",
  "whatsapp",
  "sms",
  "voice",
  "offline",
  "mobile_app",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "proposed",
  "approved",
  "in_progress",
  "completed",
  "on_hold",
  "cancelled",
]);

export const priorityLevelEnum = pgEnum("priority_level", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const sectorEnum = pgEnum("sector", [
  "education",
  "healthcare",
  "water_sanitation",
  "roads_transport",
  "agriculture",
  "energy_digital",
  "housing",
  "environment",
  "social_welfare",
  "skill_youth",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default("citizen"),
  constituencyId: uuid("constituency_id").references(() => constituencies.id),
  avatarUrl: text("avatar_url"),
  language: varchar("language", { length: 10 }).default("en"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Constituencies
export const constituencies = pgTable("constituencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).default("lok_sabha"),
  mpName: varchar("mp_name", { length: 255 }),
  population: integer("population"),
  area: real("area"),
  totalVillages: integer("total_villages"),
  totalWards: integer("total_wards"),
  literacyRate: real("literacy_rate"),
  avgIncome: real("avg_income"),
  developmentIndex: real("development_index"),
  centerLat: real("center_lat"),
  centerLng: real("center_lng"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Villages/Wards
export const villages = pgTable("villages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  block: varchar("block", { length: 255 }),
  panchayat: varchar("panchayat", { length: 255 }),
  population: integer("population"),
  households: integer("households"),
  literacyRate: real("literacy_rate"),
  scStPopulation: real("sc_st_population"),
  lat: real("lat"),
  lng: real("lng"),
  infrastructureScore: real("infrastructure_score"),
  developmentRank: integer("development_rank"),
  metadata: jsonb("metadata"),
});

// Citizen Submissions
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  citizenId: uuid("citizen_id").references(() => users.id),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  villageId: uuid("village_id").references(() => villages.id),
  channel: submissionChannelEnum("channel").notNull().default("web"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  originalText: text("original_text"),
  translatedText: text("translated_text"),
  originalLanguage: varchar("original_language", { length: 10 }),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  sector: sectorEnum("sector"),
  category: varchar("category", { length: 255 }),
  subCategory: varchar("sub_category", { length: 255 }),
  sentimentScore: real("sentiment_score"),
  sentimentLabel: varchar("sentiment_label", { length: 50 }),
  urgencyScore: real("urgency_score"),
  impactScore: real("impact_score"),
  clusterId: uuid("cluster_id"),
  isDuplicate: boolean("is_duplicate").default(false),
  duplicateOfId: uuid("duplicate_of_id"),
  isSpam: boolean("is_spam").default(false),
  spamScore: real("spam_score"),
  topics: jsonb("topics"),
  keywords: jsonb("keywords"),
  attachments: jsonb("attachments"),
  lat: real("lat"),
  lng: real("lng"),
  address: text("address"),
  upvotes: integer("upvotes").default(0),
  embedding: vector("embedding"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Clusters
export const clusters = pgTable("clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  sector: sectorEnum("sector"),
  submissionCount: integer("submission_count").default(0),
  avgSentiment: real("avg_sentiment"),
  avgUrgency: real("avg_urgency"),
  trendDirection: varchar("trend_direction", { length: 20 }),
  hotspotScore: real("hotspot_score"),
  representativeText: text("representative_text"),
  topics: jsonb("topics"),
  affectedVillages: jsonb("affected_villages"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  sector: sectorEnum("sector").notNull(),
  status: projectStatusEnum("status").notNull().default("proposed"),
  priority: priorityLevelEnum("priority").default("medium"),
  aiPriorityScore: real("ai_priority_score"),
  estimatedCost: real("estimated_cost"),
  allocatedBudget: real("allocated_budget"),
  estimatedBeneficiaries: integer("estimated_beneficiaries"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  completionPercentage: real("completion_percentage").default(0),
  sdgGoals: jsonb("sdg_goals"),
  linkedClusterIds: jsonb("linked_cluster_ids"),
  linkedSubmissionCount: integer("linked_submission_count").default(0),
  villageIds: jsonb("village_ids"),
  departmentId: uuid("department_id"),
  schemeEligibility: jsonb("scheme_eligibility"),
  feasibilityScore: real("feasibility_score"),
  socialImpactScore: real("social_impact_score"),
  environmentalImpactScore: real("environmental_impact_score"),
  demandScore: real("demand_score"),
  infrastructureGapScore: real("infrastructure_gap_score"),
  priorityExplanation: jsonb("priority_explanation"),
  aiRecommendations: jsonb("ai_recommendations"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget allocations
export const budgetAllocations = pgTable("budget_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  financialYear: varchar("financial_year", { length: 10 }).notNull(),
  totalMplads: real("total_mplads"),
  allocated: real("allocated").default(0),
  spent: real("spent").default(0),
  sectorBreakdown: jsonb("sector_breakdown"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  isRead: boolean("is_read").default(false),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// KPI snapshots
export const kpiSnapshots = pgTable("kpi_snapshots", {
  id: serial("id").primaryKey(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow(),
  totalSubmissions: integer("total_submissions").default(0),
  resolvedSubmissions: integer("resolved_submissions").default(0),
  activeProjects: integer("active_projects").default(0),
  completedProjects: integer("completed_projects").default(0),
  totalBudgetUsed: real("total_budget_used").default(0),
  citizenSatisfaction: real("citizen_satisfaction"),
  avgResponseTime: real("avg_response_time"),
  topSectors: jsonb("top_sectors"),
  metrics: jsonb("metrics"),
});


// Resolution type enum
export const resolutionTypeEnum = pgEnum("resolution_type", [
  "full",
  "partial",
  "rejected",
  "deferred",
]);

// Resolution Proofs - tracks resolved submissions with evidence
export const resolutionProofs = pgTable("resolution_proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").references(() => submissions.id),
  projectId: uuid("project_id").references(() => projects.id),
  resolvedBy: uuid("resolved_by")
    .references(() => users.id)
    .notNull(),
  resolutionType: resolutionTypeEnum("resolution_type").notNull().default("full"),
  description: text("description"),
  photos: jsonb("photos"), // Array of Cloudinary URLs
  documents: jsonb("documents"), // Array of document URLs
  budgetUsed: real("budget_used"),
  percentageResolved: real("percentage_resolved").default(100),
  contractorName: varchar("contractor_name", { length: 255 }),
  departmentName: varchar("department_name", { length: 255 }),
  workOrderNumber: varchar("work_order_number", { length: 100 }),
  completionDate: timestamp("completion_date"),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  citizenFeedback: text("citizen_feedback"),
  citizenRating: real("citizen_rating"), // 1-5 rating
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External Datasets - for ingesting public data (census, DISE, HMIS, etc.)
export const externalDatasets = pgTable("external_datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // census, school, health, infrastructure, economic
  constituencyId: uuid("constituency_id").references(() => constituencies.id),
  villageId: uuid("village_id").references(() => villages.id),
  data: jsonb("data").notNull(),
  year: integer("year"),
  isActive: boolean("is_active").default(true),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
});

// Copilot Conversations - stores AI copilot chat history
export const copilotConversations = pgTable("copilot_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  constituencyId: uuid("constituency_id").references(() => constituencies.id),
  title: varchar("title", { length: 255 }),
  messages: jsonb("messages").notNull(), // Array of {role, content, timestamp}
  context: jsonb("context"), // Retrieved context used in the conversation
  tokensUsed: integer("tokens_used").default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Digital Twin Scenarios - stores simulation scenarios and results
export const digitalTwinScenarios = pgTable("digital_twin_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  constituencyId: uuid("constituency_id")
    .references(() => constituencies.id)
    .notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scenarioType: varchar("scenario_type", { length: 50 }).notNull(), // forecast, what_if, optimization
  parameters: jsonb("parameters").notNull(), // Input parameters for the simulation
  results: jsonb("results"), // Simulation output
  narrative: text("narrative"), // LLM-generated narrative explanation
  timeHorizon: varchar("time_horizon", { length: 50 }), // e.g., "6_months", "1_year", "5_years"
  confidence: real("confidence"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, running, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Priority Scoring History - tracks AI priority score changes over time
export const priorityScoringHistory = pgTable("priority_scoring_history", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  scoredAt: timestamp("scored_at").defaultNow(),
  overallScore: real("overall_score").notNull(),
  demandScore: real("demand_score"),
  feasibilityScore: real("feasibility_score"),
  socialImpactScore: real("social_impact_score"),
  environmentalImpactScore: real("environmental_impact_score"),
  infrastructureGapScore: real("infrastructure_gap_score"),
  budgetAlignmentScore: real("budget_alignment_score"),
  reasoning: text("reasoning"), // DeepSeek R1 explanation
  factors: jsonb("factors"), // Detailed factor breakdown
  modelVersion: varchar("model_version", { length: 50 }),
});
