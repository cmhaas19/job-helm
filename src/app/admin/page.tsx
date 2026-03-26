import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, BarChart3, History } from "lucide-react";

export default async function AdminPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: searchCount },
    { count: jobCount },
    { count: runCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("saved_searches").select("*", { count: "exact", head: true }),
    supabase.from("job_evaluations").select("*", { count: "exact", head: true }),
    supabase.from("run_logs").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Users", value: userCount || 0, icon: Users },
    { label: "Saved Searches", value: searchCount || 0, icon: Search },
    { label: "Job Evaluations", value: jobCount || 0, icon: BarChart3 },
    { label: "Pipeline Runs", value: runCount || 0, icon: History },
  ];

  return (
    <div className="p-6 lg:p-8 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
