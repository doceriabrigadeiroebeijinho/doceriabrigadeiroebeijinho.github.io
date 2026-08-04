type BucketBinding = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
};

let bucketBinding: BucketBinding | undefined;

export function setBucketBinding(bucket: BucketBinding) {
  bucketBinding = bucket;
}

export function hasBucketBinding() {
  return bucketBinding !== undefined;
}

export function getBucket() {
  if (!bucketBinding) {
    throw new Error(
      "Cloudflare R2 binding `BUCKET` is unavailable. Set the `r2` field in .openai/hosting.json to `BUCKET` before using image uploads.",
    );
  }

  return bucketBinding;
}
