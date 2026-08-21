import { readProjectResult, readProjectResultArtifact } from "../../../lib/projectResultStore";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId")?.trim() ?? "";
  const designVersion = url.searchParams.get("designVersion")?.trim() ?? "";
  const artifactKey = url.searchParams.get("artifactKey")?.trim() ?? "";
  if (!runId || !designVersion) return Response.json({ error: "请提供运行ID和设计版本" }, { status: 400 });
  try {
    if (artifactKey) {
      const { artifact, contents } = await readProjectResultArtifact(runId, designVersion, artifactKey);
      return new Response(contents, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(artifact.fileName)}`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const result = await readProjectResult(runId, designVersion);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "项目结果读取失败";
    const status = message.includes("ENOENT") ? 404 : message.includes("格式") || message.includes("版本") ? 400 : 422;
    return Response.json({ error: status === 404 ? "未找到对应项目结果" : message }, { status });
  }
}
