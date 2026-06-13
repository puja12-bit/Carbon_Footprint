import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import HistoryPage from "@/pages/history";
import Achievements from "@/pages/achievements";
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PAGE_TITLES: Record<string, string> = {
  "/": "Live Radar — Carbon Copilot AI",
  "/dashboard": "Dashboard — Carbon Copilot AI",
  "/history": "History — Carbon Copilot AI",
  "/achievements": "Achievements — Carbon Copilot AI",
  "/profile": "Profile — Carbon Copilot AI",
};

function PageTitleManager() {
  const [location] = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[location] ?? "Carbon Copilot AI";
  }, [location]);

  return null;
}

function Router() {
  return (
    <Layout>
      <PageTitleManager />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
