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

  const bytes = await object.Body.transformToByteArray();

  // Strip quotes/control characters so a crafted filename can't break out of the
  // quoted-string and inject extra Content-Disposition directives.
  const safeFileName = (item.fileName ?? "download").replace(/[\x00-\x1f"\\]/g, "");

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
