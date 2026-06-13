import { useListCarbonEntries, useDeleteCarbonEntry, getListCarbonEntriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Trash2, Leaf, Clock, Plane, ShoppingBag, Zap, Utensils, MoreHorizontal, Car } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "flight":
      return <Plane className="w-4 h-4" aria-hidden="true" />;
    case "food":
      return <Utensils className="w-4 h-4" aria-hidden="true" />;
    case "shopping":
      return <ShoppingBag className="w-4 h-4" aria-hidden="true" />;
    case "energy":
      return <Zap className="w-4 h-4" aria-hidden="true" />;
    case "transport":
      return <Car className="w-4 h-4" aria-hidden="true" />;
    default:
      return <Leaf className="w-4 h-4" aria-hidden="true" />;
  }
}

export default function HistoryPage() {
  const { data: entries, isLoading } = useListCarbonEntries();
  const deleteMutation = useDeleteCarbonEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number, action: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Entry deleted", description: `"${action}" removed from history.` });
          queryClient.invalidateQueries({ queryKey: getListCarbonEntriesQueryKey() });
        },
        onError: () => {
          toast({ title: "Could not delete entry", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">History Feed</h1>
        <p className="text-muted-foreground">Review your logged carbon footprint actions.</p>
      </header>

      {/* Loading skeletons */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading history"
          className="space-y-4"
          data-testid="loading-history"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries?.length === 0 && (
        <div
          className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-card/50"
          role="status"
          aria-label="No history entries"
          data-testid="empty-history"
        >
          <Clock
            className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50"
            aria-hidden="true"
          />
          <h2 className="text-lg font-medium">No history yet</h2>
          <p className="text-muted-foreground mt-1">
            Go to the Live Radar to log your first action.
          </p>
        </div>
      )}

      {/* Timeline feed */}
      {!isLoading && entries && entries.length > 0 && (
        <ol
          aria-label="Carbon footprint history"
          className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[4.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent list-none p-0 m-0"
        >
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              data-testid={`entry-item-${entry.id}`}
            >
              {/* Timeline dot */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-primary"
                aria-hidden="true"
              >
                {getCategoryIcon(entry.category)}
              </div>

              {/* Content Card */}
              <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider font-semibold"
                          data-testid={`badge-category-${entry.id}`}
                        >
                          {entry.category}
                        </Badge>
                        <time
                          dateTime={entry.createdAt}
                          className="text-xs text-muted-foreground font-mono"
                        >
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </time>
                      </div>
                      <h2 className="font-medium text-lg leading-tight" data-testid={`text-action-${entry.id}`}>
                        {entry.action}
                      </h2>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 -mt-2 shrink-0"
                          aria-label={`Options for ${entry.action}`}
                          data-testid={`button-entry-menu-${entry.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(entry.id, entry.action)}
                          data-testid={`button-delete-${entry.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div
                    className="flex items-baseline gap-2 mt-4 pt-4 border-t border-border/50"
                    aria-label={`${entry.co2Kg.toFixed(1)} kilograms CO2${entry.savedCo2Kg && entry.savedCo2Kg > 0 ? `, saved ${entry.savedCo2Kg.toFixed(1)} kg by choosing greener option` : ""}`}
                  >
                    <div
                      className="text-2xl font-bold font-mono text-primary tabular-nums"
                      data-testid={`text-co2-${entry.id}`}
                    >
                      {entry.co2Kg.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono uppercase">kg CO₂</div>
                    {entry.savedCo2Kg && entry.savedCo2Kg > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-sm text-green-500 font-medium">
                        <Leaf className="w-3 h-3" aria-hidden="true" />
                        Saved {entry.savedCo2Kg.toFixed(1)}kg
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
