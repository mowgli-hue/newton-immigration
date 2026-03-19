function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function chunkLines(lines: string[], perPage: number): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  return pages.length > 0 ? pages : [[""]];
}

export function buildSimpleTextPdf(lines: string[]): Buffer {
  const normalized = lines.map((line) => String(line || ""));
  const pages = chunkLines(normalized, 45);

  let objectIndex = 1;
  const catalogObj = objectIndex++;
  const pagesObj = objectIndex++;
  const fontObj = objectIndex++;

  const pageObjects: number[] = [];
  const contentObjects: number[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    pageObjects.push(objectIndex++);
    contentObjects.push(objectIndex++);
  }

  const objects: string[] = [];
  objects[catalogObj] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj] = `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`;
  objects[fontObj] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (let i = 0; i < pages.length; i += 1) {
    const pageId = pageObjects[i];
    const contentId = contentObjects[i];
    const body = [
      "BT",
      "/F1 10 Tf",
      "50 800 Td",
      "12 TL",
      ...pages[i].map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET"
    ].join("\n");
    objects[contentId] = `<< /Length ${Buffer.byteLength(body, "utf8")} >>\nstream\n${body}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 842] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentId} 0 R >>`;
  }

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = Buffer.byteLength(pdf, "utf8");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
