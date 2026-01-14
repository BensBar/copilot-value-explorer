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
