import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  // Otherwise presigned PUTs carry a CRC32 of an empty body that R2 could
  // reject once it starts validating checksums.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

/**
 * Presigned PUT URL for a direct browser-to-R2 upload. Content-Type and
 * Content-Length are signed, so R2 rejects a body that doesn't match what the
 * server validated.
 */
export async function createUploadUrl(
  key: string,
  contentType: string,
  contentLength: number,
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );

  return { uploadUrl, fileUrl: `${PUBLIC_URL}/${key}` };
}

/** Returns the stored object's size, or null if it doesn't exist. */
export async function headR2Object(key: string): Promise<{ contentLength: number } | null> {
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { contentLength: head.ContentLength ?? 0 };
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getFromR2(key: string) {
  const object = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return object;
}

export function keyFromPublicUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(`${PUBLIC_URL}/`)) return null;
  return url.slice(PUBLIC_URL.length + 1);
}
