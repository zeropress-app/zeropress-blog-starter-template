import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ThemedHome, ThemedPostDetail, ThemedNotFound } from "@/components/ThemedRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/AdminLayout";
import AdminPosts from "./pages/AdminPosts";
import AdminPostEditor from "./pages/AdminPostEditor";
import AdminPages from "./pages/AdminPages";
import AdminPageEditor from "./pages/AdminPageEditor";
import AdminHealth from "./pages/AdminHealth";
import AdminSchemaManager from "./pages/AdminSchemaManager";
import AdminComments from "./pages/AdminComments";
import AdminOptionsGeneral from "./pages/AdminOptionsGeneral";
import AdminMenus from "./pages/AdminMenus";
import AdminThemes from "./pages/AdminThemes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SiteSettingsProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<ThemedHome />} />
                <Route path="/post/:id" element={<ThemedPostDetail />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminPosts />} />
                  <Route path="pages" element={<AdminPages />} />
                  <Route path="page/new" element={<AdminPageEditor />} />
                  <Route path="page/edit/:id" element={<AdminPageEditor />} />
                  <Route path="comments" element={<AdminComments />} />
                  <Route path="menus" element={<AdminMenus />} />
                  <Route path="themes" element={<AdminThemes />} />
                  <Route path="options-general" element={<AdminOptionsGeneral />} />
                  <Route path="health" element={<AdminHealth />} />
                  <Route path="schema" element={<AdminSchemaManager />} />
                  <Route path="post/new" element={<AdminPostEditor />} />
                  <Route path="post/edit/:id" element={<AdminPostEditor />} />
                </Route>
                <Route path="*" element={<ThemedNotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </NextThemeProvider>
  </QueryClientProvider>
);

export default App;
