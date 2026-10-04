import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import * as z from "zod";
import { auth } from "@/auth";
import { createUploadUrl } from "@/lib/r2";
import { checkRateLimit, retryAfterSeconds, uploadRateLimit } from "@/lib/rate-limit";
import { contentTypeForExtension, getExtension, validateUpload } from "@/lib/upload-constraints";
import { canUseProFeature } from "@/lib/usage-limits";

const uploadRequestSchema = z.object({
  kind: z.enum(["image", "file"]),
  fileName: z.string().min(1).max(255),
  fileType: z.string(),
  fileSize: z.number().int().positive(),
});

// Returns a presigned URL so the browser uploads straight to R2. Proxying the
// body through this function would hit Vercel's ~4.5 MB request limit.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const gate = await canUseProFeature(session.user.id, "File upload");
  if (!gate.allowed) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(uploadRateLimit, session.user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Too many uploads. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rateLimit.reset)) } },
    );
  }

  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid upload" }, { status: 400 });
  }

  const { kind, fileName, fileType, fileSize } = parsed.data;
  const validation = validateUpload(kind, { name: fileName, type: fileType, size: fileSize });
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const extension = getExtension(fileName);
  const contentType = contentTypeForExtension(extension);
  const key = `${session.user.id}/${randomUUID()}${extension}`;

  try {
    const { uploadUrl, fileUrl } = await createUploadUrl(key, contentType, fileSize);
    return NextResponse.json({ success: true, data: { uploadUrl, contentType, fileUrl } });
  } catch (error) {
    console.error("Failed to create upload URL:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
