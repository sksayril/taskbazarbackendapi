# Admin API — Gift Voucher Requests

Base URL prefix: `/admin` (same as other admin routes).

Authentication: `Authorization: Bearer <JWT_TOKEN>` (admin login token).

---

## Gift Voucher Requests

Admin panel section: **Gift Voucher Requests**.

**Lifecycle**

1. User creates request → `Pending` (wallet already debited on user side).
2. **Approve** → `Approved` (admin will enter the code next).
3. **Deliver** → `Delivered` and `voucherCode` is stored; user sees the code in the app.
4. **Reject** (only while `Pending`) → `Rejected` and the **amount is refunded** to the user’s wallet.

Statuses: `Pending`, `Approved`, `Rejected`, `Delivered`.

---

### GET /admin/gift-voucher/requests

List all gift voucher requests. Optional filter by status.

**Query parameters (optional)**

| Parameter | Values |
|-----------|--------|
| `status` | `Pending`, `Approved`, `Rejected`, `Delivered` |

**Example**
```
GET /admin/gift-voucher/requests?status=Pending
```

**Response (Success - 200)**
```json
{
  "message": "Gift voucher requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userMobileNumber": "9876543210",
        "userDeviceId": "device123",
        "type": "giftcard",
        "brand": "Amazon",
        "amount": 100,
        "status": "Pending",
        "voucherCode": null,
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      }
    ],
    "totalRequests": 1,
    "pendingCount": 1,
    "approvedCount": 0,
    "rejectedCount": 0,
    "deliveredCount": 0
  }
}
```

---

### POST /admin/gift-voucher/request/:requestId/approve

Approve a **Pending** request (move to `Approved` so the voucher code can be delivered next).

**URL parameters**

| Parameter | Description |
|-----------|-------------|
| `requestId` | MongoDB `_id` of the gift voucher request |

**Request body (optional)**
```json
{
  "adminNotes": "Verified stock"
}
```

**Response (Success - 200)**
```json
{
  "message": "Gift voucher request approved successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "giftcard",
    "brand": "Amazon",
    "amount": 100,
    "status": "Approved",
    "adminNotes": "Verified stock",
    "userWalletBalance": 400,
    "updatedAt": "2024-01-18T22:30:00.000Z"
  }
}
```

**Response (Error - 400)** — not pending
```json
{
  "message": "This gift voucher request is already approved"
}
```

**Response (Error - 404)**
```json
{
  "message": "Gift voucher request not found"
}
```

---

### POST /admin/gift-voucher/request/:requestId/reject

Reject a **Pending** request and **refund** the amount to the user.

**Request body (optional)**
```json
{
  "adminNotes": "Invalid / duplicate request"
}
```

**Response (Success - 200)**
```json
{
  "message": "Gift voucher request rejected successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "giftcard",
    "brand": "Amazon",
    "amount": 100,
    "status": "Rejected",
    "adminNotes": "Invalid / duplicate request",
    "userWalletBalance": 500,
    "updatedAt": "2024-01-18T22:35:00.000Z"
  }
}
```

---

### POST /admin/gift-voucher/request/:requestId/deliver

Attach the **voucher code** and set status to **Delivered**. Allowed only when current status is **Approved**.

**Request body**
```json
{
  "voucherCode": "ABCD-EFGH-IJKL",
  "adminNotes": "Sent via panel"
}
```

- `voucherCode` — **required**, non-empty string after trim.

**Response (Success - 200)**
```json
{
  "message": "Gift voucher code delivered successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "giftcard",
    "brand": "Amazon",
    "amount": 100,
    "status": "Delivered",
    "voucherCode": "ABCD-EFGH-IJKL",
    "adminNotes": "Sent via panel",
    "userWalletBalance": 400,
    "updatedAt": "2024-01-18T23:00:00.000Z"
  }
}
```

**Response (Error - 400)** — wrong status
```json
{
  "message": "Voucher code can only be delivered after the request is approved (current status must be Approved)"
}
```

**Response (Error - 400)** — missing code
```json
{
  "message": "voucherCode is required to deliver the gift voucher"
}
```

---

### Stored record shape (database)

Illustrative fields:

```json
{
  "UserId": "<ObjectId>",
  "Type": "giftcard",
  "Brand": "Amazon",
  "Amount": 100,
  "Status": "Pending",
  "VoucherCode": null,
  "AdminNotes": null
}
```

---

For all other admin endpoints (users, cash withdrawal, settings, etc.), see `admin.md` in this repository.
