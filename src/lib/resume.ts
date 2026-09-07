import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { ResumeBasics } from "../types";

const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

async function withTimeout<T>(work: Promise<T>, milliseconds = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("file-timeout")), milliseconds);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const buffer = await file.arrayBuffer();
  return withTimeout((async () => {
    const document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      stopAtErrors: false,
    }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      let pageText = "";
      for (const item of content.items) {
        if (!("str" in item) || !("transform" in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 5) pageText += "\n";
        else if (pageText && !/[\s\n]$/.test(pageText)) pageText += " ";
        pageText += item.str;
        lastY = y;
      }
      pages.push(pageText.trim());
    }
    return pages.join("\n\n").trim();
  })());
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import("mammoth/mammoth.browser")).default;
  const result = await withTimeout(mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }));
  return result.value.trim();
}

export async function extractFileText(file: File): Promise<string> {
  if (file.size > FILE_SIZE_LIMIT) throw new Error("file-too-large");
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx")) return extractDocxText(file);
  if (name.endsWith(".doc")) throw new Error("legacy-doc");
  const text = (await file.text()).trim();
  if (!text) throw new Error("empty-file");
  return text;
}

export function fileErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "file-too-large") return "That file is larger than 10 MB. Choose a smaller file or paste the resume text.";
  if (message === "legacy-doc") return "Old .doc files are not supported. Save it as .docx or .pdf, or paste the text.";
  if (message === "file-timeout") return "File reading timed out. Paste the resume text directly to continue.";
  return "We could not read that file. Try a PDF, DOCX, or TXT file, or paste the text directly.";
}

export function parseResumeBasics(text: string): ResumeBasics {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { contact: { name: "", email: "", phone: "", location: "" }, bullets: [] };

  let name = lines[0].split(/[|•,\t]/)[0].trim();
  if (/@|\d{3}|resume|curriculum|summary|profile/i.test(name) || name.length > 35) name = "Candidate";
  const email = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] ?? "";
  const phone = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] ?? "";
  const locationMatch = text.match(/(?:^|\n)\s*([A-Za-z][A-Za-z .'-]{1,30}),\s*([A-Z]{2})\b/m);
  const location = locationMatch ? `${locationMatch[1].trim()}, ${locationMatch[2]}` : "";
  const bullets = lines
    .filter((line) => /^[-•*–\d.]+\s*/.test(line))
    .map((line) => line.replace(/^[-•*–\d.]+\s*/, "").trim())
    .filter((line) => line.length > 20);

  return { contact: { name, email, phone, location }, bullets };
}
