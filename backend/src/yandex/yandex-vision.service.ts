import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YandexVisionResult, YandexVisionConfig } from './yandex.interface';

@Injectable()
export class YandexVisionService {
  private readonly logger = new Logger(YandexVisionService.name);
  private readonly config: YandexVisionConfig;
  private readonly apiBase = 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze';

  private readonly disabled: boolean;

  constructor(configService: ConfigService) {
    this.config = {
      apiKey: configService.get<string>('YANDEX_API_KEY') || '',
      folderId: configService.get<string>('YANDEX_FOLDER_ID') || '',
    };
    this.disabled = configService.get<string>('YANDEX_DISABLED') === 'true';
  }

  get isConfigured(): boolean {
    return !!this.config.apiKey && !this.disabled;
  }

  async analyze(imageBase64: string): Promise<YandexVisionResult> {
    const result: YandexVisionResult = { barcodes: [], objects: [], raw: null };

    if (!this.isConfigured) {
      this.logger.warn('Yandex Vision not configured');
      return result;
    }

    try {
      const body = {
        folderId: this.config.folderId || 'b1g',
        analyzeSpecs: [
          {
            content: imageBase64,
            features: [
              { type: 'TEXT_DETECTION', textDetectionConfig: { languageCodes: ['ru', 'en'] } },
            ],
          },
        ],
      };

      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.warn(`Yandex Vision API error: ${response.status}`);
        return result;
      }

      const data = await response.json();
      result.raw = data;

      const textAnnotations = data?.results?.[0]?.results?.[0]?.textDetection?.textAnnotation;
      if (textAnnotations?.fullText) {
        result.text = textAnnotations.fullText;
      }

      const barcodeAnnotations = data?.results?.[0]?.results?.find(
        (r: any) => r.barcodeDetection,
      )?.barcodeDetection;
      if (barcodeAnnotations?.barcodes) {
        result.barcodes = barcodeAnnotations.barcodes.map((b: any) => b.value).filter(Boolean);
      }

      const objectAnnotations = data?.results?.[0]?.results?.find(
        (r: any) => r.objectDetection,
      )?.objectDetection;
      if (objectAnnotations?.objects) {
        result.objects = objectAnnotations.objects.map((o: any) => o.name).filter(Boolean);
      }

      this.logger.log(`Vision OCR: text=${!!result.text}, barcodes=${result.barcodes.length}, objects=${result.objects.length}`);
    } catch (error) {
      this.logger.warn(`Yandex Vision request failed: ${(error as Error).message}`);
    }

    return result;
  }

  async extractProductKeywords(imageBase64: string): Promise<string[]> {
    const vision = await this.analyze(imageBase64);

    const keywords: string[] = [];

    if (vision.barcodes.length > 0) {
      keywords.push(...vision.barcodes);
    }

    if (vision.text) {
      const lines = vision.text.split('\n').filter(Boolean);
      const significant = lines
        .map(l => l.trim())
        .filter(l => l.length > 2 && l.length < 100)
        .slice(0, 5);
      keywords.push(...significant);
    }

    if (vision.objects.length > 0) {
      keywords.push(...vision.objects);
    }

    return [...new Set(keywords)];
  }
}
