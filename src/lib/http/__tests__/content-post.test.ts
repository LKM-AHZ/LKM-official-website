import { afterEach, describe, expect, it, vi } from "vitest";
import { contentApi } from "~/lib/api/modules/content";
import { configureHttpAuthSession } from "../client";

afterEach(() => {
  configureHttpAuthSession(null);
  vi.unstubAllGlobals();
});

describe("发帖请求", () => {
  it("给内容写接口附加登录令牌", async () => {
    configureHttpAuthSession({
      getAccessToken: () => "access-token",
      getRefreshToken: () => null,
      setTokens: vi.fn(),
      clear: vi.fn(),
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: { id: "post-id" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await contentApi.createItem({
      board_id: "board-id",
      title: "标题",
      content: "正文",
    });

    expect(result.isOk()).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/content/items"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("令牌过期后续期并重试发帖", async () => {
    let accessToken = "expired-token";
    configureHttpAuthSession({
      getAccessToken: () => accessToken,
      getRefreshToken: () => "refresh-token",
      setTokens: (newToken) => {
        accessToken = newToken;
      },
      clear: vi.fn(),
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { access_token: "new-token", refresh_token: "new-refresh" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 0, data: { id: "post-id" } }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await contentApi.createItem({
      board_id: "board-id",
      title: "标题",
      content: "正文",
    });

    expect(result.isOk()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/api/v1/auth/refresh");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer new-token",
    );
  });
});
