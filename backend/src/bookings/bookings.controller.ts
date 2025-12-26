import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking (locks room for 15 min)' })
  async create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    const result = await this.bookingsService.create(req.user.userId, createBookingDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bookings' })
  async findByUser(
    @Request() req,
    @Query('status') status?: 'upcoming' | 'past' | 'cancelled',
  ) {
    const bookings = await this.bookingsService.findByUser(req.user.userId, status);
    return {
      success: true,
      data: { bookings },
    };
  }

  @Get(':reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by reference' })
  async findByReference(@Param('reference') reference: string) {
    const booking = await this.bookingsService.findByReference(reference);
    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    const booking = await this.bookingsService.cancelBooking(id, req.user.userId, reason);
    return {
      success: true,
      data: { booking },
    };
  }

  @Post(':id/check-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in a guest (hotel staff only)' })
  async checkIn(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingsService.checkIn(id, req.user.userId);
    return {
      success: true,
      data: { booking },
    };
  }

  @Post(':id/check-out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check out a guest (hotel staff only)' })
  async checkOut(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingsService.checkOut(id, req.user.userId);
    return {
      success: true,
      data: { booking },
    };
  }
}
