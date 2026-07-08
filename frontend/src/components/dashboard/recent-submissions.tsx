"use client";
import { submissionsApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSectorLabel, getStatusColor } from "@/lib/utils";
import {
  ArrowRight,
  Globe,
  MessageCircle,
  Phone,
  Smartphone,
  ThumbsUp,
  WifiOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const channelIcons: Record<string, React.ReactNode> = {
  web: <Globe className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  sms: <Phone className="h-3.5 w-3.5" />,
  voice: <Phone className="h-3.5 w-3.5" />,
  offline: <WifiOff className="h-3.5 w-3.5" />,
  mobile_app: <Smartphone className="h-3.5 w-3.5" />,
};

export function RecentSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionsApi
      .list({
        limit: 8,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
      .then((res) => {
        setSubmissions(res.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("RecentSubmissions fetch failed:", err);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "250ms" }}>
      <CardHeader>
        <CardTitle>Recent Citizen Submissions</CardTitle>
        <Link
          href="/dashboard/submissions"
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      )}

      {!loading && submissions.length === 0 && (
        <p className="text-center text-sm text-[var(--text-tertiary)] py-8">No submissions found</p>
      )}

      <div className="space-y-2">
        {submissions.map((sub: any) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              {channelIcons[sub.channel] ?? <Globe className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {sub.title ?? "Untitled"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">{sub.address ?? ""}</span>
                <span className="text-[var(--text-tertiary)]">·</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("en-IN") : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sub.sector && <Badge variant="info" size="sm">{getSectorLabel(sub.sector)}</Badge>}
              {sub.upvotes != null && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                  <ThumbsUp className="h-3 w-3" />
                  {sub.upvotes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
