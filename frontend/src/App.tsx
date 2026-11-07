import { BrowserRouter, Route, Routes } from "react-router";
import { useServerWaking } from "./api";
import { AppHeader, WakingServer } from "./components";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UiKitPage } from "./pages/UiKitPage";
import { ThemeProvider } from "./theme/ThemeProvider";

const EMPTY_STATS = { streakDays: 0, totalXp: 0, hintsLeft: 0 };

export function AppRoutes() {
  const waking = useServerWaking();
  return (
    <>
      <AppHeader stats={EMPTY_STATS} />
      <WakingServer visible={waking} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ui-kit" element={<UiKitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
