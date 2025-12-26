import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initialize payment' })
  async initialize(@Body('bookingId') bookingId: string) {
    const result = await this.paymentsService.initializePayment(bookingId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhooks/paystack')
  @ApiOperation({ summary: 'Paystack webhook handler' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.paymentsService.handleWebhook(payload, signature);
    return { success: true };
  }
}
