import { buildRawProductionResult } from "../../../lib/rawDataProduction";
import { storeProjectResult } from "../../../lib/projectResultStore";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_COMPRESSED_BYTES = 5 * 1024 * 1024;

function decodedFileName(request: Request) {
  const encoded = request.headers.get("x-raw-file-name");
  if (!encoded) return "final_raw_data.csv";
  try {
    return decodeURIComponent(encoded);
  } catch {
    return "final_raw_data.csv";
  }
}

function decodedHeader(request: Request, name: string) {
  const encoded = request.headers.get(name)?.trim() ?? "";
  if (!encoded) return "";
  try {
    return decodeURIComponent(encoded);
  } catch {
    throw new Error(`${name}格式无效`);
  }
}

async function readRawUpload(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/gzip")) {
    const declaredSize = Number(request.headers.get("x-raw-uncompressed-size") ?? "0");
    if (declaredSize > MAX_FILE_BYTES) throw new Error("单个CSV文件不能超过15MB");
    const compressed = await request.arrayBuffer();
    if (compressed.byteLength > MAX_COMPRESSED_BYTES) throw new Error("压缩后的CSV传输不能超过5MB");
    const decompressed = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(decompressed).text();
    if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) throw new Error("单个CSV文件不能超过15MB");
    return { text, fileName: decodedFileName(request) };
  }

  if (contentType.includes("text/csv")) {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("单个CSV文件不能超过15MB");
    return { text: new TextDecoder().decode(bytes), fileName: decodedFileName(request) };
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new Error("上传内容不是有效的CSV数据");
  }
  const candidate = formData.get("file");
  if (!(candidate instanceof File)) throw new Error("请选择一个CSV文件");
  if (!candidate.name.toLowerCase().endsWith(".csv")) {
    throw new Error("当前在线生产接口接受CSV；XLSX或SAV请先转换为保留原题号与Code的CSV");
  }
  if (candidate.size > MAX_FILE_BYTES) throw new Error("单个CSV文件不能超过15MB");
  return { text: await candidate.text(), fileName: candidate.name };
}

export async function POST(request: Request) {
  try {
    const upload = await readRawUpload(request);
    if (!upload.fileName.toLowerCase().endsWith(".csv")) {
      return Response.json({ error: "当前在线生产接口接受CSV；XLSX或SAV请先转换为保留原题号与Code的CSV" }, { status: 415 });
    }
    let payload = buildRawProductionResult(upload.text, upload.fileName);
    const runId = request.headers.get("x-project-run-id")?.trim() ?? "";
    const designVersion = request.headers.get("x-design-version")?.trim() ?? "";
    const designConfirmationKey = decodedHeader(request, "x-design-confirmation-key");
    const bindingHeaderCount = [runId, designVersion, designConfirmationKey].filter(Boolean).length;
    if (bindingHeaderCount > 0 && bindingHeaderCount < 3) {
      return Response.json({ error: "项目运行ID、设计版本和设计确认键必须同时提供" }, { status: 400 });
    }
    if (payload.meta.status === "ready" && bindingHeaderCount === 3) {
      payload = await storeProjectResult({ runId, designVersion, designConfirmationKey }, payload);
    }
    return Response.json(payload, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "数据生产失败";
    const status = message.includes("不能超过") ? 413 : message.includes("请选择") || message.includes("有效") ? 400 : 422;
    return Response.json({ error: message }, { status });
  }
}

export async function GET() {
  return Response.json({ error: "请上传最终CSV生产数据" }, { status: 405 });
}
