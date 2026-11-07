import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../App";
import { fakeApi, inFourHours, json, ME } from "../test/fakeApi";
import { ThemeProvider } from "../theme/ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { getToken, setSession } from "./session";

const SIGN_IN = "http://localhost:8080/oauth2/authorization";

const isExchange = (url: unknown) =>
  String(url).endsWith("/api/v1/auth/exchange");

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe("sign-in", () => {
  it("sends a signed-out visitor to the sign-in page", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { name: "Sign in to AlgoQuest" }),
    ).toBeVisible();
    expect(screen.queryByTitle("Total XP")).toBeNull();
  });

  it("links both providers to the backend sign-in", () => {
    renderAt("/sign-in");

    const google = screen.getByRole("link", { name: "Continue with Google" });
    const github = screen.getByRole("link", { name: "Continue with GitHub" });
    expect(google).toHaveAttribute("href", `${SIGN_IN}/google`);
    expect(github).toHaveAttribute("href", `${SIGN_IN}/github`);
  });

  it("explains a failed sign-in", () => {
    renderAt("/sign-in?error=email-not-verified");

    expect(screen.getByRole("alert")).toHaveTextContent("no verified email");
  });

  it("trades the code for a token and opens the level map", async () => {
    const fetchFn = fakeApi({
      "POST /api/v1/auth/exchange": () =>
        json(200, { token: "jwt-1", expiresAt: inFourHours() }),
      "GET /api/v1/me": () => json(200, ME),
    });

    renderAt("/auth/callback?code=abc");

    expect(
      await screen.findByRole("heading", { name: "Your quest" }),
    ).toBeVisible();
    expect(screen.getByText("Ann")).toBeVisible();
    expect(getToken()).toBe("jwt-1");
    const exchanges = fetchFn.mock.calls.filter(([url]) => isExchange(url));
    expect(exchanges).toHaveLength(1);
  });

  it("shows an error when the code was already used", async () => {
    fakeApi({
      "POST /api/v1/auth/exchange": () =>
        json(400, { title: "Invalid sign-in code" }),
    });

    renderAt("/auth/callback?code=used");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign-in did not finish",
    );
    expect(getToken()).toBeNull();
  });

  it("signs out and returns to the sign-in page", async () => {
    fakeApi({ "GET /api/v1/me": () => json(200, ME) });
    setSession({ token: "jwt-1", expiresAt: inFourHours() });

    renderAt("/");
    await screen.findByRole("heading", { name: "Your quest" });
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      await screen.findByRole("heading", { name: "Sign in to AlgoQuest" }),
    ).toBeVisible();
    expect(getToken()).toBeNull();
  });

  it("signs out when the server rejects the token", async () => {
    fakeApi({ "GET /api/v1/me": () => json(401, { title: "Unauthorized" }) });
    setSession({ token: "expired-on-server", expiresAt: inFourHours() });

    renderAt("/");

    expect(
      await screen.findByRole("heading", { name: "Sign in to AlgoQuest" }),
    ).toBeVisible();
  });
});
