import { useState } from "react";
import { useListCarbonEntries, useDeleteCarbonEntry, getListCarbonEntriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Leaf, Clock, Plane, ShoppingBag, Zap, Utensils, MoreHorizontal, Car } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function HistoryPage() {
  const { data: entries, isLoading } = useListCarbonEntries();
  const deleteMutation = useDeleteCarbonEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4" />;
      case 'energy': return <Zap className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Entry deleted" });
        queryClient.invalidateQueries({ queryKey: getListCarbonEntriesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History Feed</h1>
        <p className="text-muted-foreground">Review your logged carbon footprint actions.</p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[4.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Loading history...</div>}
        
        {!isLoading && entries?.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-card/50">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No history yet</h3>
            <p className="text-muted-foreground mt-1">Go to the Live Radar to log your first action.</p>
          </div>
        )}

        {entries?.map((entry) => (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-primary">
              {getCategoryIcon(entry.category)}
            </div>

            {/* Content Card */}
            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                        {entry.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(entry.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-medium text-lg leading-tight">{entry.action}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-baseline gap-2 mt-4 pt-4 border-t border-border/50">
                  <div className="text-2xl font-bold font-mono text-primary tabular-nums">
                    {entry.co2Kg.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono uppercase">kg CO₂</div>
                  
                  {entry.savedCo2Kg && entry.savedCo2Kg > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-sm text-green-500 font-medium">
                      <Leaf className="w-3 h-3" /> Saved {entry.savedCo2Kg.toFixed(1)}kg
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
