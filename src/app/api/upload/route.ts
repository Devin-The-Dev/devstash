import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";
import { validateUpload, type UploadKind } from "@/lib/upload-constraints";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || (kind !== "image" && kind !== "file")) {
    return NextResponse.json({ success: false, error: "Invalid upload" }, { status: 400 });
  }

  const validation = validateUpload(kind as UploadKind, file);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const extension = file.name.slice(file.name.lastIndexOf("."));
  const key = `${session.user.id}/${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const fileUrl = await uploadToR2(key, buffer, file.type || "application/octet-stream");

  return NextResponse.json({
    success: true,
    data: { fileUrl, fileName: file.name, fileSize: file.size },
  });
}
