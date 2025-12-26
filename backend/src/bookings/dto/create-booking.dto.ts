import { IsString, IsDate, IsNumber, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class GuestDetailsDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;
}

export class CreateBookingDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomTypeId: string;

  @Type(() => Date)
  @IsDate()
  checkInDate: Date;

  @Type(() => Date)
  @IsDate()
  checkOutDate: Date;

  @IsNumber()
  numGuests: number;

  @ValidateNested()
  @Type(() => GuestDetailsDto)
  guestDetails: GuestDetailsDto;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}
