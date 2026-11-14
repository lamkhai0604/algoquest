import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { setSession } from "./auth/session";
import { fakeApi, inFourHours, json, ME } from "./test/fakeApi";

describe("App", () => {
  it("shows zero stats and the level map when signed in", async () => {
    fakeApi({ "GET /api/v1/me": () => json(200, ME) });
    setSession({ token: "jwt-1", expiresAt: inFourHours() });

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Learning Path" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /AlgoQuest/ })).toBeVisible();
    expect(screen.getByTitle("Total XP")).toHaveTextContent("0");
  });

  it("toggles the theme and remembers the choice", async () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("algoquest.theme")).toBe("light");
  });
});
