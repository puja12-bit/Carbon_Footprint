import {
  useGetCarbonScores,
  useGetScoreHistory,
  useGetCarbonByCategory,
  useGetCarbonStats,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TreePine,
  BatteryCharging,
  Home,
  TrendingDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import { format } from "date-fns";

type Period = "week" | "month" | "year";

/** CSS chart colors drawn from the design-token palette. */
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/** Selectable time periods for the trends chart. */
const TIME_PERIODS: Period[] = ["week", "month", "year"];

/** Number of category legend items to display below the pie chart. */
const MAX_LEGEND_ITEMS = 4;

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("week");

  const { data: scores, isLoading: loadingScores } = useGetCarbonScores();
  const { data: history, isLoading: loadingHistory } = useGetScoreHistory({ period });
  const { data: breakdown, isLoading: loadingBreakdown } = useGetCarbonByCategory();
  const { data: stats, isLoading: loadingStats } = useGetCarbonStats();

  const isDecreasing = scores?.weeklyChange !== undefined && scores.weeklyChange < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your carbon footprint overview and trends.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {loadingScores ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold font-mono">{scores?.daily.toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Budget: {scores?.dailyBudget.toFixed(1)} kg
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Change</CardTitle>
            {isDecreasing ? (
              <TrendingDown
                className="h-4 w-4 text-green-500"
                aria-hidden="true"
              />
            ) : (
              <TrendingUp
                className="h-4 w-4 text-destructive"
                aria-hidden="true"
              />
            )}
          </CardHeader>
          <CardContent>
            {loadingScores ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold font-mono ${
                    isDecreasing ? "text-green-500" : "text-destructive"
                  }`}
                >
                  {scores?.weeklyChange !== undefined && scores.weeklyChange > 0 ? "+" : ""}
                  {scores?.weeklyChange?.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Equivalent Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div
                className="grid grid-cols-3 gap-4"
                role="list"
                aria-label="Environmental impact equivalents"
              >
                <div
                  className="flex flex-col items-center justify-center p-2"
                  role="listitem"
                >
                  <TreePine className="h-6 w-6 text-green-500 mb-2" aria-hidden="true" />
                  <div
                    className="text-lg font-bold"
                    aria-label={`${stats?.treesEquivalent.toFixed(1)} trees planted equivalent`}
                  >
                    {stats?.treesEquivalent.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                    Trees Planted
                  </div>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-2 border-l border-border"
                  role="listitem"
                >
                  <BatteryCharging className="h-6 w-6 text-yellow-500 mb-2" aria-hidden="true" />
                  <div
                    className="text-lg font-bold"
                    aria-label={`${stats?.phonesCharged.toLocaleString()} phones charged equivalent`}
                  >
                    {stats?.phonesCharged.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                    Phones Charged
                  </div>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-2 border-l border-border"
                  role="listitem"
                >
                  <Home className="h-6 w-6 text-blue-500 mb-2" aria-hidden="true" />
                  <div
                    className="text-lg font-bold"
                    aria-label={`${stats?.homesEquivalent?.toFixed(2) ?? "0.00"} homes powered equivalent`}
                  >
                    {stats?.homesEquivalent?.toFixed(2) ?? "0.00"}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                    Homes (Days)
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Trends Chart */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Emission Trends</CardTitle>
              <CardDescription>Your carbon footprint over time</CardDescription>
            </div>
            <div
              className="flex space-x-1 bg-muted rounded-lg p-1"
              role="group"
              aria-label="Select time period"
            >
              {TIME_PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  aria-label={`Show ${p} data`}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                    period === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingHistory ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <figure aria-label={`Emission trends chart for the past ${period}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={history}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val: string) =>
                        format(new Date(val), period === "year" ? "MMM" : "MMM d")
                      }
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val: number) => `${val}kg`}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelFormatter={(val: string) =>
                        format(new Date(val), "MMM d, yyyy")
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="co2Kg"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCo2)"
                      name="CO₂ (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </figure>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your emissions come from</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            {loadingBreakdown ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : (
              <figure aria-label="Category breakdown pie chart showing emissions by category">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={breakdown}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                      stroke="none"
                    >
                      {breakdown?.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.category}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          aria-label={`${entry.category}: ${entry.percentage?.toFixed(1)}%`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Percentage",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </figure>
            )}
            <ul
              className="grid grid-cols-2 gap-2 mt-4 list-none p-0 m-0"
              aria-label="Category colour legend"
            >
              {breakdown?.slice(0, MAX_LEGEND_ITEMS).map((cat, i) => (
                <li key={cat.category} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-muted-foreground capitalize">
                    {cat.category}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
