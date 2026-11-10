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
import { totalXp, useGame } from "./game/gameContext";
import { GameProvider } from "./game/GameProvider";
import { HomePage } from "./pages/HomePage";
import { LevelPage } from "./pages/LevelPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UiKitPage } from "./pages/UiKitPage";
import { ThemeProvider } from "./theme/ThemeProvider";

export function AppRoutes() {
  const waking = useServerWaking();
  const { state, signOut } = useAuth();
  const { levels } = useGame();
  // Streak and hints arrive with their features; XP is the sum over levels.
  const stats = { streakDays: 0, totalXp: totalXp(levels), hintsLeft: 0 };
  let account: HeaderAccount | undefined;
  if (state.status === "signed-in") {
    account = { name: state.user.displayName, onSignOut: signOut };
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
