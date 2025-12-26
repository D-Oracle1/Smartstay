import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PaymentsService {
  private paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private bookingsService: BookingsService,
    private configService: ConfigService,
  ) {}

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(bookingId: string) {
    const booking = await this.bookingsService.findByReference(bookingId);

    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: booking.guestEmail,
        amount: booking.totalAmountNgn * 100, // Convert to kobo
        reference: `PAY-${booking.bookingReference}`,
        callback_url: `${this.configService.get('FRONTEND_URL')}/bookings/${booking.id}/confirm`,
        metadata: {
          booking_id: booking.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    // Store payment record
    const payment = this.paymentsRepository.create({
      bookingId: booking.id,
      paystackReference: response.data.data.reference,
      paystackAccessCode: response.data.data.access_code,
      amountNgn: booking.totalAmountNgn,
      paymentMethod: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
      customerEmail: booking.guestEmail,
      customerPhone: booking.guestPhone,
    });

    await this.paymentsRepository.save(payment);

    return {
      paystackAccessCode: response.data.data.access_code,
      paystackReference: response.data.data.reference,
      authorizationUrl: response.data.data.authorization_url,
      amount: booking.totalAmountNgn,
      currency: 'NGN',
    };
  }

  /**
   * Verify payment webhook from Paystack
   */
  async handleWebhook(payload: any, signature: string) {
    // Verify signature
    const hash = crypto
      .createHmac('sha512', this.configService.get('PAYSTACK_WEBHOOK_SECRET'))
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid signature');
    }

    const { event, data } = payload;

    if (event === 'charge.success') {
      await this.confirmPayment(data.reference);
    }
  }

  /**
   * Confirm payment after verification
   */
  async confirmPayment(reference: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { paystackReference: reference },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify with Paystack API
    const verification = await axios.get(
      `${this.paystackBaseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    if (verification.data.data.status === 'success') {
      // Update payment
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      payment.gatewayResponse = verification.data.data;

      await this.paymentsRepository.save(payment);

      // Confirm booking
      await this.bookingsService.confirmBooking(payment.bookingId);

      return payment;
    }

    throw new Error('Payment verification failed');
  }
}
