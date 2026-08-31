import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontUrl: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    this.cloudFrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL', '');
    
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Uploads a file to S3 and returns the public CloudFront URL.
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    if (this.cloudFrontUrl) {
      return `${this.cloudFrontUrl}/${fileName}`;
    }
    
    // Fallback to S3 URL if CloudFront is not configured
    const region = this.configService.get<string>('AWS_REGION');
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
  }

  /**
   * Generates a pre-signed URL for uploading files directly from the client.
   */
  async getPresignedUploadUrl(fileName: string, mimeType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: mimeType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Deletes a file from S3.
   */
  async deleteFile(fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    await this.s3Client.send(command);
  }
}
