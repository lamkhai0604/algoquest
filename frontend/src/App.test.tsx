import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("shows the header with zero stats and the level map shell", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /AlgoQuest/ })).toBeVisible();
    expect(screen.getByTitle("Total XP")).toHaveTextContent("0");
    expect(screen.getByRole("heading", { name: "Your quest" })).toBeVisible();
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
