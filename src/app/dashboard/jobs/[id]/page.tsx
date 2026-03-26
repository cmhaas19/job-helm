"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Star,
  Clock,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Job {
  id: string;
  position: string;
  company: string;
  location: string | null;
  salary: string | null;
  fit_category: string | null;
  total_score: number | null;
  score_details: Record<string, number> | null;
  eval_summary: string | null;
  strengths: string[] | null;
  gaps: string[] | null;
  description: string | null;
  job_url: string;
  company_logo: string | null;
  ago_time: string | null;
  date_posted: string | null;
  user_rating: number | null;
  user_notes: string | null;
  search_query: string | null;
  skipped: boolean;
  skip_reason: string | null;
}

const FIT_COLORS: Record<string, string> = {
  "STRONG FIT": "text-emerald-600",
  "GOOD FIT": "text-blue-600",
  BORDERLINE: "text-amber-600",
  "WEAK FIT": "text-red-600",
};

const FIT_VARIANTS: Record<string, "strong" | "good" | "borderline" | "weak"> = {
  "STRONG FIT": "strong",
  "GOOD FIT": "good",
  BORDERLINE: "borderline",
  "WEAK FIT": "weak",
};

const SCORE_LABELS: Record<string, { label: string; max: number }> = {
  required_skills: { label: "Required Skills", max: 35 },
  years_of_experience: { label: "Experience", max: 10 },
  role_level_alignment: { label: "Role Level", max: 20 },
  industry_domain_match: { label: "Industry Match", max: 20 },
  nice_to_have_skills: { label: "Nice-to-Have", max: 10 },
  education_certs: { label: "Education", max: 5 },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
      setRating(data.user_rating);
      setNotes(data.user_notes || "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  async function handleRate() {
    setSaving(true);
    await fetch(`/api/jobs/${id}/rate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_rating: rating, user_notes: notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto h-full overflow-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto h-full overflow-auto">
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto h-full overflow-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {job.company_logo ? (
            <img src={job.company_logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{job.position}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {job.company}
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
            {job.salary && job.salary !== "Not specified" && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {job.salary}
              </span>
            )}
            {job.ago_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {job.ago_time}
              </span>
            )}
          </div>
        </div>
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on LinkedIn
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score overview */}
          {job.total_score !== null && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fit Score</CardTitle>
                  {job.fit_category && (
                    <Badge variant={FIT_VARIANTS[job.fit_category]}>
                      {job.fit_category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`text-5xl font-bold ${
                      FIT_COLORS[job.fit_category || ""] || ""
                    }`}
                  >
                    {Math.round(job.total_score)}
                  </div>
                  <div className="text-muted-foreground">/100</div>
                </div>

                {/* Score breakdown */}
                {job.score_details && (
                  <div className="space-y-3">
                    {Object.entries(SCORE_LABELS).map(
                      ([key, { label, max }]) => {
                        const score =
                          (job.score_details as Record<string, number>)?.[
                            key
                          ] ?? 0;
                        const pct = (score / max) * 100;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{label}</span>
                              <span className="text-muted-foreground">
                                {score}/{max}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {job.eval_summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{job.eval_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Gaps */}
          {((job.strengths && job.strengths.length > 0) ||
            (job.gaps && job.gaps.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {job.strengths && job.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-start gap-2"
                        >
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {job.gaps && job.gaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <TrendingDown className="h-4 w-4" />
                      Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {job.gaps.map((g, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-start gap-2 text-muted-foreground"
                        >
                          <span className="shrink-0 mt-0.5">-</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Full JD */}
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {job.description}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRating(rating === i ? null : i)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        rating && i <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
                {rating && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {rating === 4
                      ? "Excellent"
                      : rating === 3
                      ? "Good"
                      : rating === 2
                      ? "Poor"
                      : "Bad"}
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Notes about this job (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <Button
                onClick={handleRate}
                disabled={saving}
                className="w-full"
                size="sm"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save Rating"}
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {job.search_query && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search</span>
                  <Badge variant="secondary">{job.search_query}</Badge>
                </div>
              )}
              {job.date_posted && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted</span>
                  <span>{new Date(job.date_posted).toLocaleDateString()}</span>
                </div>
              )}
              {job.skipped && job.skip_reason && (
                <div>
                  <span className="text-muted-foreground">Skip Reason</span>
                  <p className="text-destructive text-xs mt-1">{job.skip_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
