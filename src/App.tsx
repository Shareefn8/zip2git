import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AntiCopyProtection } from "@/components/AntiCopyProtection";
import { AdSlotProvider } from "@/components/AdSlotProvider";
import { FloatingDonateButton } from "@/components/FloatingDonateButton";
import { HelpCenter } from "@/components/HelpCenter";
import { WelcomeNotice } from "@/components/WelcomeNotice";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Developer from "./pages/Developer";
import Blog from "./pages/Blog";
import Tools from "./pages/Tools";
import Faq from "./pages/Faq";
import About from "./pages/About";
import Compare from "./pages/Compare";
import UseCases from "./pages/UseCases";
import Changelog from "./pages/Changelog";
import ZipToGithub from "./pages/guides/ZipToGithub";
import GithubToken from "./pages/guides/GithubToken";
import RecoverFiles from "./pages/guides/RecoverFiles";
import Gitignore from "./pages/guides/Gitignore";
import Readme from "./pages/guides/Readme";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AntiCopyProtection />
      <AdSlotProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/about" element={<About />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/guides/zip-to-github" element={<ZipToGithub />} />
            <Route path="/guides/github-token" element={<GithubToken />} />
            <Route path="/guides/recover-deleted-files" element={<RecoverFiles />} />
            <Route path="/guides/gitignore" element={<Gitignore />} />
            <Route path="/guides/readme" element={<Readme />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingDonateButton />
          <HelpCenter />
          <WelcomeNotice />
        </BrowserRouter>
      </AdSlotProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
