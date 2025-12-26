import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get()
  @ApiOperation({ summary: 'Search hotels by location' })
  async search(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('radius') radius: number,
  ) {
    const hotels = await this.hotelsService.findNearby(lat, lon, radius);
    return {
      success: true,
      data: { hotels },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hotel details' })
  async findOne(@Param('id') id: string) {
    const hotel = await this.hotelsService.findOne(id);
    return {
      success: true,
      data: hotel,
    };
  }
}
