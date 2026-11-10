import { BrowserRouter, Route, Routes } from "react-router";
import { useServerWaking } from "./api";
import {
  AuthCallbackPage,
  AuthProvider,
  RequireAuth,
  SignInPage,
  useAuth,
} from "./auth";
import { AppHeader, WakingServer } from "./components";
import type { HeaderAccount } from "./components";
import { hintsLeft, streakDays, totalXp, useGame } from "./game/gameContext";
import { GameProvider } from "./game/GameProvider";
import { LessonPage } from "./lesson/LessonPage";
import { LevelTestPage } from "./leveltest/LevelTestPage";
import { HomePage } from "./pages/HomePage";
import { LevelPage } from "./pages/LevelPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UiKitPage } from "./pages/UiKitPage";
import { VipPage } from "./pages/VipPage";
import { SolvePage } from "./solve/SolvePage";
import { ThemeProvider } from "./theme/ThemeProvider";

export function AppRoutes() {
  const waking = useServerWaking();
  const { state, signOut } = useAuth();
  const { levels, hintQuota, profile } = useGame();
  const stats = {
    streakDays: streakDays(profile),
    totalXp: totalXp(levels),
    hintsLeft: hintsLeft(hintQuota),
  };
  let account: HeaderAccount | undefined;
  if (state.status === "signed-in") {
    account = {
      name: state.user.displayName,
      onSignOut: signOut,
      isAdmin: state.user.permissions.some((p) => p.startsWith("admin.")),
    };
  }

  return (
    <>
      <AppHeader stats={stats} account={account} />
      <WakingServer visible={waking} />
      <main>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/ui-kit" element={<UiKitPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/levels/:number"
            element={
              <RequireAuth>
                <LevelPage />
              </RequireAuth>
            }
          />
          <Route
            path="/levels/:number/lesson"
            element={
              <RequireAuth>
                <LessonPage />
              </RequireAuth>
            }
          />
          <Route
            path="/problems/:id"
            element={
              <RequireAuth>
                <SolvePage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/tests/:id"
            element={
              <RequireAuth>
                <LevelTestPage />
              </RequireAuth>
            }
          />
          <Route path="/vip" element={<VipPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GameProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
