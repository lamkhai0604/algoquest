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
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UiKitPage } from "./pages/UiKitPage";
import { ThemeProvider } from "./theme/ThemeProvider";

const EMPTY_STATS = { streakDays: 0, totalXp: 0, hintsLeft: 0 };

export function AppRoutes() {
  const waking = useServerWaking();
  const { state, signOut } = useAuth();
  let account: HeaderAccount | undefined;
  if (state.status === "signed-in") {
    account = { name: state.user.displayName, onSignOut: signOut };
  }

  return (
    <>
      <AppHeader stats={EMPTY_STATS} account={account} />
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
