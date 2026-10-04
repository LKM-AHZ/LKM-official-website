import { afterEach, describe, expect, it, vi } from "vitest";
import { getGraphqlUrl } from "./client";

const originalApiUrl = process.env.API_URL;

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GraphQL 版本端点", () => {
  it("SSR 默认固定到 v1，忽略 API_URL 的尾斜杠", () => {
    vi.stubEnv("PUBLIC_GRAPHQL_URL", "");
    process.env.API_URL = "https://backend.example/";
    expect(getGraphqlUrl()).toBe("https://backend.example/graphql/v1");
  });

  it("显式端点配置保持原样", () => {
    vi.stubEnv("PUBLIC_GRAPHQL_URL", "https://api.example/graphql/v1");
    expect(getGraphqlUrl()).toBe("https://api.example/graphql/v1");
  });

  it("浏览器同域请求也固定到 v1", () => {
    vi.stubEnv("PUBLIC_GRAPHQL_URL", "");
    vi.stubGlobal("window", {
      location: { origin: "https://site.example" },
      __BASE_URL__: "/",
    });
    expect(getGraphqlUrl()).toBe("https://site.example/graphql/v1");
  });
});
