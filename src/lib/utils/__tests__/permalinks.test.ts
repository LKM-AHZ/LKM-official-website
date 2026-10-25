import { describe, expect, it } from "vitest";

import { getCanonical } from "../permalinks";

describe("getCanonical", () => {
  it("keeps a relative path when no public site URL is configured", () => {
    expect(getCanonical("/blog/hello")).toBe("/blog/hello");
  });
});
