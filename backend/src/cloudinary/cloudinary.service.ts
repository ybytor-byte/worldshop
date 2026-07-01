import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  readonly isConfigured: boolean;

  constructor(configService: ConfigService) {
    const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');
    this.isConfigured = !!(cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name');
    if (this.isConfigured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    } else {
      this.logger.warn('Cloudinary not configured — image upload will fail');
    }
  }

  async uploadImage(buffer: Buffer, folder = 'worldshop'): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
    }
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ width: 800, crop: 'limit', quality: 'auto', format: 'webp' }],
        },
        (err, result) => {
          if (err || !result) {
            this.logger.error(`Cloudinary upload failed: ${err?.message || 'unknown'}`);
            reject(err || new Error('Upload failed'));
          } else {
            this.logger.log(`Image uploaded to Cloudinary: ${result.secure_url}`);
            resolve(result.secure_url);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }
}
