# SmartStay - API Documentation

**Base URL**: `https://api.smartstay.ng/v1`
**Environment**: Production

**Development**: `http://localhost:3000/v1`

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

### Token Lifetime
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., double booking)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 1. Authentication Endpoints

### POST /auth/register

Register a new user account.

**Public**: ✅ Yes

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "role": "guest"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "guest",
      "emailVerified": false,
      "createdAt": "2025-12-20T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Validation Rules**:
- Email must be unique
- Password min 8 characters, must include: uppercase, lowercase, number
- Phone must be valid Nigerian number (+234...)

---

### POST /auth/login

Login with email and password.

**Public**: ✅ Yes

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "guest"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Error** `401 Unauthorized`:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Public**: ✅ Yes

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/logout

Invalidate refresh token.

**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 2. Hotels Endpoints

### GET /hotels

Search and list hotels.

**Public**: ✅ Yes

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | No | User latitude |
| `lon` | number | No | User longitude |
| `radius` | number | No | Search radius in km (default: 10) |
| `city` | string | No | City name (if no lat/lon) |
| `checkIn` | date | No | Check-in date (YYYY-MM-DD) |
| `checkOut` | date | No | Check-out date (YYYY-MM-DD) |
| `guests` | number | No | Number of guests (default: 1) |
| `minPrice` | number | No | Minimum price per night (NGN) |
| `maxPrice` | number | No | Maximum price per night (NGN) |
| `amenities` | string | No | Comma-separated (WiFi,Pool,Gym) |
| `rating` | number | No | Minimum star rating (1-5) |
| `sort` | string | No | Sort by: distance, price, rating |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20, max: 50) |

**Example Request**:
```http
GET /hotels?lat=6.5244&lon=3.3792&radius=5&checkIn=2025-12-25&checkOut=2025-12-27&guests=2&sort=distance
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "hotel_123",
        "name": "Golden Suites Hotel",
        "slug": "golden-suites-hotel",
        "address": "15 Allen Avenue, Ikeja, Lagos",
        "city": "Lagos",
        "state": "Lagos",
        "location": {
          "lat": 6.5244,
          "lon": 3.3792
        },
        "distance": 1.2,
        "travelTime": 5,
        "starRating": 4,
        "averageReviewScore": 4.3,
        "totalReviews": 120,
        "coverImage": "https://cdn.smartstay.ng/hotels/golden-suites/cover.jpg",
        "startingPrice": 18000,
        "availableRooms": 5,
        "amenities": ["WiFi", "Pool", "Restaurant", "Parking"]
      },
      {
        "id": "hotel_456",
        "name": "Royal Palace Hotel",
        "slug": "royal-palace-hotel",
        "address": "23 Victoria Island, Lagos",
        "city": "Lagos",
        "state": "Lagos",
        "location": {
          "lat": 6.4281,
          "lon": 3.4219
        },
        "distance": 2.1,
        "travelTime": 8,
        "starRating": 5,
        "averageReviewScore": 4.8,
        "totalReviews": 89,
        "coverImage": "https://cdn.smartstay.ng/hotels/royal-palace/cover.jpg",
        "startingPrice": 25000,
        "availableRooms": 3,
        "amenities": ["WiFi", "Pool", "Gym", "Spa", "Restaurant"]
      }
    ],
    "meta": {
      "total": 23,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

### GET /hotels/:id

Get hotel details by ID.

**Public**: ✅ Yes

**URL Parameters**:
- `id` - Hotel ID or slug

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "hotel_123",
    "name": "Golden Suites Hotel",
    "slug": "golden-suites-hotel",
    "description": "Luxury hotel in the heart of Ikeja with modern amenities...",
    "address": {
      "line1": "15 Allen Avenue",
      "line2": "Ikeja",
      "city": "Lagos",
      "state": "Lagos",
      "country": "Nigeria",
      "postalCode": "100001"
    },
    "location": {
      "lat": 6.5244,
      "lon": 3.3792
    },
    "contact": {
      "phone": "+2348012345678",
      "email": "info@goldensuites.com",
      "website": "https://goldensuites.com"
    },
    "starRating": 4,
    "averageReviewScore": 4.3,
    "totalReviews": 120,
    "totalRooms": 45,
    "images": [
      {
        "url": "https://cdn.smartstay.ng/hotels/golden-suites/1.jpg",
        "alt": "Hotel lobby",
        "isCover": true
      },
      {
        "url": "https://cdn.smartstay.ng/hotels/golden-suites/2.jpg",
        "alt": "Swimming pool",
        "isCover": false
      }
    ],
    "amenities": [
      { "name": "WiFi", "icon": "wifi", "isFree": true },
      { "name": "Pool", "icon": "pool", "isFree": true },
      { "name": "Restaurant", "icon": "restaurant", "isFree": false },
      { "name": "Parking", "icon": "parking", "isFree": true }
    ],
    "checkInTime": "14:00",
    "checkOutTime": "12:00",
    "cancellationPolicy": "Free cancellation up to 24 hours before check-in",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### GET /hotels/:id/rooms

Get available rooms for a hotel.

**Public**: ✅ Yes

**URL Parameters**:
- `id` - Hotel ID

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `checkIn` | date | Yes | Check-in date (YYYY-MM-DD) |
| `checkOut` | date | Yes | Check-out date (YYYY-MM-DD) |
| `guests` | number | No | Number of guests (default: 1) |

**Example Request**:
```http
GET /hotels/hotel_123/rooms?checkIn=2025-12-25&checkOut=2025-12-27&guests=2
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "roomTypes": [
      {
        "id": "room_type_1",
        "name": "Standard Room",
        "slug": "standard-room",
        "description": "Comfortable room with city view",
        "maxGuests": 2,
        "numBeds": 1,
        "bedType": "Double",
        "roomSizeSqm": 25,
        "basePrice": 18000,
        "weekendPrice": 20000,
        "totalPrice": 36000,
        "pricePerNight": 18000,
        "numNights": 2,
        "amenities": ["WiFi", "TV", "Mini Bar", "Air Conditioning"],
        "images": [
          {
            "url": "https://cdn.smartstay.ng/rooms/standard/1.jpg",
            "alt": "Standard room bed"
          }
        ],
        "availableRooms": 5,
        "roomNumbers": ["101", "102", "103", "201", "202"]
      },
      {
        "id": "room_type_2",
        "name": "Deluxe Room",
        "slug": "deluxe-room",
        "description": "Spacious room with king bed and balcony",
        "maxGuests": 2,
        "numBeds": 1,
        "bedType": "King",
        "roomSizeSqm": 35,
        "basePrice": 25000,
        "weekendPrice": 28000,
        "totalPrice": 50000,
        "pricePerNight": 25000,
        "numNights": 2,
        "amenities": ["WiFi", "TV", "Mini Bar", "Balcony", "Bathtub"],
        "images": [
          {
            "url": "https://cdn.smartstay.ng/rooms/deluxe/1.jpg",
            "alt": "Deluxe room"
          }
        ],
        "availableRooms": 2,
        "roomNumbers": ["301", "302"]
      }
    ]
  }
}
```

---

### POST /hotels

Create a new hotel (Platform Admin only).

**Auth Required**: ✅ Yes
**Roles**: `platform_admin`

**Request Body**:
```json
{
  "name": "Sunset Inn",
  "address": {
    "line1": "10 Admiralty Way",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria"
  },
  "location": {
    "lat": 6.4281,
    "lon": 3.4219
  },
  "contact": {
    "phone": "+2348012345678",
    "email": "info@sunsetinn.com"
  },
  "description": "Beautiful hotel by the waterfront...",
  "starRating": 4,
  "ownerId": "user_id_of_hotel_admin"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "id": "hotel_789",
    "name": "Sunset Inn",
    "status": "pending_approval",
    "createdAt": "2025-12-20T10:30:00Z"
  }
}
```

---

## 3. Bookings Endpoints

### POST /bookings

Create a new booking (locks room, pending payment).

**Auth Required**: ✅ Yes
**Roles**: `guest`

**Request Body**:
```json
{
  "hotelId": "hotel_123",
  "roomTypeId": "room_type_1",
  "checkInDate": "2025-12-25",
  "checkOutDate": "2025-12-27",
  "numGuests": 2,
  "guestDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+2348012345678"
  },
  "specialRequests": "Late check-in please"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_abc123",
      "reference": "BS-2025-12345",
      "status": "pending_payment",
      "hotel": {
        "id": "hotel_123",
        "name": "Golden Suites Hotel"
      },
      "room": {
        "id": "room_101",
        "type": "Standard Room",
        "roomNumber": "101"
      },
      "checkInDate": "2025-12-25",
      "checkOutDate": "2025-12-27",
      "numNights": 2,
      "numGuests": 2,
      "pricing": {
        "roomRate": 18000,
        "numNights": 2,
        "subtotal": 36000,
        "serviceFee": 500,
        "total": 36500
      },
      "lockExpiresAt": "2025-12-20T10:45:00Z",
      "createdAt": "2025-12-20T10:30:00Z"
    },
    "paymentInfo": {
      "paystackAccessCode": "abc123xyz",
      "paystackReference": "PAY-BS-2025-12345",
      "amount": 36500,
      "currency": "NGN"
    }
  }
}
```

**Notes**:
- Room is locked for 15 minutes
- If payment not completed, booking auto-cancelled and room unlocked

---

### GET /bookings

Get user's bookings.

**Auth Required**: ✅ Yes
**Roles**: `guest`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: upcoming, past, cancelled |
| `page` | number | No | Page number |
| `limit` | number | No | Results per page |

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_abc123",
        "reference": "BS-2025-12345",
        "status": "confirmed",
        "hotel": {
          "id": "hotel_123",
          "name": "Golden Suites Hotel",
          "coverImage": "https://cdn.smartstay.ng/hotels/golden-suites/cover.jpg"
        },
        "room": {
          "type": "Standard Room"
        },
        "checkInDate": "2025-12-25",
        "checkOutDate": "2025-12-27",
        "numNights": 2,
        "totalAmount": 36500,
        "createdAt": "2025-12-20T10:30:00Z"
      }
    ],
    "meta": {
      "total": 5,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### GET /bookings/:reference

Get booking details by reference.

**Auth Required**: ✅ Yes

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "booking_abc123",
    "reference": "BS-2025-12345",
    "status": "confirmed",
    "hotel": {
      "id": "hotel_123",
      "name": "Golden Suites Hotel",
      "address": "15 Allen Avenue, Ikeja, Lagos",
      "phone": "+2348012345678"
    },
    "room": {
      "id": "room_101",
      "type": "Standard Room",
      "roomNumber": "101"
    },
    "guest": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+2348012345678"
    },
    "checkInDate": "2025-12-25",
    "checkOutDate": "2025-12-27",
    "numNights": 2,
    "numGuests": 2,
    "specialRequests": "Late check-in please",
    "pricing": {
      "roomRate": 18000,
      "numNights": 2,
      "subtotal": 36000,
      "serviceFee": 500,
      "total": 36500
    },
    "payment": {
      "status": "completed",
      "method": "card",
      "paidAt": "2025-12-20T10:35:00Z"
    },
    "createdAt": "2025-12-20T10:30:00Z"
  }
}
```

---

### POST /bookings/:id/cancel

Cancel a booking.

**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "reason": "Change of plans"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_abc123",
      "reference": "BS-2025-12345",
      "status": "cancelled",
      "refundAmount": 36500,
      "cancelledAt": "2025-12-20T11:00:00Z"
    },
    "message": "Booking cancelled successfully. Refund will be processed in 3-5 business days."
  }
}
```

---

### POST /bookings/:id/check-in

Check in a guest (Hotel Staff only).

**Auth Required**: ✅ Yes
**Roles**: `hotel_staff`, `hotel_admin`

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_abc123",
      "status": "checked_in",
      "checkedInAt": "2025-12-25T14:30:00Z",
      "checkedInBy": {
        "id": "staff_123",
        "name": "Jane Smith"
      }
    }
  }
}
```

---

### POST /bookings/:id/check-out

Check out a guest (Hotel Staff only).

**Auth Required**: ✅ Yes
**Roles**: `hotel_staff`, `hotel_admin`

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_abc123",
      "status": "checked_out",
      "checkedOutAt": "2025-12-27T11:00:00Z",
      "checkedOutBy": {
        "id": "staff_123",
        "name": "Jane Smith"
      }
    }
  }
}
```

---

## 4. Payments Endpoints

### POST /payments/initialize

Initialize payment (already done in booking creation, but can retry).

**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "bookingId": "booking_abc123"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "paystackAccessCode": "abc123xyz",
    "paystackReference": "PAY-BS-2025-12345",
    "authorizationUrl": "https://checkout.paystack.com/abc123xyz",
    "amount": 36500,
    "currency": "NGN"
  }
}
```

**Frontend Action**:
```javascript
// Open Paystack modal
PaystackPop.setup({
  key: 'pk_live_xxx',
  email: 'john@example.com',
  amount: 3650000, // In kobo (36500 * 100)
  ref: 'PAY-BS-2025-12345',
  onSuccess: (transaction) => {
    // Verify payment
    verifyPayment(transaction.reference);
  }
});
```

---

### POST /payments/webhooks/paystack

Paystack webhook (internal use).

**Public**: ✅ Yes (but signature-verified)

**Headers**:
```http
x-paystack-signature: <hmac_sha512_signature>
```

**Request Body** (from Paystack):
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PAY-BS-2025-12345",
    "amount": 3650000,
    "status": "success",
    "paid_at": "2025-12-20T10:35:00Z",
    "customer": {
      "email": "john@example.com"
    }
  }
}
```

**Processing**:
1. Verify signature
2. Verify transaction with Paystack API
3. Confirm booking
4. Update room status
5. Send confirmation email
6. Emit real-time event

---

### GET /payments/:reference/verify

Verify payment status.

**Auth Required**: ✅ Yes

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment_xyz",
      "reference": "PAY-BS-2025-12345",
      "status": "completed",
      "amount": 36500,
      "currency": "NGN",
      "method": "card",
      "paidAt": "2025-12-20T10:35:00Z"
    },
    "booking": {
      "id": "booking_abc123",
      "reference": "BS-2025-12345",
      "status": "confirmed"
    }
  }
}
```

---

## 5. Reviews Endpoints

### POST /reviews

Create a review (must have completed booking).

**Auth Required**: ✅ Yes
**Roles**: `guest`

**Request Body**:
```json
{
  "bookingId": "booking_abc123",
  "overallRating": 4,
  "cleanlinessRating": 5,
  "locationRating": 4,
  "serviceRating": 4,
  "valueRating": 3,
  "title": "Great stay!",
  "comment": "The hotel was clean and staff were friendly. Location is perfect for business travelers.",
  "images": [
    "https://cdn.smartstay.ng/reviews/image1.jpg"
  ]
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "review_123",
      "hotelId": "hotel_123",
      "guestName": "John Doe",
      "overallRating": 4,
      "title": "Great stay!",
      "comment": "The hotel was clean...",
      "isVerified": true,
      "createdAt": "2025-12-28T10:00:00Z"
    }
  }
}
```

---

### GET /hotels/:id/reviews

Get reviews for a hotel.

**Public**: ✅ Yes

**Query Parameters**:
- `page`, `limit`
- `sort`: recent, highest, lowest

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_123",
        "guest": {
          "name": "John Doe",
          "profileImage": "https://cdn.smartstay.ng/users/john.jpg"
        },
        "overallRating": 4,
        "title": "Great stay!",
        "comment": "The hotel was clean...",
        "isVerified": true,
        "hotelResponse": "Thank you for your feedback!",
        "createdAt": "2025-12-28T10:00:00Z"
      }
    ],
    "meta": {
      "total": 120,
      "averageRating": 4.3,
      "ratingDistribution": {
        "5": 60,
        "4": 40,
        "3": 15,
        "2": 3,
        "1": 2
      }
    }
  }
}
```

---

## 6. Admin Endpoints (Hotel Dashboard)

### GET /admin/hotels/:id/dashboard

Get hotel dashboard stats.

**Auth Required**: ✅ Yes
**Roles**: `hotel_admin`, `hotel_staff`

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRooms": 45,
      "occupiedRooms": 32,
      "availableRooms": 11,
      "cleaningRooms": 2,
      "maintenanceRooms": 0,
      "occupancyRate": 71.1,
      "todayCheckins": 8,
      "todayCheckouts": 5,
      "revenueToday": 450000,
      "revenueThisMonth": 12500000
    },
    "upcomingCheckins": [
      {
        "bookingId": "booking_abc",
        "reference": "BS-2025-12345",
        "guestName": "John Doe",
        "roomNumber": "101",
        "checkInTime": "14:00",
        "status": "confirmed"
      }
    ],
    "recentBookings": [
      {
        "id": "booking_xyz",
        "reference": "BS-2025-67890",
        "guestName": "Jane Smith",
        "roomType": "Deluxe Room",
        "checkIn": "2025-12-25",
        "checkOut": "2025-12-27",
        "amount": 50000,
        "status": "confirmed",
        "createdAt": "2025-12-20T09:00:00Z"
      }
    ]
  }
}
```

---

### PATCH /admin/rooms/:id/status

Update room status.

**Auth Required**: ✅ Yes
**Roles**: `hotel_staff`, `hotel_admin`

**Request Body**:
```json
{
  "status": "cleaning",
  "notes": "Guest reported leaky faucet"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "room_101",
      "roomNumber": "101",
      "status": "cleaning",
      "updatedAt": "2025-12-27T11:30:00Z"
    }
  }
}
```

---

## 7. Platform Admin Endpoints

### GET /admin/platform/dashboard

Get platform-wide stats (Super Admin only).

**Auth Required**: ✅ Yes
**Roles**: `platform_admin`

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalHotels": 45,
      "activeHotels": 42,
      "pendingApprovals": 3,
      "totalUsers": 1250,
      "totalBookings": 3200,
      "totalRevenue": 125000000,
      "commissionEarned": 12500000
    },
    "recentHotels": [
      {
        "id": "hotel_new",
        "name": "Sunset Inn",
        "city": "Lagos",
        "status": "pending_approval",
        "submittedAt": "2025-12-20T10:00:00Z"
      }
    ]
  }
}
```

---

### POST /admin/platform/hotels/:id/approve

Approve a hotel.

**Auth Required**: ✅ Yes
**Roles**: `platform_admin`

**Request Body**:
```json
{
  "commissionRate": 12.5
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "hotel": {
      "id": "hotel_new",
      "name": "Sunset Inn",
      "status": "active",
      "commissionRate": 12.5,
      "approvedAt": "2025-12-20T14:00:00Z"
    }
  }
}
```

---

## 8. WebSocket Events (Real-Time)

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('wss://api.smartstay.ng', {
  auth: {
    token: accessToken
  }
});

socket.on('connect', () => {
  console.log('Connected to real-time server');
});
```

---

### Events (Client → Server)

#### join_hotel
Subscribe to hotel updates.

```javascript
socket.emit('join_hotel', { hotelId: 'hotel_123' });
```

#### leave_hotel
Unsubscribe from hotel updates.

```javascript
socket.emit('leave_hotel', { hotelId: 'hotel_123' });
```

---

### Events (Server → Client)

#### room_status_changed
Room status updated.

```javascript
socket.on('room_status_changed', (data) => {
  console.log(data);
  // {
  //   roomId: 'room_101',
  //   status: 'cleaning',
  //   timestamp: '2025-12-27T11:30:00Z'
  // }
});
```

#### new_booking
New booking created.

```javascript
socket.on('new_booking', (data) => {
  console.log(data);
  // {
  //   bookingId: 'booking_abc',
  //   reference: 'BS-2025-12345',
  //   roomNumber: '101',
  //   guestName: 'John Doe',
  //   checkIn: '2025-12-25',
  //   amount: 36500
  // }
});
```

#### lock_expiring
Room lock expiring soon.

```javascript
socket.on('lock_expiring', (data) => {
  console.log(data);
  // {
  //   bookingId: 'booking_abc',
  //   secondsRemaining: 60
  // }
  // Show warning to user
});
```

---

## Rate Limiting

| Endpoint Type | Rate Limit |
|---------------|------------|
| Public (unauthenticated) | 100 req/min per IP |
| Authenticated | 300 req/min per user |
| Payment webhooks | Unlimited (signature-verified) |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Error** `429 Too Many Requests`:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 30
  }
}
```

---

## Postman Collection

Download the Postman collection: [SmartStay API.postman_collection.json](./SmartStay_API_Collection.json)

**Environment Variables**:
```json
{
  "baseUrl": "https://api.smartstay.ng/v1",
  "accessToken": "{{your_token}}"
}
```

---

## SDKs

### JavaScript/TypeScript SDK

```bash
npm install @smartstay/sdk
```

```typescript
import { SmartStayClient } from '@smartstay/sdk';

const client = new SmartStayClient({
  apiKey: 'your_api_key',
  environment: 'production' // or 'development'
});

// Search hotels
const hotels = await client.hotels.search({
  lat: 6.5244,
  lon: 3.3792,
  radius: 5
});

// Create booking
const booking = await client.bookings.create({
  hotelId: 'hotel_123',
  roomTypeId: 'room_type_1',
  checkInDate: '2025-12-25',
  checkOutDate: '2025-12-27',
  guestDetails: { ... }
});
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `ROOM_NOT_AVAILABLE` | 409 | Room already booked |
| `ROOM_LOCKED` | 409 | Room locked by another user |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `PAYMENT_FAILED` | 400 | Payment processing failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Changelog

### v1.0.0 (2025-12-20)
- Initial API release
- All core endpoints implemented
- WebSocket support added
- Paystack integration complete

---

## Support

- **API Status**: [status.smartstay.ng](https://status.smartstay.ng)
- **Documentation**: [docs.smartstay.ng](https://docs.smartstay.ng)
- **Email**: developers@smartstay.ng
- **Discord**: [SmartStay Developers](https://discord.gg/smartstay)

---

**Next**: Backend Implementation
