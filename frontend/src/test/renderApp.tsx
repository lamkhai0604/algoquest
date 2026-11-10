import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { setSession } from "../auth/session";
import { GameProvider } from "../game/GameProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import { inFourHours } from "./fakeApi";

/** Renders the whole app at a path, as a visitor. */
export function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <GameProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

/** Renders the whole app at a path with a stored session (needs GET /me). */
export function renderSignedInAt(path: string) {
  setSession({ token: "jwt-1", expiresAt: inFourHours() });
  return renderAt(path);
}
