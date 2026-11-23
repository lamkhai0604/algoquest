import userEvent from "@testing-library/user-event";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import { sinceText } from "./notesApi";

const OWNER = {
  ...ME,
  roles: ["OWNER"],
  permissions: ["game.play", "notes.manage"],
};

const DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Keep a " },
        { type: "text", marks: [{ type: "bold" }], text: "decreasing" },
        { type: "text", text: " stack." },
      ],
    },
  ],
};

const SUMMARIES = [
  {
    id: "n-1",
    title: "Monotonic stack",
    snippet: "Keep a decreasing stack.",
    tags: ["stack", "pattern"],
    level: 1,
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "n-2",
    title: "BFS on grids",
    snippet: "Mark visited before pushing.",
    tags: ["graph"],
    level: null,
    updatedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
];

const NOTE = {
  id: "n-1",
  title: "Monotonic stack",
  body: DOC,
  tags: ["stack", "pattern"],
  level: 1,
  createdAt: "2026-11-20T10:00:00Z",
  updatedAt: "2026-11-22T10:00:00Z",
};

const calls = (
  fetchFn: ReturnType<typeof fakeApi>,
  method: string,
  end: string,
) =>
  fetchFn.mock.calls.filter(
    ([url, init]) =>
      (init?.method ?? "GET") === method && String(url).includes(end),
  );

const sentBody = (call: unknown[] | undefined) =>
  JSON.parse(String((call?.[1] as RequestInit | undefined)?.body)) as Record<
    string,
    unknown
  >;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("notes", () => {
  it("shows Notes in the navigation only to an account that keeps notes", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
    });
    renderSignedInAt("/knowledge");
    expect(
      await screen.findByRole("link", { name: "Knowledge" }),
    ).toBeVisible();
    expect(screen.queryByRole("link", { name: "Notes" })).toBeNull();
  });

  it("lists notes, searches them and filters by tag", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/notes": () => json(200, SUMMARIES),
    });
    renderSignedInAt("/notes");

    const nav = await screen.findByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Notes" })).toHaveAttribute(
      "href",
      "/notes",
    );
    expect(
      await screen.findByRole("heading", { name: "Monotonic stack" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /BFS on grids/ })).toHaveAttribute(
      "href",
      "/notes/n-2",
    );
    expect(screen.getByText("Level 1")).toBeVisible();
    const tags = screen.getByRole("group", { name: "Tags" });
    expect(
      within(tags).getByRole("button", { name: "All · 2" }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.type(screen.getByRole("searchbox"), "stack");
    await waitFor(() =>
      expect(calls(fetchFn, "GET", "/api/v1/notes?q=stack")).toHaveLength(1),
    );

    await userEvent.click(within(tags).getByRole("button", { name: "graph" }));
    await waitFor(() =>
      expect(calls(fetchFn, "GET", "tag=graph")).toHaveLength(1),
    );
  });

  it("downloads every note as a zip", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/notes": () => json(200, SUMMARIES),
      "GET /api/v1/notes/export": () =>
        new Response(new Uint8Array([80, 75, 3, 4]), { status: 200 }),
    });
    const createUrl = vi.fn(() => "blob:notes");
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: createUrl,
        revokeObjectURL: vi.fn(),
      }),
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderSignedInAt("/notes");

    await userEvent.click(
      await screen.findByRole("button", { name: "⤓ Download all (.zip)" }),
    );
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(calls(fetchFn, "GET", "/api/v1/notes/export")).toHaveLength(1);
    expect(createUrl).toHaveBeenCalled();
  });

  it("opens a note and saves a change on its own", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/notes/n-1": () => json(200, NOTE),
      "PUT /api/v1/notes/n-1": () =>
        json(200, { ...NOTE, title: "Monotonic stack 2" }),
    });
    renderSignedInAt("/notes/n-1");

    const title = await screen.findByRole("textbox", { name: "Title" });
    expect(title).toHaveValue("Monotonic stack");
    expect(await screen.findByText("decreasing")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove tag stack" }),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Level" })).toHaveValue("1");
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(within(toolbar).getByRole("button", { name: "Bold" })).toBeVisible();
    expect(
      within(toolbar).getByRole("button", { name: "Large" }),
    ).toBeVisible();

    await userEvent.type(title, " 2");
    await waitFor(
      () => expect(calls(fetchFn, "PUT", "/api/v1/notes/n-1")).toHaveLength(1),
      { timeout: 3000 },
    );
    const body = sentBody(calls(fetchFn, "PUT", "/api/v1/notes/n-1")[0]);
    expect(body).toMatchObject({
      title: "Monotonic stack 2",
      tags: ["stack", "pattern"],
      level: 1,
      bodyText: "Keep a decreasing stack.",
    });
    expect((body.body as { type: string }).type).toBe("doc");
    expect(await screen.findByText("✓ Saved")).toBeVisible();
  });

  it("creates a new note for a level once it has a title", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "POST /api/v1/notes": () =>
        json(201, {
          ...NOTE,
          id: "n-9",
          title: "Fresh",
          tags: ["dp"],
          body: DOC,
        }),
    });
    renderSignedInAt("/notes/new?level=1");

    const title = await screen.findByRole("textbox", { name: "Title" });
    await userEvent.type(
      screen.getByRole("textbox", { name: "add tag" }),
      "DP{Enter}",
    );
    await userEvent.type(title, "Fresh");
    await waitFor(
      () => expect(calls(fetchFn, "POST", "/api/v1/notes")).toHaveLength(1),
      { timeout: 3000 },
    );
    expect(sentBody(calls(fetchFn, "POST", "/api/v1/notes")[0])).toMatchObject({
      title: "Fresh",
      tags: ["dp"],
      level: 1,
    });
    // The note keeps its editor; it is not loaded again under its new address.
    expect(calls(fetchFn, "GET", "/api/v1/notes/n-9")).toHaveLength(0);
  });

  it("deletes a note after asking", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/notes/n-1": () => json(200, NOTE),
      "DELETE /api/v1/notes/n-1": () => new Response(null, { status: 204 }),
      "GET /api/v1/notes": () => json(200, []),
    });
    renderSignedInAt("/notes/n-1");

    await userEvent.click(
      await screen.findByRole("button", { name: "Delete note" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Delete this note?",
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete note" }),
    );

    expect(
      await screen.findByText("No notes yet. Start with “New note”."),
    ).toBeVisible();
    expect(calls(fetchFn, "DELETE", "/api/v1/notes/n-1")).toHaveLength(1);
  });

  it("says when a note does not exist", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
    });
    renderSignedInAt("/notes/missing");
    expect(
      await screen.findByText("This note does not exist or was deleted."),
    ).toBeVisible();
  });

  it("lists a level's notes on the level page", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/levels/1/problems": () => json(200, []),
      "GET /api/v1/notes": () => json(200, [SUMMARIES[0]]),
    });
    renderSignedInAt("/levels/1");

    const card = (
      await screen.findByRole("heading", { name: "My notes for this level" })
    ).closest("section") as HTMLElement;
    expect(
      await within(card).findByRole("link", { name: /Monotonic stack/ }),
    ).toHaveAttribute("href", "/notes/n-1");
    expect(
      within(card).getByRole("link", { name: "+ New note for this level" }),
    ).toHaveAttribute("href", "/notes/new?level=1");
  });

  it("writes the time since a change in the reader's language", () => {
    const now = Date.parse("2026-11-22T12:00:00Z");
    expect(sinceText("2026-11-22T09:00:00Z", "en", now)).toBe("3 hours ago");
    expect(sinceText("2026-11-21T12:00:00Z", "en", now)).toBe("yesterday");
    expect(sinceText("2026-11-22T11:59:50Z", "en", now)).toBe("now");
  });

  describe("quick notes on the lesson page", () => {
    const LESSON = {
      level: 1,
      title: "Big-O & Basics",
      markdown: "# Big-O & Basics\n\n## Intuition\n\nRead the list **once**.",
      walkthrough: [],
      quickCheck: [],
      quickCheckDone: false,
    };

    const lessonApi = (extra: Record<string, () => Response> = {}) =>
      fakeApi({
        "GET /api/v1/me": () => json(200, OWNER),
        "GET /api/v1/levels": () => json(200, LEVELS),
        "GET /api/v1/levels/1/lesson": () => json(200, LESSON),
        "GET /api/v1/notes": () => json(200, [SUMMARIES[0]]),
        "GET /api/v1/notes/n-1": () => json(200, NOTE),
        ...extra,
      });

    it("is not offered to an account without notes", async () => {
      fakeApi({
        "GET /api/v1/me": () => json(200, ME),
        "GET /api/v1/levels": () => json(200, LEVELS),
        "GET /api/v1/levels/1/lesson": () => json(200, LESSON),
      });
      renderSignedInAt("/levels/1/lesson");
      expect(
        await screen.findByRole("heading", { name: "Lesson: Big-O & Basics" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Open quick notes (N)" }),
      ).toBeNull();
    });

    it("opens beside the lesson, lists this level's notes and opens one", async () => {
      const fetchFn = lessonApi();
      renderSignedInAt("/levels/1/lesson");

      await userEvent.click(
        await screen.findByRole("button", { name: "Open quick notes (N)" }),
      );
      const panel = await screen.findByRole("complementary", {
        name: "Notes · Level 1",
      });
      // The lesson stays on the page while the panel is open.
      expect(
        screen.getByRole("heading", { name: "Lesson: Big-O & Basics" }),
      ).toBeVisible();
      await userEvent.click(
        await within(panel).findByRole("button", { name: /Monotonic stack/ }),
      );
      expect(
        await within(panel).findByRole("textbox", { name: "Title" }),
      ).toHaveValue("Monotonic stack");
      expect(calls(fetchFn, "GET", "/api/v1/notes?level=1")).toHaveLength(1);
      // Tags and delete stay on the full Notes page.
      expect(
        within(panel).queryByRole("button", { name: "Delete note" }),
      ).toBeNull();
    });

    it("saves a new note for the level without leaving the lesson", async () => {
      const fetchFn = lessonApi({
        "POST /api/v1/notes": () =>
          json(201, { ...NOTE, id: "n-9", title: "Idea", tags: [] }),
      });
      renderSignedInAt("/levels/1/lesson");

      await userEvent.click(
        await screen.findByRole("button", { name: "Open quick notes (N)" }),
      );
      const panel = await screen.findByRole("complementary", {
        name: "Notes · Level 1",
      });
      await userEvent.click(
        within(panel).getByRole("button", {
          name: "+ New note for this level",
        }),
      );
      await userEvent.type(
        within(panel).getByRole("textbox", { name: "Title" }),
        "Idea",
      );
      await waitFor(
        () => expect(calls(fetchFn, "POST", "/api/v1/notes")).toHaveLength(1),
        { timeout: 3000 },
      );
      expect(
        sentBody(calls(fetchFn, "POST", "/api/v1/notes")[0]),
      ).toMatchObject({ title: "Idea", level: 1 });
      expect(
        screen.getByRole("heading", { name: "Lesson: Big-O & Basics" }),
      ).toBeVisible();
    });

    it("opens and closes with N and closes with Escape", async () => {
      lessonApi();
      renderSignedInAt("/levels/1/lesson");
      await screen.findByRole("button", { name: "Open quick notes (N)" });

      await userEvent.keyboard("n");
      expect(
        await screen.findByRole("complementary", { name: "Notes · Level 1" }),
      ).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(
          screen.queryByRole("complementary", { name: "Notes · Level 1" }),
        ).toBeNull(),
      );
      await userEvent.keyboard("N");
      expect(
        await screen.findByRole("complementary", { name: "Notes · Level 1" }),
      ).toBeVisible();
      await userEvent.click(
        screen.getByRole("button", { name: "Close notes" }),
      );
      expect(
        screen.queryByRole("complementary", { name: "Notes · Level 1" }),
      ).toBeNull();
    });
  });
});
