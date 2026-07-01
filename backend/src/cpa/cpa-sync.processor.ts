import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CpaService } from './cpa.service';

@Processor('cpaSync')
export class CpaSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CpaSyncProcessor.name);

  constructor(private cpaService: CpaService) {
    super();
  }

  async process(job: Job<{ feedId: string; updatedSince?: string }>): Promise<any> {
    this.logger.log(`Processing CPA sync job ${job.id} for feed ${job.data.feedId}`);
    try {
      const result = await this.cpaService.syncCityAdsFeed(job.data.feedId, {
        updatedSince: job.data.updatedSince,
      });
      this.logger.log(`CPA sync job ${job.id} complete: ${result.imported} items`);
      return result;
    } catch (error: any) {
      this.logger.error(`CPA sync job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}