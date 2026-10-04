import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

type R2Config = { client: S3Client; bucket: string; publicUrl: string };
let r2Config: R2Config | null = null;

// Built lazily, like getStripe(), so a missing variable fails loudly on first
// use instead of producing an "undefined.r2.cloudflarestorage.com" endpoint.
function getR2(): R2Config {
  if (!r2Config) {
    r2Config = {
      client: new S3Client({
        region: "auto",
        endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
        // Otherwise presigned PUTs carry a CRC32 of an empty body that R2 could
        // reject once it starts validating checksums.
        requestChecksumCalculation: "WHEN_REQUIRED",
        credentials: {
          accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
          secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
        },
      }),
      bucket: requireEnv("R2_BUCKET_NAME"),
      publicUrl: getPublicUrl(),
    };
  }
  return r2Config;
}

function getPublicUrl(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
}

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
  const { client, bucket, publicUrl } = getR2();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );

  return { uploadUrl, fileUrl: `${publicUrl}/${key}` };
}

/** Returns the stored object's size, or null if it doesn't exist. */
export async function headR2Object(key: string): Promise<{ contentLength: number } | null> {
  try {
    const { client, bucket } = getR2();
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { contentLength: head.ContentLength ?? 0 };
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const { client, bucket } = getR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getFromR2(key: string) {
  const { client, bucket } = getR2();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return object;
}

/** First `length` bytes of an object, via a ranged GET. */
export async function readR2ObjectStart(key: string, length: number): Promise<Uint8Array> {
  const { client, bucket } = getR2();
  const object = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${length - 1}` }),
  );
  return object.Body ? object.Body.transformToByteArray() : new Uint8Array();
}

export function keyFromPublicUrl(url: string): string | null {
  // Throws when R2_PUBLIC_URL is unset, rather than returning null and letting
  // callers like deleteItem silently skip R2 cleanup.
  const publicUrl = getPublicUrl();
  if (!url.startsWith(`${publicUrl}/`)) return null;
  return url.slice(publicUrl.length + 1);
}
