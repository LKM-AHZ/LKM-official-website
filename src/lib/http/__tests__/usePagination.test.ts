// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { ok, err } from "~/lib/errors/result";
import { AppError, ErrorCode } from "~/lib/errors/error-codes";
import { usePagination } from "../usePagination";

async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe("usePagination (offset)", () => {
  it("loadMore 追加下一页、末页 hasMore=false", async () => {
    let calls = 0;
    const loader = async (page: number) => {
      calls += 1;
      return ok({
        items: page === 1 ? [{ id: 1 }] : [{ id: 2 }],
        total: 2,
        page,
        pages: 2,
      });
    };
    const pag = usePagination<{ id: number }>({ loader, limit: 1 });
    await flush();
    expect(calls).toBe(1);
    expect(pag.items.value).toEqual([{ id: 1 }]);
    expect(pag.hasMore.value).toBe(true);

    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }, { id: 2 }]);
    expect(pag.hasMore.value).toBe(false);
    expect(pag.total.value).toBe(2);
    expect(pag.totalPages.value).toBe(2);
  });

  it("加载更多失败不丢已加载页", async () => {
    let failNext = false;
    const loader = async (page: number) => {
      if (page === 2 && failNext)
        return err(new AppError(ErrorCode.NETWORK_ERROR, "网络错误"));
      return ok({ items: [{ id: page }], total: 2, page, pages: 2 });
    };
    const pag = usePagination<{ id: number }>({ loader, limit: 1 });
    await flush();
    expect(pag.items.value).toEqual([{ id: 1 }]);

    failNext = true;
    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }]);
    expect(pag.error.value).not.toBeNull();

    failNext = false;
    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("usePagination (cursor)", () => {
  it("按 next_cursor 加载更多直到末尾", async () => {
    const loader = async (cursor: string | null) => {
      if (cursor === null)
        return ok({ items: [{ id: 1 }], next_cursor: "cur2" });
      if (cursor === "cur2") return ok({ items: [{ id: 2 }], next_cursor: null });
      return ok({ items: [], next_cursor: null });
    };
    const pag = usePagination<{ id: number }>({ cursorLoader: loader });

    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }]);
    expect(pag.hasMore.value).toBe(true);

    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }, { id: 2 }]);
    expect(pag.hasMore.value).toBe(false);
  });

  it("游标模式失败不丢已加载项", async () => {
    const loader = async (cursor: string | null) => {
      if (cursor === null)
        return ok({ items: [{ id: 1 }], next_cursor: "c2" });
      return err(new AppError(ErrorCode.HTTP_TIMEOUT, "超时"));
    };
    const pag = usePagination<{ id: number }>({ cursorLoader: loader });
    await pag.loadMore();
    await pag.loadMore();
    expect(pag.items.value).toEqual([{ id: 1 }]);
    expect(pag.error.value).not.toBeNull();
  });
});
