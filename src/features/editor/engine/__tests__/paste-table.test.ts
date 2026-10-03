import { describe, expect, it } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { tableFromTsv } from "../paste-table";

const schema = new Schema({
  nodes: {
    doc: { content: "table+" },
    table: { content: "tableRow+" },
    tableRow: { content: "tableCell+" },
    tableCell: { content: "paragraph+" },
    paragraph: { content: "text*" },
    text: { inline: true },
  },
});

describe("tableFromTsv", () => {
  it("preserves cell text, empty cells and uneven rows", () => {
    const table = tableFromTsv(schema, "Name\tQty\tNote\r\nPen\t2\r\n\t0\t");
    expect(table?.toJSON()).toEqual({
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Name" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Qty" }] },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Note" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Pen" }] },
              ],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "2" }] },
              ],
            },
            { type: "tableCell", content: [{ type: "paragraph" }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph" }] },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "0" }] },
              ],
            },
            { type: "tableCell", content: [{ type: "paragraph" }] },
          ],
        },
      ],
    });
    expect(table?.check()).toBeUndefined();
  });

  it("lets ordinary text and oversized grids use normal paste", () => {
    expect(tableFromTsv(schema, "only\tone row")).toBeNull();
    expect(tableFromTsv(schema, "one\ntwo")).toBeNull();
    expect(tableFromTsv(schema, "a\tb\n".repeat(101))).toBeNull();
  });
});
