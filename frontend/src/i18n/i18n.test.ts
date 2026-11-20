import { APP_NAME } from "../config/brand";
import { afterEach, describe, expect, it } from "vitest";
import en from "./locales/en.json";
import vi from "./locales/vi.json";
import { getLocale, setLocale, translate } from "./index";

afterEach(() => setLocale("en"));

describe("i18n foundation", () => {
  it("keeps EN/VI dictionaries in sync", () => {
    for (const section of Object.keys(en) as (keyof typeof en)[]) {
      expect(Object.keys(vi[section]).sort()).toEqual(
        Object.keys(en[section]).sort(),
      );
    }
  });

  it("switches locale and updates the document language", () => {
    setLocale("vi");
    expect(getLocale()).toBe("vi");
    expect(document.documentElement.lang).toBe("vi");
    expect(translate("vi", "nav.profile")).toBe("Hồ sơ");
    setLocale("en");
    expect(translate("en", "nav.profile")).toBe("Profile");
  });

  it("puts the site name into text that names the site", () => {
    expect(translate("en", "auth.title")).toBe(`Sign in to ${APP_NAME}`);
    expect(translate("vi", "misc.vipTitle")).toBe(`${APP_NAME} VIP`);
    expect(APP_NAME).toBe("AlgoQuest");
  });

  it("retains the exact English wording used in the existing UI", () => {
    expect(translate("en", "lesson.previous")).toBe("Back");
    expect(translate("en", "home.title")).toBe("Learning Path");
    expect(translate("en", "pattern.valid")).toBe("Valid, not the best");
  });
});
