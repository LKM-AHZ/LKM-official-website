import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";

/** 把电子表格复制的 TSV 转成合法的 TipTap 表格节点。 */
export function tableFromTsv(
  schema: Schema,
  text: string,
): ProseMirrorNode | null {
  const rows = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const cells = rows.map((row) => row.split("\t"));
  const width = Math.max(...cells.map((row) => row.length));
  if (
    rows.length < 2 ||
    width < 2 ||
    rows.length > 100 ||
    width > 50 ||
    !schema.nodes.table ||
    !schema.nodes.tableRow ||
    !schema.nodes.tableCell ||
    !schema.nodes.paragraph
  ) {
    return null;
  }

  return schema.nodes.table.create(
    null,
    cells.map((row) =>
      schema.nodes.tableRow.create(
        null,
        Array.from({ length: width }, (_, index) => {
          const value = row[index] ?? "";
          const paragraph = schema.nodes.paragraph.create(
            null,
            value ? schema.text(value) : undefined,
          );
          return schema.nodes.tableCell.create(null, paragraph);
        }),
      ),
    ),
  );
}
