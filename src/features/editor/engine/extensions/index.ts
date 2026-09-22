import type { AnyExtension } from "@tiptap/core";
import { t } from "~/lib/i18n";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CustomImage } from "./image";
import { InlineMath } from "./inline-math";
import { BlockMath } from "./block-math";
import { RawMdx } from "./raw-mdx";
import { Callout } from "./callout";
import { Figure } from "./figure";
import { CommentMark } from "./comment-mark";
import { WikiLink } from "./wiki-link";

export function getEditorExtensions(placeholder?: string): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: {
        HTMLAttributes: {
          class: "rounded-lg",
        },
      },
      // StarterKit v3 默认已含 link/underline，显式排除后再单独配置，避免重复注册
      link: false,
      underline: false,
    }),
    Placeholder.configure({
      placeholder: placeholder ?? t("editor.startWritingPlaceholder"),
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class:
          "text-[var(--primary)] underline underline-offset-2 hover:opacity-80 transition-opacity",
      },
    }),
    Underline,
    TaskList,
    TaskItem,
    CustomImage,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    InlineMath,
    BlockMath,
    RawMdx,
    Callout,
    Figure,
    CommentMark,
    WikiLink,
  ];
}
