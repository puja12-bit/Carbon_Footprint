import { useGetAchievements, useGetCarbonStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Lock, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Achievements() {
  const { data: achievements, isLoading } = useGetAchievements();
  const { data: stats } = useGetCarbonStats();

  const unlocked = achievements?.filter((a) => a.isUnlocked).length ?? 0;
  const total = achievements?.length ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Milestones unlocked on your sustainability journey.</p>
      </header>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak card */}
        <Card
          className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 md:col-span-2"
          data-testid="card-streak"
        >
          <CardContent className="p-6 flex items-center gap-6">
            <div
              className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-streak-days">
                {stats?.streakDays ?? 0} Day Streak
              </h2>
              <p className="text-muted-foreground">
                {stats?.streakDays
                  ? `You've logged carbon actions for ${stats.streakDays} consecutive day${stats.streakDays !== 1 ? "s" : ""}. Keep it up!`
                  : "Start logging actions to build your streak."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress summary */}
        <Card data-testid="card-achievement-progress">
          <CardContent className="p-6 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Badges Earned</span>
              <span className="font-bold text-lg" data-testid="text-badge-count">
                {unlocked}/{total}
              </span>
            </div>
            <Progress
              value={total > 0 ? (unlocked / total) * 100 : 0}
              className="h-2"
              aria-label={`${unlocked} of ${total} achievements unlocked`}
              data-testid="progress-overall"
            />
            <p className="text-xs text-muted-foreground">
              {total > 0
                ? `${Math.round((unlocked / total) * 100)}% complete`
                : "No achievements yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading achievements"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          data-testid="loading-achievements"
        >
          {Array.from({ length: 6 }).map((_, i) => (
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
        </div>
      )}

      {/* Achievement grid */}
      {!isLoading && achievements && (
        <ul
          className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0 m-0"
          aria-label="Achievement badges"
        >
          {achievements.map((ach) => (
            <li key={ach.id} data-testid={`achievement-${ach.id}`}>
              <Card
                className={`bg-card transition-all h-full ${
                  ach.isUnlocked
                    ? "border-primary/30 shadow-md shadow-primary/5"
                    : "opacity-70 grayscale"
                }`}
                aria-label={`${ach.title}: ${ach.isUnlocked ? "Unlocked" : "Locked"}`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        ach.isUnlocked
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {ach.isUnlocked ? (
                        <Trophy className="w-6 h-6" />
                      ) : (
                        <Lock className="w-6 h-6" />
                      )}
                    </div>
                    {ach.isUnlocked ? (
                      <span
                        className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded"
                        aria-label="Achievement unlocked"
                      >
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground" aria-hidden="true">
                        Locked
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-semibold text-lg mb-1"
                    data-testid={`text-achievement-title-${ach.id}`}
                  >
                    {ach.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {ach.description}
                  </p>

                  {!ach.isUnlocked && ach.progress != null && ach.target != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span
                          aria-label={`${Math.min(ach.progress, ach.target).toFixed(0)} of ${ach.target.toFixed(0)}`}
                        >
                          {Math.min(ach.progress, ach.target).toFixed(0)} / {ach.target.toFixed(0)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((ach.progress / ach.target) * 100, 100)}
                        className="h-1.5"
                        aria-label={`${ach.title} progress: ${Math.round(Math.min((ach.progress / ach.target) * 100, 100))} percent`}
                        data-testid={`progress-achievement-${ach.id}`}
                      />
                    </div>
                  )}

                  {ach.isUnlocked && ach.unlockedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned{" "}
                      <time dateTime={ach.unlockedAt}>
                        {new Date(ach.unlockedAt).toLocaleDateString()}
                      </time>
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
