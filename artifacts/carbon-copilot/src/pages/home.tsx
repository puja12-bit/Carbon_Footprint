import { useState, useEffect, useRef } from "react";
import { useEstimateCarbon, useSaveCarbonEntry, getListCarbonEntriesQueryKey, getGetRecentEntriesQueryKey, getGetCarbonStatsQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/lib/use-debounce";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, Save, Zap, Info, ShieldCheck, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const estimateMutation = useEstimateCarbon();
  const saveMutation = useSaveCarbonEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length > 3) {
      estimateMutation.mutate({ data: { query: debouncedQuery } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Announce results to screen readers when they arrive
  useEffect(() => {
    if (estimateMutation.data && !estimateMutation.isPending) {
      resultsRef.current?.focus();
    }
  }, [estimateMutation.data, estimateMutation.isPending]);

  const handleSave = () => {
    if (!estimateMutation.data) return;

    saveMutation.mutate(
      {
        data: {
          action: estimateMutation.data.action,
          category: estimateMutation.data.category,
          co2Kg: estimateMutation.data.co2Kg,
          alternatives: JSON.stringify(estimateMutation.data.alternatives),
          explanation: estimateMutation.data.explanation,
        },
      },
      {
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
          inputRef.current?.focus();
        },
      },
    );
  };

  const handleClear = () => {
    setQuery("");
    estimateMutation.reset();
    inputRef.current?.focus();
  };

  const hasResult = estimateMutation.data && !estimateMutation.isPending;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="w-full max-w-3xl text-center space-y-4">
        <Badge
          variant="outline"
          className="text-primary border-primary/30 bg-primary/10 px-3 py-1"
          aria-hidden="true"
        >
          <Activity className="w-3 h-3 mr-2 inline-block" /> Live Carbon Radar
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          What are you planning?
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto" id="radar-description">
          Type any action to instantly see its carbon footprint and discover greener alternatives
          before you commit.
        </p>
      </div>

      <div className="w-full max-w-3xl relative group">
        <div
          className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"
          aria-hidden="true"
        />
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Flight from London to Paris, driving 20 miles..."
            className="h-20 text-2xl px-8 rounded-2xl bg-card border-2 border-border focus-visible:border-primary shadow-xl"
            aria-label="Describe your action to estimate its carbon footprint"
            aria-describedby="radar-description"
            aria-busy={estimateMutation.isPending}
            data-testid="input-carbon-query"
            autoComplete="off"
            spellCheck={false}
          />
          {estimateMutation.isPending && (
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary"
              aria-hidden="true"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-sm font-medium animate-pulse">Computing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="sr-live-region"
      >
        {hasResult
          ? `Estimated ${estimateMutation.data.co2Kg.toFixed(1)} kg CO₂ for ${estimateMutation.data.action}. ${estimateMutation.data.alternatives.length} greener alternatives available.`
          : estimateMutation.isPending
            ? "Computing carbon estimate…"
            : ""}
      </div>

      {estimateMutation.isError && (
        <div
          role="alert"
          className="w-full max-w-3xl flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive"
          data-testid="error-estimate"
        >
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">Could not estimate carbon footprint. Please try again.</p>
        </div>
      )}

      {hasResult && (
        <div
          className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500"
          ref={resultsRef}
          tabIndex={-1}
          aria-label={`Carbon estimate result for ${estimateMutation.data.action}`}
          data-testid="carbon-estimate-result"
        >
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-primary/10 p-6 border-b border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize" data-testid="badge-category">
                    {estimateMutation.data.category}
                  </Badge>
                  <span
                    className="text-xs text-muted-foreground flex items-center gap-1"
                    aria-label={`Confidence: ${Math.round(estimateMutation.data.confidenceScore * 100)} percent`}
                  >
                    <ShieldCheck className="w-3 h-3 text-primary" aria-hidden="true" />
                    {Math.round(estimateMutation.data.confidenceScore * 100)}% Confidence
                  </span>
                </div>
                <h2 className="text-2xl font-semibold" data-testid="text-action">
                  {estimateMutation.data.action}
                </h2>
              </div>
              <div className="text-right" aria-label={`${estimateMutation.data.co2Kg.toFixed(1)} kilograms of CO2`}>
                <div
                  className="text-4xl font-mono font-bold text-primary tabular-nums"
                  data-testid="text-co2-value"
                >
                  {estimateMutation.data.co2Kg.toFixed(1)}{" "}
                  <span className="text-xl text-muted-foreground font-sans">kg CO₂</span>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <div
                className="flex gap-4 p-4 rounded-lg bg-muted/50 text-sm"
                role="note"
                aria-label="Explanation"
              >
                <Info className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <p className="text-muted-foreground leading-relaxed" data-testid="text-explanation">
                  {estimateMutation.data.explanation}
                </p>
              </div>

              {estimateMutation.data.factors && estimateMutation.data.factors.length > 0 && (
                <section aria-label="Key contributing factors">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Key Factors
                  </h3>
                  <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                    {estimateMutation.data.factors.map((f, i) => (
                      <li key={i}>
                        <Badge variant="outline" className="bg-background" data-testid={`badge-factor-${i}`}>
                          {f}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {estimateMutation.data.alternatives && estimateMutation.data.alternatives.length > 0 && (
                <section aria-label="Greener alternatives">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" aria-hidden="true" /> Greener Alternatives
                  </h3>
                  <ul className="space-y-3 list-none p-0 m-0">
                    {estimateMutation.data.alternatives.map((alt, i) => (
                      <li
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors gap-4"
                        data-testid={`card-alternative-${i}`}
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {alt.label}
                            {alt.reductionPercent > 50 && (
                              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20 border-none">
                                High Impact
                              </Badge>
                            )}
                          </div>
                          {alt.description && (
                            <p className="text-sm text-muted-foreground mt-1">{alt.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm whitespace-nowrap shrink-0">
                          <div
                            className="text-right"
                            aria-label={`${alt.reductionPercent} percent CO2 reduction, ${alt.co2Kg.toFixed(1)} kg total`}
                          >
                            <div className="font-mono font-bold text-green-500" data-testid={`text-reduction-${i}`}>
                              -{alt.reductionPercent}% CO₂
                            </div>
                            <div className="text-muted-foreground text-xs">{alt.co2Kg.toFixed(1)} kg total</div>
                          </div>
                          {alt.extraTimeMinutes && (
                            <div
                              className="text-right border-l border-border pl-4 hidden sm:block"
                              aria-label={`${alt.extraTimeMinutes} minutes extra travel time`}
                            >
                              <div className="font-medium">+{alt.extraTimeMinutes} min</div>
                              <div className="text-muted-foreground text-xs">Extra time</div>
                            </div>
                          )}
                          {alt.moneySavedUsd && (
                            <div
                              className="text-right border-l border-border pl-4 hidden sm:block"
                              aria-label={`${alt.moneySavedUsd} dollars saved`}
                            >
                              <div className="font-medium text-green-500">-${alt.moneySavedUsd}</div>
                              <div className="text-muted-foreground text-xs">Saved</div>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-full"
                            aria-label={`Select ${alt.label} as alternative`}
                            data-testid={`button-select-alt-${i}`}
                          >
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </CardContent>

            <CardFooter className="bg-muted/30 p-4 border-t border-border flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                data-testid="button-clear"
                aria-label="Clear current estimate and start over"
              >
                Clear
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
                data-testid="button-save-entry"
                aria-label="Log this action to your carbon history"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                Log this action
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
