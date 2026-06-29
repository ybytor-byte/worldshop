import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueService } from './queue.service';

@Processor('productProcessing')
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(private queueService: QueueService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    this.logger.log(`Processing queue job ${job.id} for scan ${job.data.scanId}`);
    await this.queueService.processProduct(job.data.scanId, job.data.payload);
  }
}