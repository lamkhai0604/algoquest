import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  WakingServer,
  XpBar,
} from ".";

describe("shared components", () => {
  it("Button calls onClick and defaults to type=button", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    const button = screen.getByRole("button", { name: "Submit" });

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("type", "button");
  });

  it("Card renders its heading and content", () => {
    render(<Card heading="Level map">Body</Card>);
    expect(screen.getByRole("heading", { name: "Level map" })).toBeVisible();
    expect(screen.getByText("Body")).toBeVisible();
  });

  it("XpBar exposes progress and clamps the value", () => {
    render(<XpBar label="Level 1" value={450} max={300} />);
    const bar = screen.getByRole("progressbar", { name: "Level 1" });
    expect(bar).toHaveAttribute("aria-valuenow", "300");
    expect(bar).toHaveAttribute("aria-valuemax", "300");
    expect(screen.getByText("300 / 300 XP")).toBeVisible();
  });

  it("Chip reports its pressed state and toggles", async () => {
    const onToggle = vi.fn();
    render(
      <Chip selected onToggle={onToggle}>
        Java
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Java" });

    expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chip);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("Badge renders its text", () => {
    render(<Badge tone="xp">+40 XP</Badge>);
    expect(screen.getByText("+40 XP")).toBeVisible();
  });

  it("LoadingState is announced as a status", () => {
    render(<LoadingState label="Grading…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Grading…");
  });

  it("ErrorState shows the message and retries", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Grader timed out" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Grader timed out");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("WakingServer renders only when visible", () => {
    const { rerender } = render(<WakingServer visible={false} />);
    expect(screen.queryByRole("status")).toBeNull();

    rerender(<WakingServer visible />);
    expect(screen.getByRole("status")).toHaveTextContent("Waking the server");
  });
});
