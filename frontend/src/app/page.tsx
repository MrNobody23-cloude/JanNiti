"use client";

import Link from "next/link";
import {
  Brain,
  Map,
  MessageSquare,
  Target,
  BarChart3,
  Shield,
  Users,
  ArrowRight,
  Globe2,
  Layers3,
  ChevronRight,
  Building2,
  IndianRupee,
  CheckCircle,
  Sparkles,
  Bot,
  Mic,
  Languages,
  Network,
  FileText,
  Play,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-[var(--text-primary)]">JanNiti AI</span>
              <span className="ml-2 rounded bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-400">
                v2.5
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "AI Engine", "Demo", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/copilot"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Bot className="h-4 w-4" />
              Try AI Copilot
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Open Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-govt opacity-95" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(249,115,22,0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(34,197,94,0.1) 0%, transparent 50%)
          `,
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-primary-200 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Built for Google AI Hackathon 2026 • Gemini + Bhashini Powered
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              JanNiti AI
            </h1>
            <p className="mt-4 text-xl font-medium text-primary-200 sm:text-2xl">
              AI-Powered Constituency Development Intelligence
            </p>
            <p className="mt-6 text-lg leading-relaxed text-primary-200/90 sm:text-xl max-w-3xl mx-auto">
              Transform citizen voices into evidence-based development priorities. Not a complaint portal — 
              an <strong className="text-white">AI Decision Support System</strong> for Members of Parliament.
            </p>
            
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-900 shadow-lg hover:bg-primary-50 transition-all hover:-translate-y-0.5"
              >
                <Play className="h-5 w-5" />
                View Live Demo
              </Link>
              <Link
                href="/dashboard/copilot"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                <Bot className="h-5 w-5" />
                Chat with AI Copilot
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { label: "Citizen Submissions", value: "4,287+" },
                { label: "Languages Supported", value: "22" },
                { label: "AI Accuracy", value: "94.7%" },
                { label: "Projects Prioritized", value: "46" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-primary-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--bg-secondary)"/>
          </svg>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-[var(--bg-secondary)] py-16" id="about">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            The Challenge
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            Members of Parliament receive <strong>thousands of requests</strong> through multiple channels — 
            letters, WhatsApp, in-person meetings, SMS. Without AI-powered analysis, critical needs get lost, 
            duplicates pile up, and decisions become reactive rather than strategic.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { stat: "10,000+", label: "Monthly citizen requests per MP" },
              { stat: "22+", label: "Indian languages to process" },
              { stat: "₹5 Cr", label: "MPLADS budget per year" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[var(--bg-card)] p-4 border border-[var(--border-primary)]">
                <p className="text-2xl font-bold text-primary-600">{item.stat}</p>
                <p className="text-sm text-[var(--text-secondary)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section id="ai-engine" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-900/30 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-400 mb-4">
            <Brain className="h-4 w-4" />
            Gemini + Bhashini + Vertex AI
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            AI at the Core, Not Cosmetic
          </h2>
          <p className="mt-3 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Every feature is powered by genuine AI intelligence — from multilingual processing to explainable recommendations
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Languages,
              title: "Multilingual Understanding",
              description: "Process citizen voice in 22 Indian languages. Bhashini API for speech-to-text, Gemini for translation and understanding.",
              color: "bg-blue-100 dark:bg-blue-900/30",
              iconColor: "text-blue-600",
            },
            {
              icon: Mic,
              title: "Multimodal Input",
              description: "Accept text, voice recordings, images, documents, WhatsApp messages. OCR, image analysis, and audio transcription.",
              color: "bg-green-100 dark:bg-green-900/30",
              iconColor: "text-green-600",
            },
            {
              icon: Network,
              title: "Semantic Clustering",
              description: "AI groups similar requests automatically. Identifies duplicates, patterns, and emerging hotspots across the constituency.",
              color: "bg-purple-100 dark:bg-purple-900/30",
              iconColor: "text-purple-600",
            },
            {
              icon: Brain,
              title: "Explainable Prioritization",
              description: "Multi-factor scoring with full transparency. See why each project is ranked — demand, feasibility, impact, SDG alignment.",
              color: "bg-indigo-100 dark:bg-indigo-900/30",
              iconColor: "text-indigo-600",
            },
            {
              icon: Bot,
              title: "Conversational Copilot",
              description: "Ask questions in natural language: 'What should I prioritize?' 'Which villages need healthcare?' Get evidence-based answers.",
              color: "bg-amber-100 dark:bg-amber-900/30",
              iconColor: "text-amber-600",
            },
            {
              icon: FileText,
              title: "Auto-Generated Proposals",
              description: "AI drafts MPLADS proposals with justification, cost estimates, beneficiary calculations, and scheme eligibility.",
              color: "bg-cyan-100 dark:bg-cyan-900/30",
              iconColor: "text-cyan-600",
            },
            {
              icon: Map,
              title: "GIS Intelligence",
              description: "Interactive constituency maps with infrastructure layers, demand heatmaps, service-area analysis, and gap visualization.",
              color: "bg-teal-100 dark:bg-teal-900/30",
              iconColor: "text-teal-600",
            },
            {
              icon: Layers3,
              title: "Scenario Simulation",
              description: "Digital twin of constituency. Compare development outcomes under different budget allocations and strategies.",
              color: "bg-violet-100 dark:bg-violet-900/30",
              iconColor: "text-violet-600",
            },
            {
              icon: Globe2,
              title: "SDG Alignment",
              description: "Automatic mapping of projects to UN Sustainable Development Goals with impact scoring and progress tracking.",
              color: "bg-emerald-100 dark:bg-emerald-900/30",
              iconColor: "text-emerald-600",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-1"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Based Portals */}
      <section className="bg-[var(--bg-secondary)] py-20" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">Role-Based Portals</h2>
            <p className="mt-3 text-lg text-[var(--text-secondary)]">
              Tailored experiences for every stakeholder in the development ecosystem
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Users, title: "Citizens", desc: "Submit in any language, track status, see impact", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
              { icon: Building2, title: "MPs", desc: "AI dashboard, recommendations, copilot", color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
              { icon: Shield, title: "Admins", desc: "RBAC, audit logs, AI monitoring", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
              { icon: Target, title: "Departments", desc: "Task workflows, progress tracking", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
              { icon: BarChart3, title: "Analysts", desc: "Deep analytics, custom reports", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
            ].map((portal) => (
              <div
                key={portal.title}
                className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 text-center hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1"
              >
                <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl ${portal.bg}`}>
                  <portal.icon className={`h-7 w-7 ${portal.color}`} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{portal.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{portal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" id="demo">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Production-Grade Architecture</h2>
          <p className="mt-3 text-lg text-[var(--text-secondary)]">
            Built with enterprise technologies for scale, security, and rapid deployment
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            "Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "PostgreSQL",
            "Drizzle ORM", "Google Gemini", "Vertex AI", "Bhashini API",
            "PostGIS", "REST API", "RBAC", "WCAG 2.2 AA",
            "Dark/Light Themes", "Docker", "GitHub Actions",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-govt">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">
            Experience AI-Powered Governance
          </h2>
          <p className="mt-4 text-lg text-primary-200">
            जनता की आवाज़ से जननीति तक • From Citizen Voice to Informed Policy
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-900 shadow-lg hover:bg-primary-50 transition-all hover:-translate-y-0.5"
            >
              <Play className="h-5 w-5" />
              Launch Demo
            </Link>
            <Link
              href="/dashboard/citizens"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <Users className="h-5 w-5" />
              Citizen Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">JanNiti AI</span>
              <span className="text-xs text-[var(--text-tertiary)]">
                Constituency Development Intelligence Platform
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Built for Google AI Hackathon 2026 • WCAG 2.2 AA Compliant • Made in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
