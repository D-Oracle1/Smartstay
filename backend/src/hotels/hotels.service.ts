import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, HotelStatus } from './entities/hotel.entity';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private hotelsRepository: Repository<Hotel>,
  ) {}

  /**
   * Find nearby hotels using PostGIS
   */
  async findNearby(lat: number, lon: number, radius: number = 10) {
    return await this.hotelsRepository
      .createQueryBuilder('hotel')
      .select([
        'hotel.*',
        `ST_Distance(
          hotel.location,
          ST_MakePoint(${lon}, ${lat})::geography
        ) / 1000 AS distance_km`,
      ])
      .where(`ST_DWithin(
        hotel.location,
        ST_MakePoint(${lon}, ${lat})::geography,
        ${radius * 1000}
      )`)
      .andWhere('hotel.status = :status', { status: HotelStatus.ACTIVE })
      .orderBy('distance_km', 'ASC')
      .getRawMany();
  }

  async findOne(id: string) {
    return this.hotelsRepository.findOne({ where: { id } });
  }
}
