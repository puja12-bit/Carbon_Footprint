import { useGetAchievements, useGetCarbonStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Medal, Lock, Unlock, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Achievements() {
  const { data: achievements, isLoading } = useGetAchievements();
  const { data: stats } = useGetCarbonStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Milestones unlocked on your sustainability journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 md:col-span-3">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{stats?.streakDays || 0} Day Streak</h2>
              <p className="text-muted-foreground">You've logged carbon actions for {stats?.streakDays || 0} consecutive days. Keep it up!</p>
            </div>
          </CardContent>
        </Card>

        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}

        {achievements?.map((ach) => (
          <Card key={ach.id} className={`bg-card transition-all ${ach.isUnlocked ? 'border-primary/30 shadow-md shadow-primary/5' : 'opacity-70 grayscale'}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ach.isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {ach.isUnlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                {ach.isUnlocked ? (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Unlocked</span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">Locked</span>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{ach.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ach.description}</p>
              
              {!ach.isUnlocked && ach.progress !== undefined && ach.target && (
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{ach.progress}</span>
                    <span>{ach.target}</span>
                  </div>
                  <Progress value={(ach.progress / ach.target) * 100} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
