import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export interface HermesJobData {
  imageUrl: string;
  productName: string;
  region: string;
  userId?: string;
  scanId?: string;
}

@Injectable()
export class HermesQueueService {
  private readonly logger = new Logger(HermesQueueService.name);

  constructor(
    @InjectQueue('hermes-processing') private hermesQueue: Queue,
  ) {}

  async addJob(data: HermesJobData): Promise<string> {
    const job = await this.hermesQueue.add('deep-process', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    this.logger.log(`Added Hermes processing job ${job.id} for ${data.productName}`);
    return job.id || '';
  }

  async getJobStatus(jobId: string): Promise<string | null> {
    try {
      const job = await this.hermesQueue.getJob(jobId);
      if (!job) return null;
      if (job.finishedOn) return 'completed';
      if (job.failedReason) return 'failed';
      return 'waiting';
    } catch {
      return null;
    }
  }
}
