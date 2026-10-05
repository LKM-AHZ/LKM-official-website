import { describe, expect, it } from "vitest";
import { allMenuItems, officialDefaultNavItems } from "../menus";

describe("site navigation", () => {
  it("shows the same ordered categories on every page", () => {
    const names = allMenuItems.map((item) => item.name);
    expect(names).toEqual([
      "nav.home",
      "nav.community",
      "nav.projects",
      "nav.resources",
      "nav.moreApps",
      "nav.mine",
    ]);
    expect(officialDefaultNavItems).toEqual(names);
  });

  it("gives each category a destination and exposes the main sections", () => {
    expect(allMenuItems.map((item) => item.url)).toEqual([
      "/",
      "/forum",
      "/projects",
      "/files",
      "/apps",
      "/account",
    ]);

    const destinations = new Set(
      allMenuItems.flatMap((item) => [
        item.url,
        ...(item.children ?? []).map((child) => child.url),
      ]),
    );
    for (const path of [
      "/qa",
      "/timeline",
      "/search?type=columns",
      "/competition",
      "/competition/bank",
      "/starhope",
      "/treehole",
      "/follow",
      "/contribution",
    ]) {
      expect(destinations.has(path), path).toBe(true);
    }
  });
});
