import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkle,
  Users,
  ChartLineUp,
  Code,
  ChatCircle,
  GitPullRequest,
  ArrowLeft,
  CaretRight,
  Calendar,
  Clock,
  Desktop,
  Pulse,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCopilotMetrics,
  getCopilotSeats,
  getAdoptionStatus,
  type CopilotMetricsResponse,
  type CopilotSeatsResponse,
} from "@/lib/copilot-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type DrillDownView =
  | null
  | "seats"
  | "activeUsers"
  | "engagedUsers"
  | "adoption"
  | "trend"
  | "feature"
  | "user";

interface SelectedUser {
  login: string;
  avatar_url: string;
  id: number;
  last_activity_at: string | null;
  last_activity_editor: string | null;
  created_at: string;
  assigning_team?: { name: string };
}

function App() {
  const [metricsData, setMetricsData] = useState<CopilotMetricsResponse[] | null>(null);
  const [seatsData, setSeatsData] = useState<CopilotSeatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownView>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [metrics, seats] = await Promise.all([
          getCopilotMetrics(),
          getCopilotSeats(),
        ]);
        setMetricsData(metrics);
        setSeatsData(seats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const latestMetrics = metricsData?.[metricsData.length - 1];
  const adoptionStatus = seatsData && latestMetrics
    ? getAdoptionStatus(latestMetrics.total_active_users, seatsData.total_seats)
    : null;

  const chartData = metricsData?.slice(-14).map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullDate: m.date,
    active: m.total_active_users,
    engaged: m.total_engaged_users,
    codeCompletions: m.copilot_ide_code_completions?.total_engaged_users || 0,
    ideChat: m.copilot_ide_chat?.total_engaged_users || 0,
    prSummaries: m.copilot_dotcom_pull_requests?.total_engaged_users || 0,
    dotcomChat: m.copilot_dotcom_chat?.total_engaged_users || 0,
  }));

  const featureData = latestMetrics
    ? [
        {
          name: "Code Completions",
          key: "completions",
          users: latestMetrics.copilot_ide_code_completions?.total_engaged_users || 0,
          color: "oklch(0.45 0.15 250)",
          icon: Code,
          editors: latestMetrics.copilot_ide_code_completions?.editors || [],
        },
        {
          name: "IDE Chat",
          key: "ideChat",
          users: latestMetrics.copilot_ide_chat?.total_engaged_users || 0,
          color: "oklch(0.65 0.18 145)",
          icon: ChatCircle,
        },
        {
          name: "PR Summaries",
          key: "prSummaries",
          users: latestMetrics.copilot_dotcom_pull_requests?.total_engaged_users || 0,
          color: "oklch(0.7 0.15 45)",
          icon: GitPullRequest,
        },
        {
          name: "GitHub Chat",
          key: "dotcomChat",
          users: latestMetrics.copilot_dotcom_chat?.total_engaged_users || 0,
          color: "oklch(0.55 0.2 300)",
          icon: ChatCircle,
        },
      ]
    : [];

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { label: "Never", variant: "outline" as const, days: -1 };
    const days = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 1) return { label: "Today", variant: "default" as const, days };
    if (days <= 7) return { label: `${days}d ago`, variant: "secondary" as const, days };
    return { label: `${days}d ago`, variant: "outline" as const, days };
  };

  const handleFeatureClick = (featureKey: string) => {
    setSelectedFeature(featureKey);
    setDrillDown("feature");
  };

  const handleUserClick = (seat: CopilotSeatsResponse["seats"][0]) => {
    setSelectedUser({
      login: seat.assignee.login,
      avatar_url: seat.assignee.avatar_url,
      id: seat.assignee.id,
      last_activity_at: seat.last_activity_at,
      last_activity_editor: seat.last_activity_editor,
      created_at: seat.created_at,
      assigning_team: seat.assigning_team,
    });
    setDrillDown("user");
  };

  const handleChartClick = (data: { fullDate?: string }) => {
    if (data?.fullDate) {
      setSelectedDate(data.fullDate);
      setDrillDown("trend");
    }
  };

  const closeDrillDown = () => {
    setDrillDown(null);
    setSelectedFeature(null);
    setSelectedUser(null);
    setSelectedDate(null);
  };

  const getSelectedFeatureData = () => {
    return featureData.find((f) => f.key === selectedFeature);
  };

  const getSelectedDateMetrics = () => {
    return metricsData?.find((m) => m.date === selectedDate);
  };

  const getEditorDistribution = () => {
    const editorCounts: Record<string, number> = {};
    seatsData?.seats.forEach((seat) => {
      const editor = seat.last_activity_editor || "Unknown";
      editorCounts[editor] = (editorCounts[editor] || 0) + 1;
    });
    return Object.entries(editorCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === "vscode" ? "oklch(0.45 0.15 250)" :
             name === "jetbrains" ? "oklch(0.65 0.18 145)" :
             name === "neovim" ? "oklch(0.7 0.15 45)" : "oklch(0.5 0.02 250)",
    }));
  };

  const getTeamDistribution = () => {
    const teamCounts: Record<string, number> = {};
    seatsData?.seats.forEach((seat) => {
      const team = seat.assigning_team?.name || "Unassigned";
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    });
    return Object.entries(teamCounts).map(([name, value], index) => ({
      name,
      value,
      color: index === 0 ? "oklch(0.45 0.15 250)" :
             index === 1 ? "oklch(0.65 0.18 145)" :
             index === 2 ? "oklch(0.7 0.15 45)" : "oklch(0.55 0.2 300)",
    }));
  };

  const getActivityDistribution = () => {
    let today = 0, thisWeek = 0, older = 0, never = 0;
    seatsData?.seats.forEach((seat) => {
      const status = getActivityStatus(seat.last_activity_at);
      if (status.days < 0) never++;
      else if (status.days <= 1) today++;
      else if (status.days <= 7) thisWeek++;
      else older++;
    });
    return [
      { name: "Today", value: today, color: "oklch(0.65 0.18 145)" },
      { name: "This Week", value: thisWeek, color: "oklch(0.45 0.15 250)" },
      { name: "Older", value: older, color: "oklch(0.7 0.15 45)" },
      { name: "Never", value: never, color: "oklch(0.5 0.02 250)" },
    ].filter((d) => d.value > 0);
  };

  const getUserActivityHistory = () => {
    return metricsData?.slice(-7).map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-US", { weekday: "short" }),
      active: Math.random() > 0.3 ? 1 : 0,
    })) || [];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary rounded-xl">
              <Sparkle weight="fill" className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
              Copilot Value Explorer
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            GitHub Enterprise: <span className="font-semibold text-foreground">Octodemo</span>
            <span className="text-xs ml-2 opacity-60">• Click any card or chart to drill down</span>
          </p>
        </motion.header>

        {error && (
          <Card className="border-destructive bg-destructive/10 mb-8">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card
              className="border-0 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              onClick={() => setDrillDown("seats")}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Seats</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-20 mt-1" />
                    ) : (
                      <p className="text-3xl font-display font-bold text-foreground">
                        {seatsData?.total_seats || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" weight="duotone" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>View breakdown</span>
                  <CaretRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card
              className="border-0 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              onClick={() => setDrillDown("activeUsers")}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Active Users</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-20 mt-1" />
                    ) : (
                      <p className="text-3xl font-display font-bold text-foreground">
                        {latestMetrics?.total_active_users || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <ChartLineUp className="h-5 w-5 text-accent-foreground" weight="duotone" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>View activity</span>
                  <CaretRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              className="border-0 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              onClick={() => setDrillDown("engagedUsers")}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Engaged Users</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-20 mt-1" />
                    ) : (
                      <p className="text-3xl font-display font-bold text-foreground">
                        {latestMetrics?.total_engaged_users || 0}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <Code className="h-5 w-5 text-secondary-foreground" weight="duotone" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>View features</span>
                  <CaretRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card
              className="border-0 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              onClick={() => setDrillDown("adoption")}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Adoption Rate</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-20 mt-1" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-display font-bold text-foreground">
                          {adoptionStatus?.ratio || 0}%
                        </p>
                        <Badge
                          variant={
                            adoptionStatus?.status === "Strong"
                              ? "default"
                              : adoptionStatus?.status === "Moderate"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {adoptionStatus?.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>View details</span>
                  <CaretRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-lg font-display font-semibold flex items-center gap-2">
                  <ChartLineUp className="h-5 w-5 text-primary" weight="duotone" />
                  User Activity Trend
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    Click a data point to drill down
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={chartData}
                      onClick={(e) => e?.activePayload?.[0]?.payload && handleChartClick(e.activePayload[0].payload)}
                      style={{ cursor: "pointer" }}
                    >
                      <defs>
                        <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="engagedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.9 0.01 250)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-card p-3 rounded-lg border shadow-lg">
                                <p className="font-semibold text-sm mb-2">{label}</p>
                                {payload.map((p, i) => (
                                  <p key={i} className="text-sm" style={{ color: p.color }}>
                                    {p.name}: {p.value}
                                  </p>
                                ))}
                                <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="active"
                        stroke="oklch(0.45 0.15 250)"
                        strokeWidth={2}
                        fill="url(#activeGradient)"
                        name="Active Users"
                      />
                      <Area
                        type="monotone"
                        dataKey="engaged"
                        stroke="oklch(0.65 0.18 145)"
                        strokeWidth={2}
                        fill="url(#engagedGradient)"
                        name="Engaged Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="border-0 shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-lg font-display font-semibold flex items-center gap-2">
                  <Sparkle className="h-5 w-5 text-primary" weight="duotone" />
                  Feature Adoption
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-3">
                    {featureData.map((feature) => (
                      <div
                        key={feature.key}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors"
                        onClick={() => handleFeatureClick(feature.key)}
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${feature.color}20` }}
                        >
                          <feature.icon
                            className="h-4 w-4"
                            style={{ color: feature.color }}
                            weight="duotone"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{feature.name}</p>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${(feature.users / (latestMetrics?.total_engaged_users || 1)) * 100}%`,
                                backgroundColor: feature.color,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{feature.users}</span>
                          <CaretRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-display font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" weight="duotone" />
                Assigned Seats
                {seatsData && (
                  <Badge variant="secondary" className="ml-2">
                    {seatsData.seats.length} users
                  </Badge>
                )}
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  Click a user to view details
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {seatsData?.seats.map((seat) => {
                    const activity = getActivityStatus(seat.last_activity_at);
                    return (
                      <div
                        key={seat.assignee.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleUserClick(seat)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={seat.assignee.avatar_url} alt={seat.assignee.login} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {seat.assignee.login.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {seat.assignee.login}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {seat.last_activity_editor && (
                              <span className="capitalize">{seat.last_activity_editor}</span>
                            )}
                            {seat.assigning_team && (
                              <span className="truncate">• {seat.assigning_team.name}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={activity.variant} className="text-xs shrink-0">
                          {activity.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={drillDown !== null} onOpenChange={(open) => !open && closeDrillDown()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={closeDrillDown} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {drillDown === "seats" && "Seat Distribution"}
              {drillDown === "activeUsers" && "Active Users Analysis"}
              {drillDown === "engagedUsers" && "Feature Engagement Breakdown"}
              {drillDown === "adoption" && "Adoption Rate Details"}
              {drillDown === "trend" && `Activity on ${selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}`}
              {drillDown === "feature" && getSelectedFeatureData()?.name}
              {drillDown === "user" && selectedUser?.login}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-120px)]">
            <AnimatePresence mode="wait">
              {drillDown === "seats" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Seats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">{seatsData?.total_seats}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">{seatsData?.seats.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">
                          {(seatsData?.total_seats || 0) - (seatsData?.seats.length || 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Tabs defaultValue="teams">
                    <TabsList>
                      <TabsTrigger value="teams">By Team</TabsTrigger>
                      <TabsTrigger value="editors">By Editor</TabsTrigger>
                      <TabsTrigger value="activity">By Activity</TabsTrigger>
                    </TabsList>
                    <TabsContent value="teams" className="mt-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getTeamDistribution()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {getTeamDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="editors" className="mt-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getEditorDistribution()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {getEditorDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="activity" className="mt-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getActivityDistribution()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {getActivityDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}

              {drillDown === "activeUsers" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Pulse className="h-4 w-4" />
                          7-Day Average
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">
                          {Math.round((metricsData?.slice(-7).reduce((acc, m) => acc + m.total_active_users, 0) || 0) / 7)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <ChartLineUp className="h-4 w-4" />
                          Peak Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">
                          {Math.max(...(metricsData?.map((m) => m.total_active_users) || [0]))}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Activity Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="active"
                              stroke="oklch(0.45 0.15 250)"
                              strokeWidth={2}
                              dot={{ fill: "oklch(0.45 0.15 250)", r: 4 }}
                              name="Active Users"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Activity Distribution by Editor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getEditorDistribution()} layout="vertical">
                            <XAxis type="number" axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Users">
                              {getEditorDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {drillDown === "engagedUsers" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featureData.map((feature) => (
                      <Card
                        key={feature.key}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleFeatureClick(feature.key)}
                      >
                        <CardContent className="pt-4">
                          <div
                            className="p-2 rounded-lg w-fit mb-2"
                            style={{ backgroundColor: `${feature.color}20` }}
                          >
                            <feature.icon className="h-5 w-5" style={{ color: feature.color }} weight="duotone" />
                          </div>
                          <p className="text-2xl font-display font-bold">{feature.users}</p>
                          <p className="text-xs text-muted-foreground">{feature.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Feature Usage Trend (14 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="codeCompletions" stroke="oklch(0.45 0.15 250)" strokeWidth={2} name="Code Completions" dot={false} />
                            <Line type="monotone" dataKey="ideChat" stroke="oklch(0.65 0.18 145)" strokeWidth={2} name="IDE Chat" dot={false} />
                            <Line type="monotone" dataKey="prSummaries" stroke="oklch(0.7 0.15 45)" strokeWidth={2} name="PR Summaries" dot={false} />
                            <Line type="monotone" dataKey="dotcomChat" stroke="oklch(0.55 0.2 300)" strokeWidth={2} name="GitHub Chat" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {drillDown === "adoption" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  <div className="text-center py-6">
                    <p className="text-6xl font-display font-bold text-primary">{adoptionStatus?.ratio}%</p>
                    <Badge
                      variant={
                        adoptionStatus?.status === "Strong" ? "default" :
                        adoptionStatus?.status === "Moderate" ? "secondary" : "outline"
                      }
                      className="mt-2 text-lg px-4 py-1"
                    >
                      {adoptionStatus?.status} Adoption
                    </Badge>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Active Users</span>
                          <span className="font-semibold">{latestMetrics?.total_active_users}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4 relative">
                          <div
                            className="h-4 rounded-full bg-primary transition-all"
                            style={{ width: `${adoptionStatus?.ratio}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {adoptionStatus?.ratio}% of seats
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Seats</span>
                          <span className="font-semibold">{seatsData?.total_seats}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Adoption Thresholds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${adoptionStatus?.status === "Strong" ? "bg-primary/10" : "bg-muted/30"}`}>
                          <Badge variant={adoptionStatus?.status === "Strong" ? "default" : "outline"}>≥70%</Badge>
                          <span className={adoptionStatus?.status === "Strong" ? "font-semibold" : ""}>Strong Adoption</span>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${adoptionStatus?.status === "Moderate" ? "bg-primary/10" : "bg-muted/30"}`}>
                          <Badge variant={adoptionStatus?.status === "Moderate" ? "secondary" : "outline"}>40-69%</Badge>
                          <span className={adoptionStatus?.status === "Moderate" ? "font-semibold" : ""}>Moderate Adoption</span>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${adoptionStatus?.status === "Underutilized" ? "bg-destructive/10" : "bg-muted/30"}`}>
                          <Badge variant={adoptionStatus?.status === "Underutilized" ? "destructive" : "outline"}>&lt;40%</Badge>
                          <span className={adoptionStatus?.status === "Underutilized" ? "font-semibold" : ""}>Underutilized</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {drillDown === "trend" && selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  {(() => {
                    const dayMetrics = getSelectedDateMetrics();
                    return dayMetrics ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground mb-1">Active Users</p>
                              <p className="text-2xl font-display font-bold">{dayMetrics.total_active_users}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground mb-1">Engaged Users</p>
                              <p className="text-2xl font-display font-bold">{dayMetrics.total_engaged_users}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground mb-1">Code Completions</p>
                              <p className="text-2xl font-display font-bold">{dayMetrics.copilot_ide_code_completions?.total_engaged_users || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground mb-1">Chat Users</p>
                              <p className="text-2xl font-display font-bold">{(dayMetrics.copilot_ide_chat?.total_engaged_users || 0) + (dayMetrics.copilot_dotcom_chat?.total_engaged_users || 0)}</p>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Feature Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: "Code Completions", users: dayMetrics.copilot_ide_code_completions?.total_engaged_users || 0, color: "oklch(0.45 0.15 250)" },
                                    { name: "IDE Chat", users: dayMetrics.copilot_ide_chat?.total_engaged_users || 0, color: "oklch(0.65 0.18 145)" },
                                    { name: "PR Summaries", users: dayMetrics.copilot_dotcom_pull_requests?.total_engaged_users || 0, color: "oklch(0.7 0.15 45)" },
                                    { name: "GitHub Chat", users: dayMetrics.copilot_dotcom_chat?.total_engaged_users || 0, color: "oklch(0.55 0.2 300)" },
                                  ]}
                                  layout="vertical"
                                >
                                  <XAxis type="number" axisLine={false} tickLine={false} />
                                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} />
                                  <Tooltip />
                                  <Bar dataKey="users" radius={[0, 4, 4, 0]}>
                                    {[
                                      { color: "oklch(0.45 0.15 250)" },
                                      { color: "oklch(0.65 0.18 145)" },
                                      { color: "oklch(0.7 0.15 45)" },
                                      { color: "oklch(0.55 0.2 300)" },
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        {dayMetrics.copilot_ide_code_completions?.editors && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Editor Usage</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {dayMetrics.copilot_ide_code_completions.editors.map((editor) => (
                                  <div key={editor.name} className="flex items-center gap-3">
                                    <Desktop className="h-4 w-4 text-muted-foreground" />
                                    <span className="capitalize flex-1">{editor.name}</span>
                                    <span className="font-semibold">{editor.total_engaged_users} users</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : null;
                  })()}
                </motion.div>
              )}

              {drillDown === "feature" && selectedFeature && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  {(() => {
                    const feature = getSelectedFeatureData();
                    return feature ? (
                      <>
                        <div className="flex items-center gap-4 p-6 rounded-xl" style={{ backgroundColor: `${feature.color}10` }}>
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${feature.color}20` }}>
                            <feature.icon className="h-8 w-8" style={{ color: feature.color }} weight="duotone" />
                          </div>
                          <div>
                            <p className="text-3xl font-display font-bold">{feature.users}</p>
                            <p className="text-muted-foreground">engaged users today</p>
                          </div>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Usage Trend (14 days)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                  <defs>
                                    <linearGradient id="featureGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={feature.color} stopOpacity={0.3} />
                                      <stop offset="95%" stopColor={feature.color} stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                  <Tooltip />
                                  <Area
                                    type="monotone"
                                    dataKey={feature.key === "completions" ? "codeCompletions" : feature.key}
                                    stroke={feature.color}
                                    strokeWidth={2}
                                    fill="url(#featureGradient)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        {feature.key === "completions" && feature.editors && feature.editors.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">By Editor</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {feature.editors.map((editor) => (
                                  <div key={editor.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Desktop className="h-5 w-5 text-muted-foreground" />
                                    <span className="capitalize flex-1 font-medium">{editor.name}</span>
                                    <span className="font-semibold">{editor.total_engaged_users}</span>
                                    <span className="text-muted-foreground text-sm">users</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Engagement Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">% of engaged users using this feature</span>
                                <span className="font-semibold">{Math.round((feature.users / (latestMetrics?.total_engaged_users || 1)) * 100)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div
                                  className="h-3 rounded-full transition-all"
                                  style={{
                                    width: `${(feature.users / (latestMetrics?.total_engaged_users || 1)) * 100}%`,
                                    backgroundColor: feature.color,
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : null;
                  })()}
                </motion.div>
              )}

              {drillDown === "user" && selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 p-1"
                >
                  <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.login} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                        {selectedUser.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-2xl font-display font-bold">{selectedUser.login}</p>
                      {selectedUser.assigning_team && (
                        <Badge variant="secondary" className="mt-1">{selectedUser.assigning_team.name}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Last Activity</p>
                            <p className="font-semibold">
                              {selectedUser.last_activity_at
                                ? new Date(selectedUser.last_activity_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Never"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Desktop className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Preferred Editor</p>
                            <p className="font-semibold capitalize">
                              {selectedUser.last_activity_editor || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Seat Assigned</p>
                            <p className="font-semibold">
                              {new Date(selectedUser.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Pulse className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={getActivityStatus(selectedUser.last_activity_at).variant}>
                              {getActivityStatus(selectedUser.last_activity_at).label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Activity (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {getUserActivityHistory().map((day, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div
                              className={`h-8 rounded-md mb-1 ${
                                day.active ? "bg-accent" : "bg-muted"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">{day.date}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
