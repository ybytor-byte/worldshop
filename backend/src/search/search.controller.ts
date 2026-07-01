import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search products across all providers' })
  async search(@Query('q') query: string, @Query('region') region?: string) {
    if (!query || query.length < 2) {
      return { results: [] };
    }

    if (region) {
      const results = await this.searchService.searchProducts({ text: query, region: region.toUpperCase() });
      return { query, region, results };
    }

    const byRegion = await this.searchService.searchAllRegions(query);
    return { query, byRegion };
  }
}
