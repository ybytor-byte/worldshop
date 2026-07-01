export interface YandexVisionResult {
  text?: string;
  barcodes: string[];
  objects: string[];
  raw: any;
}

export interface YandexVisionConfig {
  folderId?: string;
  apiKey: string;
}
