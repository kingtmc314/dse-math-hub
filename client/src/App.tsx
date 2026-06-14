import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Paper1Page from "./pages/Paper1Page";
import Paper2Page from "./pages/Paper2Page";
import M2Page from "./pages/M2Page";
import TopicFilterPage from "./pages/TopicFilterPage";
import TopicRankingPage from "./pages/TopicRankingPage";
import TopicMatrixPage from "./pages/TopicMatrixPage";
import MCLookupPage from "./pages/MCLookupPage";
import AnswerDistributionPage from "./pages/AnswerDistributionPage";
import MCAnswerTablePage from "./pages/MCAnswerTablePage";
import CompulsoryHubPage from "./pages/CompulsoryHubPage";
import M2HubPage from "./pages/M2HubPage";
import Layout from "./components/Layout";

// Detect base path from Vite's import.meta.env.BASE_URL
const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/compulsory" component={CompulsoryHubPage} />
      <Route path="/m2-hub" component={M2HubPage} />
      <Route path="/paper1" component={Paper1Page} />
      <Route path="/paper1/:year" component={Paper1Page} />
      <Route path="/paper2" component={Paper2Page} />
      <Route path="/paper2/:year" component={Paper2Page} />
      <Route path="/m2" component={M2Page} />
      <Route path="/m2/:year" component={M2Page} />
      <Route path="/topics" component={TopicFilterPage} />
      <Route path="/ranking" component={TopicRankingPage} />
      <Route path="/topic-matrix" component={TopicMatrixPage} />
      <Route path="/mc-lookup" component={MCLookupPage} />
      <Route path="/answer-distribution" component={AnswerDistributionPage} />
      <Route path="/mc-answer-table" component={MCAnswerTablePage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={base}>
              <Toaster />
              <Layout>
                <AppRouter />
              </Layout>
            </WouterRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
