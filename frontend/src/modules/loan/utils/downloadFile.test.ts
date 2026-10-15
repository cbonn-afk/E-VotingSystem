import { describe, expect, it } from "vitest";

import { fileKind, formatFileSize } from "./downloadFile";

describe("file helpers", () => {
  it("recognises what can be previewed", () => {
    expect(fileKind("ID.PNG")).toBe("image");
    expect(fileKind("scan.jpeg")).toBe("image");
    expect(fileKind("form.pdf")).toBe("pdf");
    expect(fileKind("notes.docx")).toBe("other");
    expect(fileKind("noextension")).toBe("other");
  });

  it("formats sizes", () => {
    expect(formatFileSize(500)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.6 * 1024 * 1024)).toBe("1.6 MB");
  });
});
