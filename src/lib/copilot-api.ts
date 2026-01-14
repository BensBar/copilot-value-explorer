import { Octokit } from "@octokit/core";

const octokit = new Octokit();

export interface CopilotMetricsResponse {
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions?: {
    total_engaged_users: number;
    editors?: Array<{
      name: string;
      total_engaged_users: number;
    }>;
  };
  copilot_ide_chat?: {
    total_engaged_users: number;
  };
  copilot_dotcom_chat?: {
    total_engaged_users: number;
  };
  copilot_dotcom_pull_requests?: {
    total_engaged_users: number;
  };
  date: string;
}

export interface CopilotSeatsResponse {
  total_seats: number;
  seats: Array<{
    created_at: string;
    updated_at: string;
    pending_cancellation_date: string | null;
    last_activity_at: string | null;
    last_activity_editor: string | null;
    assignee: {
      login: string;
      id: number;
      avatar_url: string;
      type: string;
    };
    assigning_team?: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
}

export async function getCopilotMetrics(): Promise<CopilotMetricsResponse[]> {
  const response = await octokit.request(
    "GET /enterprises/{enterprise}/copilot/metrics",
    {
      enterprise: "octodemo",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.data as CopilotMetricsResponse[];
}

export async function getCopilotSeats(): Promise<CopilotSeatsResponse> {
  const response = await octokit.request(
    "GET /enterprises/{enterprise}/copilot/billing/seats",
    {
      enterprise: "octodemo",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.data as CopilotSeatsResponse;
}

export interface CopilotMetrics {
  activeUsers: number;
  totalSeats: number;
  acceptanceRate: number;
  usageTrend: number;
  dailyAcceptanceRates: { date: string; rate: number }[];
}

export async function fetchCopilotData(): Promise<CopilotMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const today = new Date();
  const dailyAcceptanceRates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      rate: Math.floor(Math.random() * 20) + 25,
    };
  });

  return {
    activeUsers: 127,
    totalSeats: 200,
    acceptanceRate: 32,
    usageTrend: 8,
    dailyAcceptanceRates,
  };
}

export function getAdoptionStatus(
  activeUsers: number,
  totalSeats: number
): { status: "Strong" | "Moderate" | "Underutilized"; ratio: number } {
  const ratio = totalSeats > 0 ? Math.round((activeUsers / totalSeats) * 100) : 0;

  if (ratio >= 70) {
    return { status: "Strong", ratio };
  } else if (ratio >= 40) {
    return { status: "Moderate", ratio };
  } else {
    return { status: "Underutilized", ratio };
  }
}
