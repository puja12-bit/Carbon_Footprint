import { useState, useEffect } from "react";
import { useEstimateCarbon, useSaveCarbonEntry, getListCarbonEntriesQueryKey, getGetRecentEntriesQueryKey, getGetCarbonStatsQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/lib/use-debounce";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, Save, Zap, Info, ShieldCheck, Activity, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const estimateMutation = useEstimateCarbon();
  const saveMutation = useSaveCarbonEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (debouncedQuery.trim().length > 3) {
      estimateMutation.mutate({ data: { query: debouncedQuery } });
    }
  }, [debouncedQuery]);

  const handleSave = () => {
    if (!estimateMutation.data) return;
    
    saveMutation.mutate({
      data: {
        action: estimateMutation.data.action,
        category: estimateMutation.data.category,
        co2Kg: estimateMutation.data.co2Kg,
        alternatives: JSON.stringify(estimateMutation.data.alternatives),
        explanation: estimateMutation.data.explanation
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Saved to history",
          description: "This action has been added to your footprint.",
        });
        queryClient.invalidateQueries({ queryKey: getListCarbonEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCarbonStatsQueryKey() });
        setQuery("");
        estimateMutation.reset();
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="w-full max-w-3xl text-center space-y-4">
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 px-3 py-1">
          <Activity className="w-3 h-3 mr-2 inline-block" /> Live Carbon Radar
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">What are you planning?</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Type any action to instantly see its carbon footprint and discover greener alternatives before you commit.
        </p>
      </div>

      <div className="w-full max-w-3xl relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative relative">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Flight from London to Paris, driving 20 miles..." 
            className="h-20 text-2xl px-8 rounded-2xl bg-card border-2 border-border focus-visible:border-primary shadow-xl"
          />
          {estimateMutation.isPending && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-medium animate-pulse">Computing...</span>
            </div>
          )}
        </div>
      </div>

      {estimateMutation.data && !estimateMutation.isPending && (
        <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-primary/10 p-6 border-b border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">{estimateMutation.data.category}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary" /> 
                    {Math.round(estimateMutation.data.confidenceScore * 100)}% Confidence
                  </span>
                </div>
                <h2 className="text-2xl font-semibold">{estimateMutation.data.action}</h2>
              </div>
              <div className="text-right">
                <div className="text-4xl font-mono font-bold text-primary tabular-nums">
                  {estimateMutation.data.co2Kg.toFixed(1)} <span className="text-xl text-muted-foreground font-sans">kg CO₂</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50 text-sm">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-muted-foreground leading-relaxed">{estimateMutation.data.explanation}</p>
              </div>

              {estimateMutation.data.factors && estimateMutation.data.factors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">Key Factors</h3>
                  <div className="flex flex-wrap gap-2">
                    {estimateMutation.data.factors.map((f, i) => (
                      <Badge key={i} variant="outline" className="bg-background">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {estimateMutation.data.alternatives && estimateMutation.data.alternatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Greener Alternatives
                  </h3>
                  <div className="grid gap-3">
                    {estimateMutation.data.alternatives.map((alt, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors gap-4">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {alt.label}
                            {alt.reductionPercent > 50 && <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20 border-none">High Impact</Badge>}
                          </div>
                          {alt.description && <p className="text-sm text-muted-foreground mt-1">{alt.description}</p>}
                        </div>
                        <div className="flex items-center gap-4 text-sm whitespace-nowrap shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-green-500">-{alt.reductionPercent}% CO₂</div>
                            <div className="text-muted-foreground text-xs">{alt.co2Kg.toFixed(1)} kg total</div>
                          </div>
                          {alt.extraTimeMinutes && (
                            <div className="text-right border-l border-border pl-4 hidden sm:block">
                              <div className="font-medium">+{alt.extraTimeMinutes} min</div>
                              <div className="text-muted-foreground text-xs">Extra time</div>
                            </div>
                          )}
                          {alt.moneySavedUsd && (
                            <div className="text-right border-l border-border pl-4 hidden sm:block">
                              <div className="font-medium text-green-500">-${alt.moneySavedUsd}</div>
                              <div className="text-muted-foreground text-xs">Saved</div>
                            </div>
                          )}
                          <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-muted/30 p-4 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setQuery(""); estimateMutation.reset(); }}>Clear</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? <span className="animate-spin mr-1">⚪</span> : <Save className="w-4 h-4" />}
                Log this action
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
