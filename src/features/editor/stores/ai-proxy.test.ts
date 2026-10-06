import { beforeEach, describe, expect, it, vi } from "vitest";
import { ok } from "~/lib/errors/result";
import { apiFetch } from "~/lib/api/fetch";
import { POST } from "~/pages/ai/completion";

vi.mock("~/lib/api/fetch", () => ({ apiFetch: vi.fn() }));

function request(endpoint: string): Request {
  return new Request("https://example.com/ai/completion", {
    method: "POST",
    body: JSON.stringify({
      endpoint,
      apiKey: "secret",
      model: "test",
      messages: [],
    }),
  });
}

describe("AI completion proxy", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects hosts outside the server allowlist", async () => {
    const response = await POST({
      request: request("https://127.0.0.1"),
    } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(403);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("forwards an allowed request", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      ok(
        new Response('{"choices":[]}', {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const response = await POST({
      request: request("https://api.openai.com"),
    } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(200);
    expect(apiFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("accepts an endpoint already ending in /v1", async () => {
    vi.mocked(apiFetch).mockResolvedValue(ok(new Response('{"choices":[]}')));
    await POST({ request: request("https://api.openai.com/v1") } as Parameters<
      typeof POST
    >[0]);
    expect(apiFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.any(Object),
    );
  });
});
