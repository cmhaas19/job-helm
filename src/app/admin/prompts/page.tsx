"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ChevronRight } from "lucide-react";

interface Prompt {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  updated_at: string;
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrompts = useCallback(async () => {
    const res = await fetch("/api/admin/prompts");
    const data = await res.json();
    setPrompts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return (
    <div className="p-6 lg:p-8 h-full overflow-auto max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          System Prompts
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage AI evaluation prompts
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <Link key={prompt.id} href={`/admin/prompts/${prompt.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{prompt.name}</h3>
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground">
                        {prompt.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {prompt.slug}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(prompt.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
