
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateQuiz from "./pages/CreateQuiz";
import PresenterView from "./pages/PresenterView";
import AudienceView from "./pages/AudienceView";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateQuiz />} />
          <Route path="/presenter/:sessionCode" element={<PresenterView />} />
          <Route path="/join/:sessionCode" element={<AudienceView />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:quizId" element={<HistoryDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
