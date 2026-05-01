// src/app/admin/pipeline/page.tsx
// Cron + edge-function observability. Two tables:
// - cron schedule with each job's last-tick status
// - net._http_response: last 50 cron-triggered function calls

import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
}

interface CronRun {
  jobid: number;
  jobname: string;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
}

interface HttpResponse {
  id: number;
  status_code: number;
  content_type: string | null;
  content: string | null;
  created: string;
}

async function loadCronJobs(): Promise<CronJob[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("admin_list_cron_jobs");
  if (error) {
    console.error("admin_list_cron_jobs:", error.message);
    return [];
  }
  return (data ?? []) as CronJob[];
}

async function loadCronRuns(): Promise<CronRun[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("admin_recent_cron_runs", {
    p_limit: 25,
  });
  if (error) {
    console.error("admin_recent_cron_runs:", error.message);
    return [];
  }
  return (data ?? []) as CronRun[];
}

async function loadHttpResponses(): Promise<HttpResponse[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("admin_recent_http_responses", {
    p_limit: 50,
  });
  if (error) {
    console.error("admin_recent_http_responses:", error.message);
    return [];
  }
  return (data ?? []) as HttpResponse[];
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminPipelinePage() {
  const [jobs, runs, responses] = await Promise.all([
    loadCronJobs(),
    loadCronRuns(),
    loadHttpResponses(),
  ]);

  return (
    <div>
      <h1 className="display text-[36px] mb-2">Pipeline</h1>
      <p className="text-soft text-[14px] mb-8">
        Cron schedules and recent edge-function calls. Read-only.
      </p>

      <h2 className="kicker text-soft mb-3">Schedules</h2>
      {jobs.length === 0 ? (
        <p className="text-soft text-[14px] mb-10">
          Cron metadata not accessible from this layer (admin RPCs not yet
          installed). See migration 013 follow-up.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule mb-10">
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Schedule</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Command</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.jobid} className="border-t border-rule">
                  <td className="px-3 py-2 font-mono">{j.jobname}</td>
                  <td className="px-3 py-2 font-mono">{j.schedule}</td>
                  <td className="px-3 py-2">
                    {j.active ? (
                      <span className="up">●</span>
                    ) : (
                      <span className="text-soft">○</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px] text-soft">
                    {j.command}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="kicker text-soft mb-3">Recent runs</h2>
      {runs.length === 0 ? (
        <p className="text-soft text-[14px] mb-10">No recent runs recorded.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule mb-10">
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Ended</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i} className="border-t border-rule">
                  <td className="px-3 py-2 font-mono">{r.jobname}</td>
                  <td className="px-3 py-2">
                    {r.status === "succeeded" ? (
                      <span className="up">{r.status}</span>
                    ) : r.status === "failed" ? (
                      <span className="down">{r.status}</span>
                    ) : (
                      <span className="text-soft">{r.status}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono">{formatTime(r.start_time)}</td>
                  <td className="px-3 py-2 font-mono">{formatTime(r.end_time)}</td>
                  <td className="px-3 py-2 font-mono text-[12px] text-soft truncate max-w-xs">
                    {r.return_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="kicker text-soft mb-3">Edge-function responses (last 50)</h2>
      {responses.length === 0 ? (
        <p className="text-soft text-[14px]">No responses captured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-[12px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Body preview</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-t border-rule">
                  <td className="px-3 py-2 font-mono">{formatTime(r.created)}</td>
                  <td className="px-3 py-2">
                    {r.status_code === 200 ? (
                      <span className="up font-mono">{r.status_code}</span>
                    ) : (
                      <span className="down font-mono">{r.status_code}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-soft truncate max-w-2xl">
                    {(r.content ?? "").slice(0, 200)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
