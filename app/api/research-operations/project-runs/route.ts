import type { ProjectRunRecord } from "../../../lib/projectRunContract";
import { listProjectRunRecords, storeProjectRunRecord } from "../../../lib/projectRunStore";

export async function GET() {
  try {
    const records = await listProjectRunRecords();
    return Response.json({ records }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "项目运行记录读取失败" }, { status: 422 });
  }
}

export async function POST(request: Request) {
  try {
    const record = await request.json() as ProjectRunRecord;
    const saved = await storeProjectRunRecord(record);
    return Response.json({ record: saved }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "项目运行记录保存失败" }, { status: 400 });
  }
}
