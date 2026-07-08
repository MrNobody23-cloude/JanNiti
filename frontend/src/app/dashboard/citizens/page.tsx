"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { INDIAN_LANGUAGES } from "@/lib/constants";
import {
  Users,
  Send,
  Mic,
  Camera,
  FileUp,
  MessageCircle,
  Phone,
  Globe,
  CheckCircle,
  Star,
  ThumbsUp,
  QrCode,
  WifiOff,
  Sparkles,
  Languages,
} from "lucide-react";
import { useState } from "react";

export default function CitizenPortalPage() {
  const [activeTab, setActiveTab] = useState<"submit" | "track" | "engage">("submit");
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Citizen Portal</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Multilingual submission with voice, text, image, WhatsApp & offline support
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" dot>
            <Languages className="h-3 w-3 mr-1" />
            22 Languages
          </Badge>
          <Badge variant="info" size="sm">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-[var(--bg-tertiary)] p-1">
        {[
          { key: "submit", label: "Submit Feedback", icon: Send },
          { key: "track", label: "Track Submissions", icon: CheckCircle },
          { key: "engage", label: "Community", icon: Star },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "submit" | "track" | "engage")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "submit" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Submit Development Feedback</CardTitle>
                <Badge variant="info" size="sm">Multilingual Support</Badge>
              </CardHeader>

              <div className="space-y-4">
                {/* Language selection */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Select Language
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["English", "हिन्दी", "தமிழ்", "తెలుగు", "বাংলা", "ಕನ್ನಡ", "मराठी", "ગુજરાતી"].map((lang) => (
                      <button
                        key={lang}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          lang === "English"
                            ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                            : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-primary-300"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Title / Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of your development need..."
                    className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the development need, location, affected people, and urgency..."
                    className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Sector
                  </label>
                  <select className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none">
                    <option>Select sector...</option>
                    <option>Healthcare</option>
                    <option>Education</option>
                    <option>Water & Sanitation</option>
                    <option>Roads & Transport</option>
                    <option>Agriculture</option>
                    <option>Digital Infrastructure</option>
                    <option>Housing</option>
                    <option>Energy</option>
                    <option>Environment</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Village / Ward
                  </label>
                  <input
                    type="text"
                    placeholder="Enter village or ward name..."
                    className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Attachment Options */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Attachments
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: Mic, label: "Voice Note", desc: "Record in any language" },
                      { icon: Camera, label: "Photo/Video", desc: "Capture evidence" },
                      { icon: FileUp, label: "Document", desc: "PDF, Doc, Image" },
                      { icon: Globe, label: "Location", desc: "Pin on map" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-primary)] p-4 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all"
                      >
                        <opt.icon className="h-6 w-6 text-primary-500" />
                        <span className="text-xs font-medium text-[var(--text-primary)]">{opt.label}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button size="lg" icon={<Send className="h-4 w-4" />} className="w-full">
                  Submit Feedback
                </Button>
              </div>
            </Card>
          </div>

          {/* Submission Channels */}
          <div className="space-y-4">
            <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle>Other Submission Channels</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {[
                  { icon: MessageCircle, label: "WhatsApp", desc: "Send to +91-XXXXX-XXXXX", color: "text-green-500" },
                  { icon: Phone, label: "SMS", desc: "Send to 56789", color: "text-blue-500" },
                  { icon: Mic, label: "Voice Helpline", desc: "Call 1800-XXX-XXXX (toll-free)", color: "text-purple-500" },
                  { icon: Globe, label: "Offline Mode", desc: "Available in mobile app", color: "text-orange-500" },
                ].map((ch) => (
                  <div key={ch.label} className="flex items-center gap-3 rounded-lg p-3 border border-[var(--border-primary)]">
                    <ch.icon className={`h-5 w-5 ${ch.color}`} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{ch.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{ch.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle>AI Processing</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Auto-translation to English
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Speech-to-text for voice notes
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  OCR for document scanning
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Sentiment & urgency analysis
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Duplicate detection
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Auto-categorization & clustering
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Spam filtering
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "track" && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { title: "Water pipeline broken in Sector 5", status: "in_progress", date: "2025-12-20", progress: 65 },
              { title: "Street lights needed near school", status: "verified", date: "2026-01-05", progress: 25 },
              { title: "Road repair on NH-2 link road", status: "completed", date: "2025-11-15", progress: 100 },
            ].map((sub, i) => (
              <div key={i} className="rounded-xl border border-[var(--border-primary)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">{sub.title}</h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Submitted: {sub.date}</p>
                  </div>
                  <Badge
                    variant={sub.status === "completed" ? "success" : sub.status === "in_progress" ? "warning" : "info"}
                    size="sm"
                    dot
                  >
                    {sub.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={sub.progress} size="sm" className="flex-1" barClassName={sub.progress === 100 ? "bg-emerald-500" : "bg-primary-500"} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{sub.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "engage" && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Community Engagement</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { title: "PHC Upgrade – Pindra Block", votes: 287, sector: "Healthcare" },
              { title: "Flood Protection Wall – Harahua", votes: 278, sector: "Environment" },
              { title: "Community Health Center – Ramnagar", votes: 321, sector: "Healthcare" },
              { title: "Vocational Training Center – Sarnath", votes: 203, sector: "Skill Development" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg p-3 hover:bg-[var(--bg-secondary)] transition-colors">
                <Button variant="secondary" size="sm" icon={<ThumbsUp className="h-3.5 w-3.5" />}>
                  {item.votes}
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{item.sector}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
