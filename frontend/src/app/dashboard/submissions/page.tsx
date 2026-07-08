"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submissionsApi } from "@/lib/api";
import { getSectorLabel, getStatusColor, cn } from "@/lib/utils";
import {
  Filter,
  Globe,
  MessageCircle,
  Phone,
  Search,
  Smartphone,
  WifiOff,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { SubmissionForm } from "@/components/dashboard/submission-form";

const channelIcons: Record<string, React.ReactNode> = {
  web: <Globe className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  sms: <Phone className="h-3.5 w-3.5" />,
  voice: <Phone className="h-3.5 w-3.5" />,
  offline: <WifiOff className="h-3.5 w-3.5" />,
  mobile_app: <Smartphone className="h-3.5 w-3.5" />,
};

interface Submission {
  id: string;
  title: string;
  description: string;
  sector: string;
  status: string;
  channel: string;
  urgencyScore: number;
  sentimentScore: number;
  upvotes: number;
  address: string;
  createdAt: string;
  originalLanguage: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [showForm, setShowForm] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await submissionsApi.list({
        page,
        limit: 15,
        sector: selectedSector || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
        sortBy,
        sortOrder: "desc",
      });
      setSubmissions(res.data ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotal(res.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedSector, selectedStatus, searchQuery, sortBy]);

  useEffect(() => {
    void (async () => {
      await fetchSubmissions();
    })();
  }, [fetchSubmissions]);

  const sectors = ["", "healthcare", "education", "water_sanitation", "roads_transport", "agriculture", "energy_digital", "housing", "environment", "social_welfare", "skill_youth"];
  const statuses = ["", "pending", "verified", "clustered", "prioritized", "in_progress", "completed", "rejected"];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary)">Citizen Submissions</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {total} submissions from web, WhatsApp, SMS, voice, and offline channels
          </p>
        </div>
        <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(!showForm)}>
          New Submission
        </Button>
      </div>

      {/* Submission Form */}
      {showForm && (
        <SubmissionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchSubmissions(); }}
        />
      )}

      {/* Filters */}
      <Card className="animate-slide-up">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-tertiary)" />
            <input
              type="search"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full h-9 rounded-lg border border-(--border-primary) bg-(--bg-secondary) pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label="Search submissions"
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => { setSelectedSector(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-3 text-sm text-(--text-primary) focus:border-primary-500 focus:outline-none"
            aria-label="Filter by sector"
          >
            <option value="">All Sectors</option>
            {sectors.slice(1).map(s => (
              <option key={s} value={s}>{getSectorLabel(s)}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-3 text-sm text-(--text-primary) focus:border-primary-500 focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {statuses.slice(1).map(s => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-3 text-sm text-(--text-primary) focus:border-primary-500 focus:outline-none"
            aria-label="Sort by"
          >
            <option value="createdAt">Sort: Latest</option>
            <option value="urgencyScore">Sort: Urgency</option>
            <option value="upvotes">Sort: Most Upvoted</option>
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-(--text-tertiary)">Loading submissions...</span>
        </div>
      )}

      {/* Submissions List */}
      {!loading && (
        <div className="space-y-3">
          {submissions.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-(--text-tertiary)">No submissions found</p>
            </Card>
          )}

          {submissions.map((sub, i) => (
            <Card
              key={sub.id}
              hover
              className="animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--bg-tertiary) text-(--text-tertiary)">
                  {channelIcons[sub.channel] ?? <Globe className="h-3.5 w-3.5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusColor(sub.status) as any} size="sm">
                      {sub.status?.replace("_", " ")}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {getSectorLabel(sub.sector)}
                    </Badge>
                    {sub.originalLanguage && sub.originalLanguage !== "en" && (
                      <Badge variant="info" size="sm">{sub.originalLanguage.toUpperCase()}</Badge>
                    )}
                  </div>

                  <h3 className="mt-1.5 text-sm font-semibold text-(--text-primary) line-clamp-1">
                    {sub.title ?? "Untitled submission"}
                  </h3>
                  <p className="mt-0.5 text-xs text-(--text-secondary) line-clamp-2">
                    {sub.description}
                  </p>

                  <div className="mt-2 flex items-center gap-4 text-xs text-(--text-tertiary)">
                    {sub.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {sub.address}
                      </span>
                    )}
                    <span>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("en-IN") : ""}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right space-y-1">
                  {sub.urgencyScore != null && (
                    <div className="flex items-center gap-1 justify-end">
                      {sub.urgencyScore > 0.7 ? <TrendingUp className="h-3 w-3 text-red-500" /> :
                       sub.urgencyScore > 0.4 ? <Minus className="h-3 w-3 text-amber-500" /> :
                       <TrendingDown className="h-3 w-3 text-emerald-500" />}
                      <span className={cn(
                        "text-xs font-bold",
                        sub.urgencyScore > 0.7 ? "text-red-600" : sub.urgencyScore > 0.4 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {(sub.urgencyScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {sub.upvotes != null && (
                    <div className="flex items-center gap-1 justify-end text-(--text-tertiary)">
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-xs">{sub.upvotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--text-tertiary)">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              icon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
