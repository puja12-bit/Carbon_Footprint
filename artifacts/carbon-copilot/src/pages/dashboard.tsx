import { useGetCarbonScores, useGetScoreHistory, useGetCarbonByCategory, useGetCarbonStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TreePine, BatteryCharging, Home, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  
  const { data: scores, isLoading: loadingScores } = useGetCarbonScores();
  const { data: history, isLoading: loadingHistory } = useGetScoreHistory({ period });
  const { data: breakdown, isLoading: loadingBreakdown } = useGetCarbonByCategory();
  const { data: stats, isLoading: loadingStats } = useGetCarbonStats();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingScores ? <Skeleton className="h-8 w-24" /> : (
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
            {scores?.weeklyChange && scores.weeklyChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            {loadingScores ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className={`text-2xl font-bold font-mono ${scores?.weeklyChange && scores.weeklyChange < 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {scores?.weeklyChange && scores.weeklyChange > 0 ? '+' : ''}{scores?.weeklyChange?.toFixed(1)}%
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
            {loadingStats ? <Skeleton className="h-8 w-full" /> : (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-2">
                  <TreePine className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-lg font-bold">{stats?.treesEquivalent.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Trees Planted</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-l border-border">
                  <BatteryCharging className="h-6 w-6 text-yellow-500 mb-2" />
                  <div className="text-lg font-bold">{stats?.phonesCharged.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Phones Charged</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-l border-border">
                  <Home className="h-6 w-6 text-blue-500 mb-2" />
                  <div className="text-lg font-bold">{stats?.homesEquivalent?.toFixed(2) || '0.00'}</div>
                  <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Homes (Days)</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Chart */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Emission Trends</CardTitle>
              <CardDescription>Your carbon footprint over time</CardDescription>
            </div>
            <div className="flex space-x-1 bg-muted rounded-lg p-1">
              {(["week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingHistory ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), period === 'year' ? 'MMM' : 'MMM d')}
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
                    tickFormatter={(val) => `${val}kg`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  />
                  <Area type="monotone" dataKey="co2Kg" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCo2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your emissions come from</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            {loadingBreakdown ? <Skeleton className="w-full h-full rounded-full" /> : (
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {breakdown?.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="truncate text-muted-foreground capitalize">{cat.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
