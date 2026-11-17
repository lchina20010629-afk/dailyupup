import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENV = ["R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT"] as const;

function requiredR2(): { bucket: string; client: S3Client } {
  const missing = R2_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`缺少 ${missing.join("、")}`);
  return {
    bucket: process.env.R2_BUCKET ?? "",
    client: new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    }),
  };
}

export async function signUpload(key: string, contentType: string): Promise<string> {
  const { bucket, client } = requiredR2();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 600 });
}

export async function signRead(key: string): Promise<string> {
  const { bucket, client } = requiredR2();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 600 });
}

export function objectKey(day: string, fragmentId: string, mediaId: string): string {
  return `${day}/${fragmentId}/${mediaId}`;
}
