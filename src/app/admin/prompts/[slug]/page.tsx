"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Check, RotateCcw, History } from "lucide-react";

interface PromptVersion {
  id: string;
  version: number;
  content: string;
  created_at: string;
}

interface PromptData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string;
  versions: PromptVersion[];
}

export default function PromptEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const loadPrompt = useCallback(async () => {
    const res = await fetch(`/api/admin/prompts/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setPrompt(data);
      setContent(data.content);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/prompts/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    loadPrompt();
  }

  async function handleRollback(versionId: string) {
    await fetch(`/api/admin/prompts/${slug}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    loadPrompt();
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto h-full overflow-auto">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto h-full overflow-auto">
        <p className="text-muted-foreground">Prompt not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{prompt.name}</h1>
          {prompt.description && (
            <p className="text-muted-foreground mt-1">{prompt.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersions(!showVersions)}
          >
            <History className="h-4 w-4 mr-2" />
            Versions
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={showVersions ? "lg:col-span-2" : "lg:col-span-3"}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm min-h-[600px]"
          />
        </div>

        {showVersions && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Version History</h3>
            {prompt.versions.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary">v{v.version}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRollback(v.id)}
                      title="Rollback to this version"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString()}
                  </p>
                  <pre className="text-xs mt-2 max-h-24 overflow-y-auto text-muted-foreground">
                    {v.content.substring(0, 200)}...
                  </pre>
                </CardContent>
              </Card>
            ))}
            {prompt.versions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No previous versions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
