import { readFile } from "node:fs/promises";
import path from "node:path";

const filename = "零食消费者研究_Raw_Data_QC-20260817.xlsx";

export async function GET() {
  const filePath = path.join(process.cwd(), "output/packaged-food-beverage/research-operations", filename);
  const body = await readFile(filePath);
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
