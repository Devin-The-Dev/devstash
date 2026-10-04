import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import { getFromR2, keyFromPublicUrl } from "@/lib/r2";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemDetail(session.user.id, id);

  if (!item || !item.fileUrl) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const key = keyFromPublicUrl(item.fileUrl);
  if (!key) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const object = await getFromR2(key);
  if (!object.Body) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  // Strip quotes/control characters so a crafted filename can't break out of the
  // quoted-string and inject extra Content-Disposition directives. The ASCII
  // fallback keeps the header valid; filename* carries the real UTF-8 name.
  const fileName = (item.fileName ?? "download").replace(/[\x00-\x1f"\\]/g, "");
  const asciiFileName = fileName.replace(/[^\x20-\x7e]/g, "_");
  // encodeURIComponent leaves ' ( ) * intact, which RFC 5987 doesn't allow.
  const encodedFileName = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  const headers: Record<string, string> = {
    "Content-Type": object.ContentType ?? "application/octet-stream",
    "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
    "X-Content-Type-Options": "nosniff",
  };
  if (object.ContentLength !== undefined) {
    headers["Content-Length"] = String(object.ContentLength);
  }

  // Stream rather than buffer: avoids holding the whole file in memory.
  return new Response(object.Body.transformToWebStream(), { headers });
}
