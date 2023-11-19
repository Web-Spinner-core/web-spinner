import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

export const Buckets = {
  DEFAULT: "web-spinner",
};

/**
 * StorageClient manages read/write access to a persistent file store
 */
export default class StorageClient {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY,
        secretAccessKey: env.AWS_SECRET_KEY,
      },
    });
  }

  /**
   * Create a new storage bucket
   */
  async createBucket(bucketName: string) {
    await this.client.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );
  }

  /**
   * Upload a file to the storage bucket
   */
  async uploadFile(
    fileName: string,
    content: string,
    bucketName: string = Buckets.DEFAULT
  ) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: content,
      })
    );
  }

  /**
   * Download a file from the storage bucket
   */
  async downloadFile(
    fileName: string,
    bucketName: string = Buckets.DEFAULT
  ): Promise<string> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })
    );

    if (!response?.Body) throw new Error("No response body");

    return response.Body.toString();
  }

  /**
   * Generate a signed URL for a file in the storage bucket
   */
  async generateSignedUrl(
    fileName: string,
    bucketName: string = Buckets.DEFAULT,
    ttlSeconds: number = 15 * 60
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds,
    });

    return url;
  }
}
