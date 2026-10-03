// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fileLibraryApi } from "~/lib/api";
import type { FileEntry } from "~/lib/api/modules/file-library";
import FileListPage from "../FileListPage.vue";
import FolderGrid from "../FolderGrid.vue";

vi.mock("~/lib/api", () => ({
  fileLibraryApi: {
    getFiles: vi.fn(),
    getContentBlob: vi.fn(),
    getPreviewBlob: vi.fn(),
    searchFiles: vi.fn(),
    getUploadProjects: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("~/lib/i18n", () => ({ t: (key: string) => key }));
vi.mock("@iconify/vue", () => ({
  Icon: { template: "<span />" },
}));

const file: FileEntry = {
  id: "file-1",
  originalName: "paper.pdf",
  uploaderName: "tester",
  mimeType: "application/pdf",
  size: 100,
  categoryId: "math-linear-algebra",
  categoryName: "Linear Algebra",
  description: "",
  tags: [],
  status: "approved",
  reviewComment: null,
  downloadCount: 0,
  viewCount: 0,
  createdAt: "2026-01-01",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FileListPage", () => {
  it("opens an approved file preview after navigating to its folder", async () => {
    vi.mocked(fileLibraryApi.getFiles).mockResolvedValue([file]);
    vi.mocked(fileLibraryApi.getPreviewBlob).mockResolvedValue(
      new Blob(["pdf bytes"]),
    );
    const previewWindow = { location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(
      previewWindow as unknown as Window,
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview-file-1"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });

    const wrapper = mount(FileListPage, {
      attachTo: document.body,
      global: { stubs: { Icon: true } },
    });
    await flushPromises();
    for (const folderName of [
      "fileLibraryData.categories.basicScience",
      "fileLibraryData.categories.math",
      "fileLibraryData.categories.mathLinearAlgebra",
    ]) {
      const folder = wrapper
        .findComponent(FolderGrid)
        .findAll("button")
        .find((button) => button.text().includes(folderName));
      expect(folder).toBeDefined();
      await folder!.trigger("click");
      await nextTick();
    }

    const preview = wrapper
      .findAll("button")
      .find((button) =>
        button.text().includes("community.fileLibrary.preview"),
      );
    expect(preview).toBeDefined();
    await preview!.trigger("click");
    await flushPromises();

    expect(fileLibraryApi.getPreviewBlob).toHaveBeenCalledWith("file-1");
    expect(previewWindow.location.href).toBe("blob:preview-file-1");
    wrapper.unmount();
  });
});
