"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { projectsApi, submissionsApi } from "@/lib/api";
import {
  CheckCircle2,
  Upload,
  FileText,
  Camera,
  Video,
  User,
  IndianRupee,
  Calendar,
  MapPin,
  Plus,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type ResolutionItem = {
  id: string;
  projectTitle?: string;
  projectSector?: string;
  submissionTitle?: string;
  description?: string;
  budgetUsed?: number | null;
  percentageResolved?: number | null;
  completionDate?: string | null;
  contractorName?: string | null;
  departmentName?: string | null;
  photos?: unknown;
  documents?: unknown;
  createdAt?: string | null;
  projectStatus?: string | null;
};

const emptyForm = {
  projectId: "",
  submissionId: "",
  departmentName: "",
  contractorName: "",
  budgetUsed: "",
  completionDate: "",
  percentageResolved: "100",
  resolutionType: "full",
  description: "",
  workOrderNumber: "",
};

export default function ResolutionProofPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = async () => {
    try {
      setIsFetching(true);

      // First load projects and submissions
      const [projectsResponse, submissionsResponse] = await Promise.all([
        projectsApi.list({ page: 1, limit: 50 }),
        submissionsApi.list({ page: 1, limit: 50 }),
      ]);

      const projectList = projectsResponse.data ?? [];

      setProjects(projectList);
      setSubmissions(submissionsResponse.data ?? []);

      // Then load resolutions for every project
      const resolutionResponses = await Promise.all(
        projectList.map((project) => projectsApi.getResolutions(project.id))
      );

      const allResolutions = resolutionResponses.flatMap(
        (response) => response.data ?? []
      );

      setResolutions(allResolutions);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load resolution data."
      );
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const totalBudgetUsed = resolutions.reduce((sum, item) => sum + Number(item.budgetUsed ?? 0), 0);
    const pendingVerification = resolutions.filter((item) => Number(item.percentageResolved ?? 0) < 100).length;
    const completed = resolutions.filter((item) => Number(item.percentageResolved ?? 0) >= 100).length;

    return [
      { label: "Total Resolved", value: `${resolutions.length}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
      { label: "Pending Verification", value: `${pendingVerification}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
      { label: "Total Budget Used", value: `₹${(totalBudgetUsed / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
      { label: "Completed Proofs", value: `${completed}`, icon: User, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    ];
  }, [resolutions]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.projectId || !formData.description.trim()) {
      setError("Please select a project and add a resolution description.");
      return;
    }

    setIsLoading(true);

    try {
      const uploadedPhotos: string[] = [];
      const uploadedDocuments: string[] = [];

      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        const isVideo = ["mp4", "mov", "avi", "webm"].includes(extension);
        const isDocument = ["pdf", "doc", "docx", "txt"].includes(extension);
        const mediaType = isVideo ? "video" : isDocument ? "document" : "image";
        const uploadResponse = await submissionsApi.upload(file, mediaType);
        const url = uploadResponse?.data?.url;

        if (url) {
          if (isDocument) {
            uploadedDocuments.push(url);
          } else {
            uploadedPhotos.push(url);
          }
        }
      }

      const payload = {
        submissionId: formData.submissionId || undefined,
        resolutionType: formData.resolutionType,
        description: formData.description,
        photos: uploadedPhotos,
        documents: uploadedDocuments,
        budgetUsed: formData.budgetUsed ? Number(formData.budgetUsed) : undefined,
        percentageResolved: Number(formData.percentageResolved || 100),
        contractorName: formData.contractorName || undefined,
        departmentName: formData.departmentName || undefined,
        workOrderNumber: formData.workOrderNumber || undefined,
        completionDate: formData.completionDate || undefined,
      };

      console.log("Payload:", payload);

      await projectsApi.resolve(formData.projectId, payload);

      setFormData(emptyForm);
      setFiles([]);
      setShowAddForm(false);
      setSuccess("Resolution proof saved successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the resolution proof.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Resolution Proofs</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload evidence, save completion details, and view stored proof records from the database.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          Add Resolution Proof
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} hover className="animate-slide-up">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showAddForm && (
        <Card className="animate-scale-in border-primary-200 dark:border-primary-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add New Resolution Proof</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </CardHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Select Project
              </label>
              <select
                value={formData.projectId}
                onChange={(event) => handleChange("projectId", event.target.value)}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.sector})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Link to submission (optional)
              </label>
              <select
                value={formData.submissionId}
                onChange={(event) => handleChange("submissionId", event.target.value)}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No linked submission</option>
                {submissions.map((submission) => (
                  <option key={submission.id} value={submission.id}>
                    {submission.title || submission.description?.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Resolved By (Department/Agency)
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={(event) => handleChange("departmentName", event.target.value)}
                  placeholder="e.g., PWD Varanasi Division"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Contractor/Implementer
                </label>
                <input
                  type="text"
                  value={formData.contractorName}
                  onChange={(event) => handleChange("contractorName", event.target.value)}
                  placeholder="e.g., M/s Kumar Infrastructure"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Budget Used (₹)
                </label>
                <input
                  type="number"
                  value={formData.budgetUsed}
                  onChange={(event) => handleChange("budgetUsed", event.target.value)}
                  placeholder="e.g., 450000"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={(event) => handleChange("completionDate", event.target.value)}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  % Resolved
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentageResolved}
                  onChange={(event) => handleChange("percentageResolved", event.target.value)}
                  placeholder="100"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Resolution Type
              </label>
              <select
                value={formData.resolutionType}
                onChange={(event) => handleChange("resolutionType", event.target.value)}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="full">Full</option>
                <option value="partial">Partial</option>
                <option value="deferred">Deferred</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Resolution Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="Describe what work was done, how the problem was resolved..."
                className="w-full resize-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Proof of Work (Images, Videos, Documents)
              </label>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[var(--border-primary)] p-8 text-center transition-colors hover:border-primary-400">
                <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Choose files to upload</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Images, videos, and documents will be stored with the proof record.</p>
                <input type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx" />
              </label>
              {files.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`} className="rounded border border-[var(--border-primary)] px-2 py-1">
                      {file.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Work Order / Reference Number (optional)
              </label>
              <input
                type="text"
                value={formData.workOrderNumber}
                onChange={(event) => handleChange("workOrderNumber", event.target.value)}
                placeholder="e.g., WO/VAR/2026/0145"
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />} disabled={isLoading}>
                {isLoading ? "Saving..." : "Submit Resolution Proof"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {isFetching ? (
          <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading resolution proofs...</Card>
        ) : resolutions.length === 0 ? (
          <Card className="p-6 text-sm text-[var(--text-secondary)]">No resolution proofs found yet. Add one to get started.</Card>
        ) : (
          resolutions.map((item, index) => {
            const proofPhotos = Array.isArray(item.photos) ? item.photos : [];
            const proofDocuments = Array.isArray(item.documents) ? item.documents : [];
            const percentage = Number(item.percentageResolved ?? 0);
            const status = percentage >= 100 ? "verified" : "pending_verification";

            return (
              <Card key={item.id} hover className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={status === "verified" ? "success" : "warning"} size="sm">
                        {status === "verified" ? "Verified" : "Pending Verification"}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {(item.projectSector ?? "general").replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                      {item.projectTitle ?? item.submissionTitle ?? "Resolution proof"}
                    </h3>

                    <p className="mt-1.5 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {item.description ?? "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {item.departmentName ?? "Department pending"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {item.completionDate ? new Date(item.completionDate).toLocaleDateString() : "Pending"}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" /> ₹{Number(item.budgetUsed ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-tertiary)]">Completion</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress
                          value={percentage}
                          size="sm"
                          className="w-24"
                          barClassName={
                            percentage === 100
                              ? "bg-emerald-500"
                              : percentage >= 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{percentage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                        "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                      )}>
                        <Camera className="h-3 w-3" />
                        {proofPhotos.length + proofDocuments.length} proof{proofPhotos.length + proofDocuments.length === 1 ? "" : "s"}
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                        <FileText className="h-3 w-3" />
                        {proofDocuments.length} doc{proofDocuments.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
