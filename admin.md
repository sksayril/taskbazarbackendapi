# Admin API Documentation

This document describes the Admin APIs available in the application.

## Base URL
```
http://localhost:3000/admin
```

---

## Password Encryption

The application uses **crypto-js** with **AES encryption** for password storage. This allows:
- **Encryption**: Passwords are encrypted before storage in the database
- **Decryption**: Passwords can be decrypted to retrieve the original password text
- **Retrieval**: Admin can view the original password text via API endpoints

### Encryption Key Configuration

The encryption key is stored in the `ENCRYPTION_KEY` environment variable. For production, set a strong encryption key (minimum 32 characters):

```bash
ENCRYPTION_KEY=your-very-secure-encryption-key-minimum-32-characters-long
```

If not set, a default key is used (not recommended for production).

### Important Notes

- Passwords are encrypted using AES encryption (not hashed)
- Original passwords can be retrieved/decrypted
- Admin endpoints return the original decrypted password text
- User signup and login use crypto-js encryption/decryption
- All password operations use the same encryption key

---

## 1. Admin Signup

Create a new admin account.

### Endpoint
```
POST /admin/signup
```

### Request Body
```json
{
  "Email": "admin@example.com",
  "Password": "admin123"
}
```

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Admin Created Successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Email": "admin@example.com",
    "Password": "admin123",
    "__v": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIkVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** The JWT token is valid for 30 days from the time of generation.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "Email and Password are required"
}
```

#### 400 Bad Request - Admin Already Exists
```json
{
  "message": "Admin Already Exist"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 2. Admin Login

Authenticate an admin user.

### Endpoint
```
POST /admin/login
```

### Request Body
```json
{
  "Email": "admin@example.com",
  "Password": "admin123"
}
```

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Login Successful",
  "data": {
    "Email": "admin@example.com",
    "_id": "507f1f77bcf86cd799439011"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIkVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** The JWT token is valid for 30 days from the time of generation.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "Email and Password are required"
}
```

#### 404 Not Found - Admin Not Found
```json
{
  "message": "Admin Not Found"
}
```

#### 401 Unauthorized - Invalid Password
```json
{
  "message": "Invalid Password"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 3. Set Captcha Settings

Configure captcha settings including daily limit per user and reward per captcha.

### Endpoint
```
POST /admin/captcha/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "DailyCaptchaLimit": 10,
  "RewardPerCaptcha": 1,
  "RewardType": "Coins"
}
```

**Note:** 
- `DailyCaptchaLimit`: Maximum number of captchas a user can solve per day (must be > 0)
- `RewardPerCaptcha`: Reward amount per captcha solve (must be >= 0)
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")

### Success Response (200 OK)
```json
{
  "message": "Captcha settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "DailyCaptchaLimit and RewardPerCaptcha are required"
}
```

#### 400 Bad Request - Invalid Daily Limit
```json
{
  "message": "DailyCaptchaLimit must be greater than 0"
}
```

#### 400 Bad Request - Invalid Reward Amount
```json
{
  "message": "RewardPerCaptcha must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 4. Get Captcha Settings

Retrieve current captcha settings.

### Endpoint
```
GET /admin/captcha/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Captcha settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned:
- DailyCaptchaLimit: 10
- RewardPerCaptcha: 1
- RewardType: "Coins"

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 5. Set Referral Settings

Configure referral reward settings for when users join using a referral code.

### Endpoint
```
POST /admin/referral/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "RewardForNewUser": 10,
  "RewardForReferrer": 5,
  "RewardType": "Coins"
}
```

**Note:** 
- `RewardForNewUser`: Reward amount given to the new user who joins using a referral code (must be >= 0)
- `RewardForReferrer`: Reward amount given to the user whose referral code was used (must be >= 0)
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")

### Success Response (200 OK)
```json
{
  "message": "Referral settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "RewardForNewUser and RewardForReferrer are required"
}
```

#### 400 Bad Request - Invalid Reward Amount
```json
{
  "message": "Reward amounts must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 6. Get Referral Settings

Retrieve current referral reward settings.

### Endpoint
```
GET /admin/referral/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Referral settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned:
- RewardForNewUser: 0
- RewardForReferrer: 0
- RewardType: "Coins"

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## Example Usage

### Using cURL

#### Signup
```bash
curl -X POST http://localhost:3000/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "admin123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "admin123"
  }'
```

#### Set Captcha Settings
```bash
curl -X POST http://localhost:3000/admin/captcha/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins"
  }'
```

#### Get Captcha Settings
```bash
curl -X GET http://localhost:3000/admin/captcha/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Set Referral Settings
```bash
curl -X POST http://localhost:3000/admin/referral/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins"
  }'
```

#### Get Referral Settings
```bash
curl -X GET http://localhost:3000/admin/referral/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Set Daily Bonus Settings
```bash
curl -X POST http://localhost:3000/admin/dailybonus/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins"
  }'
```

#### Get Daily Bonus Settings
```bash
curl -X GET http://localhost:3000/admin/dailybonus/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Signup
```javascript
fetch('http://localhost:3000/admin/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Email: 'admin@example.com',
    Password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

#### Login
```javascript
fetch('http://localhost:3000/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Email: 'admin@example.com',
    Password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

#### Set Captcha Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/captcha/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    DailyCaptchaLimit: 10,
    RewardPerCaptcha: 1,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Captcha Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/captcha/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Captcha Settings:', data.data);
  console.log('Daily Limit:', data.data.DailyCaptchaLimit);
  console.log('Reward per Captcha:', data.data.RewardPerCaptcha);
})
.catch(error => console.error('Error:', error));
```

#### Set Referral Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/referral/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    RewardForNewUser: 10,
    RewardForReferrer: 5,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Referral settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Referral Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/referral/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Referral Settings:', data.data);
  console.log('Reward for New User:', data.data.RewardForNewUser);
  console.log('Reward for Referrer:', data.data.RewardForReferrer);
})
.catch(error => console.error('Error:', error));
```

#### Set Daily Bonus Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/dailybonus/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Monday: 10,
    Tuesday: 15,
    Wednesday: 20,
    Thursday: 25,
    Friday: 30,
    Saturday: 50,
    Sunday: 100,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Daily bonus settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Daily Bonus Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/dailybonus/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Daily Bonus Settings:', data.data);
  console.log('Monday Bonus:', data.data.Monday);
  console.log('Sunday Bonus:', data.data.Sunday);
})
.catch(error => console.error('Error:', error));
```

---

## JWT Token

Both signup and login endpoints return a JWT (JSON Web Token) that should be used for authenticating subsequent API requests.

### Token Details
- **Expiration:** 30 days from generation
- **Payload:** Contains admin ID and Email
- **Usage:** Include the token in the `Authorization` header for protected routes:
  ```
  Authorization: Bearer <token>
  ```

### Example: Using Token in Requests
```bash
curl -X GET http://localhost:3000/protected-route \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
fetch('http://localhost:3000/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 7. Set Daily Bonus Settings

Configure daily bonus amounts for each day of the week.

### Endpoint
```
POST /admin/dailybonus/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Monday": 10,
  "Tuesday": 15,
  "Wednesday": 20,
  "Thursday": 25,
  "Friday": 30,
  "Saturday": 50,
  "Sunday": 100,
  "RewardType": "Coins"
}
```

**Note:** 
- All days (Monday through Sunday) are required
- Each day's bonus amount must be 0 or greater
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")
- Weekly reset happens automatically - users can claim each day's bonus once per week

### Success Response (200 OK)
```json
{
  "message": "Daily bonus settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "All days (Monday through Sunday) are required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "All bonus amounts must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 8. Get Daily Bonus Settings

Retrieve current daily bonus settings.

### Endpoint
```
GET /admin/dailybonus/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonus settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned (all days: 0, RewardType: "Coins")

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## Daily Spin Settings APIs

### POST /admin/dailyspin/settings
Set the **daily spin limit** (how many spins a user can use per day).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "DailySpinLimit": 20
}
```

**Validation Rules:**
- `DailySpinLimit` is required
- Must be a valid number
- Must be greater than 0

**Response (Success - 200):**
```json
{
  "message": "Daily spin settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "DailySpinLimit": 20
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Field
```json
{
  "message": "DailySpinLimit is required"
}
```

#### 400 Bad Request - Invalid Value
```json
{
  "message": "DailySpinLimit must be a valid number"
}
```

#### 400 Bad Request - Must be > 0
```json
{
  "message": "DailySpinLimit must be greater than 0"
}
```

---

### GET /admin/dailyspin/settings
Get the current daily spin settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Daily spin settings retrieved successfully",
  "data": {
    "DailySpinLimit": 20
  }
}
```

**Note:**
- If settings are not saved yet, default `DailySpinLimit: 10` is returned

---

## Withdrawal Request Management APIs

### GET /admin/withdrawal/requests
Get all withdrawal requests (with optional status filter).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status (`Pending`, `Approved`, `Rejected`)

**Example Request:**
```
GET /admin/withdrawal/requests?status=Pending
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userMobileNumber": "1234567890",
        "userDeviceId": "device123",
        "amount": 100,
        "paymentMethod": "UPI",
        "upiId": "user@upi",
        "virtualId": "VIRTUAL123",
        "bankAccountNumber": null,
        "bankIFSC": null,
        "bankName": null,
        "accountHolderName": null,
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      },
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b2",
        "userMobileNumber": "9876543210",
        "userDeviceId": "device456",
        "amount": 500,
        "paymentMethod": "BankTransfer",
        "upiId": null,
        "virtualId": null,
        "bankAccountNumber": "1234567890",
        "bankIFSC": "BANK0001234",
        "bankName": "Bank Name",
        "accountHolderName": "John Doe",
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-17T20:00:00.000Z"
      }
    ],
    "totalRequests": 2,
    "pendingCount": 2,
    "approvedCount": 0,
    "rejectedCount": 0
  }
}
```

**Notes:**
- All bank details are shown in full (not masked) for admin
- Requests are sorted by creation date (newest first)
- Can filter by status using query parameter

---

### POST /admin/withdrawal/request/:requestId/status
Approve or reject a withdrawal request.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `requestId`: The ID of the withdrawal request

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Payment processed successfully"
}
```

OR for rejection:
```json
{
  "status": "Rejected",
  "adminNotes": "Invalid bank details provided"
}
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal request approved successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "amount": 100,
    "paymentMethod": "UPI",
    "status": "Approved",
    "adminNotes": "Payment processed successfully",
    "userWalletBalance": 400,
    "updatedAt": "2024-01-18T22:30:00.000Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "message": "This withdrawal request has already been approved"
}
```

**Response (Error - 404):**
```json
{
  "message": "Withdrawal request not found"
}
```

**Important Notes:**
- When a withdrawal request is **approved**: The amount stays deducted from the user's wallet (already deducted when request was created)
- When a withdrawal request is **rejected**: The amount is automatically returned to the user's wallet
- Admin can add notes when approving/rejecting
- Once a request is processed (approved/rejected), it cannot be changed

---

## User Management APIs

### GET /admin/users
Get all users with pagination and search functionality.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of users per page (default: 50)
- `search`: Search by MobileNumber, DeviceId, or ReferCode

**Example Request:**
```
GET /admin/users?page=1&limit=20&search=123
```

**Response (Success - 200):**
```json
{
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "mobileNumber": "1234567890",
        "deviceId": "device123",
        "referCode": "PRK08F9",
        "coins": 100,
        "walletBalance": 500,
        "referredBy": null,
        "isBlocked": false,
        "blockedAt": null,
        "blockedReason": null,
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      },
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b2",
        "mobileNumber": "9876543210",
        "deviceId": "device456",
        "referCode": "PRK12A5",
        "coins": 50,
        "walletBalance": 200,
        "referredBy": "PRK08F9",
        "createdAt": "2024-01-17T18:00:00.000Z",
        "updatedAt": "2024-01-17T18:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalCoins": 15000,
      "totalWalletBalance": 75000
    }
  }
}
```

**Notes:**
- Returns all user fields including MobileNumber, DeviceId, ReferCode, Coins, WalletBalance, ReferredBy, and blocked status
- Includes blocked status fields: `isBlocked`, `blockedAt`, `blockedReason`
- Includes pagination information
- Includes aggregate statistics (total coins and wallet balance across all users)
- Supports search functionality across MobileNumber, DeviceId, and ReferCode

---

### GET /admin/users/:userId
Get detailed information about a specific user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `userId`: The ID of the user

**Response (Success - 200):**
```json
{
  "message": "User details retrieved successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "password": "userpassword123",
    "deviceId": "device123",
    "referCode": "PRK08F9",
    "coins": 100,
    "walletBalance": 500,
    "referredBy": null,
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null,
    "signupTime": "2024-01-18T20:00:00.000Z",
    "lastLoginTime": "2024-01-19T10:00:00.000Z",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z",
    "statistics": {
      "referralCount": 5,
      "totalWithdrawalRequests": 3,
      "pendingWithdrawals": 1,
      "approvedWithdrawals": 2,
      "rejectedWithdrawals": 0,
      "totalWithdrawn": 300,
      "totalAppSubmissions": 10,
      "approvedAppSubmissions": 8,
      "pendingAppSubmissions": 1,
      "rejectedAppSubmissions": 1,
      "totalEarningsFromApps": 400
    },
    "withdrawalRequests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "amount": 100,
        "paymentMethod": "UPI",
        "status": "Pending",
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      },
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "amount": 200,
        "paymentMethod": "BankTransfer",
        "status": "Approved",
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "appSubmissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Approved",
        "adminNotes": "Verified successfully",
        "createdAt": "2024-01-18T21:00:00.000Z",
        "updatedAt": "2024-01-18T21:30:00.000Z"
      }
    ]
  }
}
```

**Response (Error - 404):**
```json
{
  "message": "User not found"
}
```

**Notes:**
- Returns complete user profile with all fields including signupTime and lastLoginTime
- **Password Field**: Returns the original decrypted password text (not encrypted/hashed)
- Passwords are encrypted using crypto-js AES encryption and can be decrypted to retrieve the original password
- **Blocked Status**: Includes `isBlocked`, `blockedAt`, and `blockedReason` fields to show if user is blocked
- Includes comprehensive user statistics (referral count, withdrawal history, app submission/task completion data)
- Includes all withdrawal requests for the user with full details
- Includes all app installation submissions (task completions) with app details and status
- Shows referral performance, withdrawal activity, and task completion statistics
- App submission statistics include total submissions, approved/pending/rejected counts, and total earnings from apps
- **Security Note**: Passwords are encrypted using crypto-js (AES encryption) which allows decryption to retrieve the original password text

---

### PUT /admin/users/:userId
Edit user data including MobileNumber, Password, DeviceId, Coins, and WalletBalance.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to update

**Request Body (All fields optional - provide only fields you want to update):**
```json
{
  "MobileNumber": "9876543210",
  "Password": "newpassword123",
  "DeviceId": "new-device-id",
  "Coins": 500,
  "WalletBalance": 1000
}
```

**Note:**
- All fields are optional - you can update any combination of fields
- `MobileNumber`: Must be unique, cannot be used by another user
- `Password`: Will be encrypted using crypto-js (AES encryption) automatically (minimum 6 characters)
  - Password updates are supported and the original password text is shown in the response
  - The `password` field in the response contains the decrypted/updated password text
  - The `changes.password` object shows the old password (from) and new password (to)
- `DeviceId`: Must be unique, cannot be used by another user
- `Coins`: Must be a number >= 0
- `WalletBalance`: Must be a number >= 0
- At least one field must be provided to update

**Response (Success - 200):**
```json
{
  "message": "User updated successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "9876543210",
    "password": "newpassword123",
    "deviceId": "new-device-id",
    "referCode": "PRK08F9",
    "coins": 500,
    "walletBalance": 1000,
    "referredBy": null,
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T22:30:00.000Z",
    "changes": {
      "mobileNumber": {
        "from": "1234567890",
        "to": "9876543210"
      },
      "password": {
        "from": "oldpassword123",
        "to": "newpassword123"
      },
      "deviceId": {
        "from": "device123",
        "to": "new-device-id"
      },
      "coins": {
        "from": 100,
        "to": 500
      },
      "walletBalance": {
        "from": 500,
        "to": 1000
      }
    },
    "statistics": {
      "referralCount": 5,
      "totalWithdrawalRequests": 3
    }
  }
}
```

**Error Responses:**

#### 400 Bad Request - No Fields Provided
```json
{
  "message": "No fields provided to update. Please provide at least one field: MobileNumber, Password, DeviceId, Coins, or WalletBalance"
}
```

#### 400 Bad Request - Invalid MobileNumber
```json
{
  "message": "MobileNumber must be a valid non-empty string"
}
```

#### 400 Bad Request - MobileNumber Already Exists
```json
{
  "message": "MobileNumber already exists for another user"
}
```

#### 400 Bad Request - Invalid Password
```json
{
  "message": "Password must be at least 6 characters long"
}
```

#### 400 Bad Request - Invalid DeviceId
```json
{
  "message": "DeviceId must be a valid non-empty string"
}
```

#### 400 Bad Request - DeviceId Already Exists
```json
{
  "message": "DeviceId already exists for another user"
}
```

#### 400 Bad Request - Invalid Coins
```json
{
  "message": "Coins must be a valid number"
}
```

#### 400 Bad Request - Negative Coins
```json
{
  "message": "Coins cannot be negative"
}
```

#### 400 Bad Request - Invalid WalletBalance
```json
{
  "message": "WalletBalance must be a valid number"
}
```

#### 400 Bad Request - Negative WalletBalance
```json
{
  "message": "WalletBalance cannot be negative"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- Admin can update any user's data including profile information, device ID, coins, wallet balance, and **password**
- **Password Update**: Admin can update user passwords by providing the new password in the request body
- Password is automatically encrypted using crypto-js (AES encryption) before storage
- Passwords can be decrypted to retrieve the original password text
- The response shows the updated password in plain text (decrypted) in the `password` field
- The `changes.password` object shows both the old password (from) and new password (to) for password updates
- **Blocked Status**: Response includes `isBlocked`, `blockedAt`, and `blockedReason` fields showing user's blocked status
- All uniqueness validations are enforced (MobileNumber and DeviceId must be unique)
- Response includes before/after values for all changed fields including password
- User statistics are included in the response
- This endpoint requires admin authentication token

**Example Usage:**

**Using cURL - Update Password and Other Fields:**
```bash
curl -X PUT http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "newpassword123",
    "Coins": 500,
    "WalletBalance": 1000
  }'
```

**Using cURL - Update Only Password:**
```bash
curl -X PUT http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "newsecurepassword456"
  }'
```

**Using JavaScript (Fetch API) - Update Password:**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Password: 'newpassword123',
    Coins: 500,
    WalletBalance: 1000,
    DeviceId: 'new-device-id'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User updated:', data);
  console.log('Updated password:', data.data.password);
  console.log('Password changes:', data.data.changes.password);
  console.log('All changes:', data.data.changes);
})
.catch(error => console.error('Error:', error));
```

---

### POST /admin/users/:userId/block
Block a user account. Blocked users cannot access the system.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to block

**Request Body (Optional):**
```json
{
  "reason": "Violation of terms of service"
}
```

**Note:**
- `reason`: Optional reason for blocking the user (can be null)
- User must not already be blocked
- Blocked users will have `isBlocked: true` and `blockedAt` timestamp set

**Response (Success - 200):**
```json
{
  "message": "User blocked successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "isBlocked": true,
    "blockedAt": "2024-01-18T22:30:00.000Z",
    "blockedReason": "Violation of terms of service"
  }
}
```

**Error Responses:**

#### 400 Bad Request - User Already Blocked
```json
{
  "message": "User is already blocked"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Example Usage:**

**Using cURL:**
```bash
curl -X POST http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/block \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of terms of service"
  }'
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/block', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Violation of terms of service'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User blocked:', data);
  console.log('Blocked at:', data.data.blockedAt);
})
.catch(error => console.error('Error:', error));
```

---

### POST /admin/users/:userId/unblock
Unblock a user account. Unblocked users can access the system again.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to unblock

**Response (Success - 200):**
```json
{
  "message": "User unblocked successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null
  }
}
```

**Error Responses:**

#### 400 Bad Request - User Already Unblocked
```json
{
  "message": "User is already unblocked"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Example Usage:**

**Using cURL:**
```bash
curl -X POST http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/unblock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/unblock', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('User unblocked:', data);
  console.log('Is blocked:', data.data.isBlocked);
})
.catch(error => console.error('Error:', error));
```

**Notes:**
- Admin can block/unblock users to control access to the system
- Blocked users have `isBlocked: true` and a `blockedAt` timestamp
- Optional `reason` field can be provided when blocking a user
- Unblocking clears the blocked status, timestamp, and reason
- Blocked status is visible in all user endpoints (GET /admin/users, GET /admin/users/:userId, PUT /admin/users/:userId)
- This endpoint requires admin authentication token

---

## Notes

- All endpoints require `Content-Type: application/json` header
- Email and Password fields are required for both signup and login
- Passwords are stored in plain text (consider implementing password hashing for production)
- JWT tokens expire after 30 days - users will need to login again after expiration
- Set `JWT_SECRET` environment variable for production (defaults to a placeholder if not set)
- The base URL may vary depending on your server configuration
- Captcha settings APIs require JWT token authentication
- Captcha settings control how many captchas users can solve per day and the reward amount
- Reward type can be either "Coins" or "WalletBalance"
- Referral settings APIs require JWT token authentication
- Referral rewards are automatically calculated and distributed when a user signs up with a referral code
- Both the new user and the referrer receive rewards based on admin-configured settings
- Daily bonus settings APIs require JWT token authentication
- Daily bonuses reset automatically every week (Monday to Sunday cycle)
- Users can claim each day's bonus once per week
- Withdrawal request management APIs require JWT token authentication
- Admin can view all withdrawal requests with full user and payment details
- Admin can filter withdrawal requests by status (Pending, Approved, Rejected)
- When approving a withdrawal request, the amount stays deducted from user's wallet (already deducted when request was created)
- When rejecting a withdrawal request, the amount is automatically returned to user's wallet
- Admin can add notes when approving or rejecting withdrawal requests
- User management APIs require JWT token authentication
- Admin can view all users with pagination and search functionality
- Admin can get detailed information about individual users including statistics and withdrawal history
- Admin can edit user data including MobileNumber, Password, DeviceId, Coins, and WalletBalance
- All user edit operations validate uniqueness constraints and data types
- Password updates are automatically encrypted using crypto-js (AES encryption) and can be decrypted to retrieve the original password
- Edit response includes before/after values for all changed fields

---

## Coin Conversion Settings APIs

### POST /admin/coinconversion/settings
Set coin-to-RS (rupees) conversion rate and minimum coins required for conversion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "CoinsPerRupee": 10,
  "MinimumCoinsToConvert": 100
}
```

**Note:**
- `CoinsPerRupee`: How many coins equal 1 rupee (must be > 0)
- `MinimumCoinsToConvert`: Minimum coins required to convert (must be >= 0)
- Example: If CoinsPerRupee = 10, then 100 coins = 10 rupees

**Response (Success - 200):**
```json
{
  "message": "Coin conversion settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "CoinsPerRupee": 10,
    "MinimumCoinsToConvert": 100,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Fields
```json
{
  "message": "CoinsPerRupee and MinimumCoinsToConvert are required"
}
```

#### 400 Bad Request - Invalid CoinsPerRupee
```json
{
  "message": "CoinsPerRupee must be greater than 0"
}
```

---

### GET /admin/coinconversion/settings
Get current coin-to-RS conversion settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Coin conversion settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "CoinsPerRupee": 10,
    "MinimumCoinsToConvert": 100,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be created (CoinsPerRupee: 1, MinimumCoinsToConvert: 100)

---

## Notes for Coin Conversion System

- Coin conversion settings APIs require JWT token authentication
- Admin can set how many coins equal 1 rupee
- Admin can set minimum coins required for conversion
- Users can convert their coins to rupees (RS) which are added to their wallet balance
- Conversion is irreversible - coins are deducted and rupees are added to wallet

---

## Signup Bonus Settings APIs

### POST /admin/signupbonus/settings
Set signup bonus amount and reward type for new users.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "SignupBonusAmount": 100,
  "RewardType": "Coins"
}
```

OR for Wallet Balance:
```json
{
  "SignupBonusAmount": 50,
  "RewardType": "WalletBalance"
}
```

**Response (Success - 200):**
```json
{
  "message": "Signup bonus settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SignupBonusAmount": 100,
    "RewardType": "Coins"
  }
}
```

**Response (Error - 400):**
```json
{
  "message": "SignupBonusAmount is required"
}
```

```json
{
  "message": "SignupBonusAmount must be a number greater than or equal to 0"
}
```

```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
}
```

**Validation Rules:**
- `SignupBonusAmount` is required and must be a number >= 0
- `RewardType` is optional (defaults to 'Coins') and must be either 'Coins' or 'WalletBalance'
- Setting `SignupBonusAmount` to 0 disables signup bonus
- All new users who signup will receive the configured signup bonus automatically

---

### GET /admin/signupbonus/settings
Get current signup bonus settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Signup bonus settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SignupBonusAmount": 100,
    "RewardType": "Coins"
  }
}
```

**Notes:**
- Signup bonus settings APIs require JWT token authentication
- Admin can set the signup bonus amount and whether it's given as Coins or WalletBalance
- All new users automatically receive the signup bonus when they signup
- Signup bonus is given to ALL new users (not just those with referral codes)
- If signup bonus is set to 0, no bonus is given
- Signup bonus is separate from referral rewards - users can receive both

---

## Scratch Card Settings APIs

### POST /admin/scratchcard/settings
Set scratch card reward amounts for each day of the week.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Sunday": 50,
  "Monday": 20,
  "Tuesday": 30,
  "Wednesday": 40,
  "Thursday": 25,
  "Friday": 35,
  "Saturday": 100,
  "RewardType": "Coins"
}
```

**Note:**
- All days (Sunday through Saturday) are required
- Each day's amount must be 0 or greater
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday

**Response (Success - 200):**
```json
{
  "message": "Scratch card settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "Sunday": 50,
    "Monday": 20,
    "Tuesday": 30,
    "Wednesday": 40,
    "Thursday": 25,
    "Friday": 35,
    "Saturday": 100,
    "RewardType": "Coins",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Fields
```json
{
  "message": "All days (Sunday through Saturday) are required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "All scratch card amounts must be 0 or greater"
}
```

---

### GET /admin/scratchcard/settings
Get current scratch card settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Scratch card settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "Sunday": 50,
    "Monday": 20,
    "Tuesday": 30,
    "Wednesday": 40,
    "Thursday": 25,
    "Friday": 35,
    "Saturday": 100,
    "RewardType": "Coins",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be returned (all days: 0, RewardType: "Coins")

---

## Notes for Scratch Card System

- Scratch card settings APIs require JWT token authentication
- Admin can set different reward amounts for each day of the week
- Rewards can be in Coins or WalletBalance
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday
- Each user can only claim one scratch card per day

---

## Scratch Card Daily Limit Settings APIs

### POST /admin/scratchcard/dailylimit/settings
Set scratch card daily limit settings. This is a separate feature from the regular scratch card settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "DailyLimit": 3,
  "RewardAmount": 10.50,
  "RewardCoins": 50,
  "IsActive": true
}
```

**Note:**
- `DailyLimit`: Number of times a user can claim per day (required, minimum: 1)
- `RewardAmount`: Wallet balance reward amount (optional, default: 0, minimum: 0)
- `RewardCoins`: Coins reward amount (optional, default: 0, minimum: 0)
- `IsActive`: Enable/disable the feature (optional, default: true)
- At least one reward (`RewardAmount` or `RewardCoins`) must be greater than 0
- Both rewards can be set simultaneously - both will be added to user's account
- All fields are optional when updating existing settings (only provided fields will be updated)

**Response (Success - 200):**
```json
{
  "message": "Scratch card daily limit settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "DailyLimit": 3,
    "RewardAmount": 10.50,
    "RewardCoins": 50,
    "IsActive": true,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Invalid DailyLimit
```json
{
  "message": "DailyLimit must be a number greater than or equal to 1"
}
```

#### 400 Bad Request - Invalid RewardAmount
```json
{
  "message": "RewardAmount must be a number greater than or equal to 0"
}
```

#### 400 Bad Request - Invalid RewardCoins
```json
{
  "message": "RewardCoins must be a number greater than or equal to 0"
}
```

#### 400 Bad Request - No Rewards Set
```json
{
  "message": "At least one reward (RewardAmount or RewardCoins) must be greater than 0"
}
```

#### 400 Bad Request - Invalid IsActive
```json
{
  "message": "IsActive must be a boolean value"
}
```

---

### GET /admin/scratchcard/dailylimit/settings
Get current scratch card daily limit settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Scratch card daily limit settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "DailyLimit": 3,
    "RewardAmount": 10.50,
    "RewardCoins": 50,
    "IsActive": true,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be returned:
```json
{
  "DailyLimit": 1,
  "RewardAmount": 0,
  "RewardCoins": 0,
  "IsActive": true
}
```

---

## Notes for Scratch Card Daily Limit System

- Scratch card daily limit is a **separate feature** from the regular scratch card settings
- Admin can set how many times per day a user can claim
- Supports both wallet balance (`RewardAmount`) and coins (`RewardCoins`) rewards
- Both rewards can be set simultaneously - both will be added when user claims
- Daily limit resets at midnight (00:00:00) each day
- Feature can be enabled/disabled via `IsActive` flag
- Does not affect existing scratch card settings

---

## Withdrawal Settings APIs

### POST /admin/withdrawal/threshold
Set the minimum withdrawal amount threshold.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "MinimumWithdrawalAmount": 500,
  "DailyWithdrawalRequestLimit": 1,
  "WithdrawalDenominations": [10, 20, 30, 50]
}
```

**Note:**
- `MinimumWithdrawalAmount` (required): The minimum amount users must have in their wallet to make a withdrawal request (must be >= 1)
- `DailyWithdrawalRequestLimit` (optional): Integer between 1 and 8. Limits total daily withdrawal actions per user (UPI + Bank + Gift Voucher).
- `WithdrawalDenominations` (optional): Array of positive numbers. These are the fixed amounts users can choose when making a withdrawal request. Default: `[10, 20, 30, 50]`
- This threshold is enforced when users submit withdrawal requests
- Users can only withdraw one of the allowed denominations

**Response (Success - 200):**
```json
{
  "message": "Withdrawal threshold updated successfully",
  "data": {
    "MinimumWithdrawalAmount": 500,
    "DailyWithdrawalRequestLimit": 1,
    "WithdrawalDenominations": [10, 20, 30, 50],
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Field
```json
{
  "message": "MinimumWithdrawalAmount is required"
}
```

#### 400 Bad Request - Invalid Value
```json
{
  "message": "MinimumWithdrawalAmount must be a valid number"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "MinimumWithdrawalAmount must be at least 1"
}
```

---

### GET /admin/withdrawal/threshold
Get the current minimum withdrawal amount threshold.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal threshold retrieved successfully",
  "data": {
    "MinimumWithdrawalAmount": 500,
    "DailyWithdrawalRequestLimit": 1,
    "WithdrawalDenominations": [10, 20, 30, 50],
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be created (MinimumWithdrawalAmount: 100, DailyWithdrawalRequestLimit: 1, WithdrawalDenominations: [10, 20, 30, 50])

---

## Notes for Withdrawal Settings System

- Withdrawal settings APIs require JWT token authentication
- Admin can set the minimum withdrawal amount that users must meet
- This threshold is enforced when users submit withdrawal requests
- Users will receive an error if they try to withdraw less than the minimum amount
- Default minimum withdrawal amount is 100 if not set by admin

---

## Commission Slab Settings APIs

Commission slabs allow admins to set percentage-based commission rates based on user earnings. This enables tiered commission structures where users earning more get different commission percentages.

### POST /admin/commission/slabs
Create a new commission slab.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "SlabName": "Bronze Tier",
  "MinEarnings": 0,
  "MaxEarnings": 1000,
  "CommissionPercentage": 5,
  "RewardType": "Coins",
  "IsActive": true,
  "Order": 1,
  "CommissionBasedOn": "ReferredUserWalletBalance"
}
```

**Response (Success - 200):**
```json
{
  "message": "Commission slab created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SlabName": "Bronze Tier",
    "MinEarnings": 0,
    "MaxEarnings": 1000,
    "CommissionPercentage": 5,
    "RewardType": "Coins",
    "IsActive": true,
    "Order": 1,
    "CommissionBasedOn": "ReferredUserWalletBalance",
    "createdAt": "2024-01-18T20:00:00.000Z",npm staert
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Request Body Fields:**`
- `SlabName`: Name of the commission slab (e.g., "Bronze Tier", "Silver Tier") - **Required**
- `MinEarnings`: Minimum earnings amount for this slab (must be >= 0) - **Required**
- `MaxEarnings`: Maximum earnings amount (null means no upper limit) - **Optional**
- `CommissionPercentage`: Commission percentage (0-100) - **Required**
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins") - **Optional**
- `IsActive`: Whether the slab is active (default: true) - **Optional**
- `Order`: Lower order = checked first when determining which slab applies (default: 0) - **Optional**
- `CommissionBasedOn`: What the commission is calculated from - **Optional**
  - `ReferredUserWalletBalance`: Commission based on total wallet balance of the referred user (default)
  - `WithdrawalRequestAmount`: Commission based on withdrawal request amount
  - `WithdrawalRequestTime`: Commission based on withdrawal request time/date

**Note:**
- Slabs cannot overlap - each earnings range must be unique
- `CommissionBasedOn` determines what value is used to calculate the commission:
  - **ReferredUserWalletBalance**: Uses the total wallet balance of the user who was referred
  - **WithdrawalRequestAmount**: Uses the withdrawal request amount when calculating commission
  - **WithdrawalRequestTime**: Uses the withdrawal request time/date for commission calculation

**Error Responses:**

#### 400 Bad Request - Overlapping Slabs
```json
{
  "message": "Slab overlaps with existing slab \"Bronze Tier\" (0 - 1000)"
}
```

#### 400 Bad Request - Invalid Commission Basis
```json
{
  "message": "CommissionBasedOn must be one of: ReferredUserWalletBalance, WithdrawalRequestAmount, WithdrawalRequestTime"
}
```

---

### GET /admin/commission/slabs
Get all commission slabs.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Commission slabs retrieved successfully",
  "data": {
    "slabs": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
        "SlabName": "Bronze Tier",
        "MinEarnings": 0,
        "MaxEarnings": 1000,
        "CommissionPercentage": 5,
        "RewardType": "Coins",
        "IsActive": true,
        "Order": 1,
        "CommissionBasedOn": "ReferredUserWalletBalance"
      },
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b2",
        "SlabName": "Silver Tier",
        "MinEarnings": 1001,
        "MaxEarnings": 5000,
        "CommissionPercentage": 10,
        "RewardType": "Coins",
        "IsActive": true,
        "Order": 2,
        "CommissionBasedOn": "WithdrawalRequestAmount"
      },
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3",
        "SlabName": "Gold Tier",
        "MinEarnings": 5001,
        "MaxEarnings": null,
        "CommissionPercentage": 15,
        "RewardType": "WalletBalance",
        "IsActive": true,
        "Order": 3,
        "CommissionBasedOn": "WithdrawalRequestTime"
      }
    ],
    "totalSlabs": 3,
    "activeSlabs": 3
  }
}
```

---

### PUT /admin/commission/slabs/:slabId
Update a commission slab.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "SlabName": "Updated Bronze Tier",
  "MinEarnings": 0,
  "MaxEarnings": 1500,
  "CommissionPercentage": 7,
  "RewardType": "WalletBalance",
  "IsActive": false,
  "Order": 1,
  "CommissionBasedOn": "WithdrawalRequestAmount"
}
```

**Response (Success - 200):**
```json
{
  "message": "Commission slab updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SlabName": "Updated Bronze Tier",
    "MinEarnings": 0,
    "MaxEarnings": 1500,
    "CommissionPercentage": 7,
    "RewardType": "WalletBalance",
    "IsActive": false,
    "Order": 1,
    "CommissionBasedOn": "WithdrawalRequestAmount",
    "updatedAt": "2024-01-18T21:00:00.000Z"
  }
}
```

---

### DELETE /admin/commission/slabs/:slabId
Delete a commission slab.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Commission slab deleted successfully"
}
```

---

### GET /admin/users/earnings
Get all users with detailed earnings breakdown. Shows which user earned how much from different sources.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of users per page (default: 50)
- `search`: Search by UserName, MobileNumber, or ReferCode
- `sortBy`: Sort by `totalEarnings` (default), `coins`, `walletBalance`, or `referralCount`

**Example Request:**
```
GET /admin/users/earnings?page=1&limit=20&sortBy=totalEarnings&search=john
```

**Response (Success - 200):**
```json
{
  "message": "Users with earnings retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userName": "john_doe",
        "mobileNumber": "9876543210",
        "referCode": "PRK08F9",
        "coins": 500,
        "walletBalance": 250.50,
        "totalEarnings": 750.50,
        "earningsBreakdown": {
          "coins": 500,
          "walletBalance": 250.50,
          "appInstallations": 200,
          "scratchCards": 150,
          "captcha": 50,
          "dailyBonus": 100,
          "referralEarnings": 50
        },
        "referralCount": 5,
        "referredBy": "ABC12X",
        "signupTime": "2024-01-18T20:00:00.000Z",
        "lastLoginTime": "2024-01-18T22:00:00.000Z",
        "isBlocked": false,
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalCoins": 50000,
      "totalWalletBalance": 25000.50,
      "totalEarnings": 75000.50,
      "totalReferrals": 500
    }
  }
}
```

**Response Fields:**
- `users`: Array of users with earnings data
  - `userId`: User's unique ID
  - `userName`: User's username
  - `mobileNumber`: User's mobile number
  - `referCode`: User's referral code
  - `coins`: Current coin balance
  - `walletBalance`: Current wallet balance
  - `totalEarnings`: Total earnings (coins + wallet balance)
  - `earningsBreakdown`: Detailed breakdown of earnings:
    - `coins`: Current coins
    - `walletBalance`: Current wallet balance
    - `appInstallations`: Total earnings from approved app installations
    - `scratchCards`: Total earnings from scratch cards
    - `captcha`: Total earnings from captcha solves
    - `dailyBonus`: Total earnings from daily bonuses
    - `referralEarnings`: Total earnings from referrals (if user referred others)
  - `referralCount`: Number of users referred by this user
  - `referredBy`: Referral code used by this user (if any)
  - `signupTime`: When user signed up
  - `lastLoginTime`: Last login timestamp
  - `isBlocked`: Whether user is blocked
- `pagination`: Standard pagination info
- `statistics`: Aggregate statistics for all users in the result set

**Note:**
- Earnings breakdown shows how much each user earned from different sources
- `referralEarnings` shows how much the user earned by referring others
- Users are sorted by `totalEarnings` by default (highest first)
- Can search by username, mobile number, or referral code
- Can sort by total earnings, coins, wallet balance, or referral count

---

## Notes for Commission Slab System

- Commission slab APIs require JWT token authentication
- **Commission Basis Options:**
  - `ReferredUserWalletBalance`: Commission is calculated based on the total wallet balance of the user who was referred. When a user refers someone, the commission is calculated from the referred user's current wallet balance.
  - `WithdrawalRequestAmount`: Commission is calculated based on the withdrawal request amount. When a referred user makes a withdrawal request, the commission is calculated from that withdrawal amount.
  - `WithdrawalRequestTime`: Commission is calculated based on the withdrawal request time/date. This can be used for time-based commission structures.
- Slabs cannot overlap - each earnings range must be unique
- Commission percentage is applied to the value determined by `CommissionBasedOn`
- Lower `Order` value means the slab is checked first when determining which slab applies to a user
- Admin can create multiple slabs with different commission percentages for different earnings ranges
- Commission slabs enable tiered commission structures for referral rewards

---

## Sponsor Promotion Submission Management APIs

Admins can view and manage all sponsor promotion submissions submitted by users. Users submit sponsor details (name, mobile number, email) and app promotion information for review.

### GET /admin/sponsor/promotions
Get all sponsor promotion submissions with filtering and pagination.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")
- `userId`: Filter by specific user ID
- `page`: Page number (default: 1)
- `limit`: Number of submissions per page (default: 50)
- `search`: Search by sponsor name, mobile number, email, or app promotion name

**Example Request:**
```
GET /admin/sponsor/promotions?status=Pending&page=1&limit=20&search=john
```

**Response (Success - 200):**
```json
{
  "message": "Sponsor promotion submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b0",
        "userName": "john_doe",
        "userMobileNumber": "9876543210",
        "userReferCode": "PRK08F9",
        "sponsorName": "John Doe",
        "mobileNumber": "9876543210",
        "email": "sponsor@example.com",
        "appPromotion": "My Awesome App",
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      },
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b2",
        "userId": "60f7b3b3b3b3b3b3b3b3b1",
        "userName": "jane_smith",
        "userMobileNumber": "9876543211",
        "userReferCode": "PRK12A5",
        "sponsorName": "Jane Smith",
        "mobileNumber": "9876543211",
        "email": "jane@example.com",
        "appPromotion": "Another App",
        "status": "Approved",
        "adminNotes": "Approved for promotion",
        "createdAt": "2024-01-17T15:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalSubmissions": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "total": 100,
      "pending": 25,
      "approved": 60,
      "rejected": 15
    }
  }
}
```

**Response Fields:**
- `submissions`: Array of sponsor promotion submissions
  - `submissionId`: Unique submission ID
  - `userId`: ID of user who submitted
  - `userName`: Username of submitter
  - `userMobileNumber`: Mobile number of submitter
  - `userReferCode`: Referral code of submitter
  - `sponsorName`: Name of the sponsor
  - `mobileNumber`: Sponsor's mobile number
  - `email`: Sponsor's email address
  - `appPromotion`: Name of app to promote
  - `status`: Submission status (Pending, Approved, Rejected)
  - `adminNotes`: Admin notes (if any)
  - `createdAt`: When submission was created
  - `updatedAt`: When submission was last updated
- `pagination`: Standard pagination info
- `statistics`: Overall statistics for all submissions

**Note:**
- Can filter by status, user ID, or search by sponsor details
- Submissions are sorted by creation date (newest first)
- Includes user information for each submission
- Statistics show total counts for each status

---

### POST /admin/sponsor/promotions/:submissionId/status
Approve or reject a sponsor promotion submission.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `submissionId`: The ID of the sponsor promotion submission

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Approved for promotion campaign"
}
```

OR for rejection:
```json
{
  "status": "Rejected",
  "adminNotes": "Sponsor details incomplete"
}
```

**Response (Success - 200):**
```json
{
  "message": "Sponsor promotion submission approved successfully",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "sponsorName": "John Doe",
    "mobileNumber": "9876543210",
    "email": "sponsor@example.com",
    "appPromotion": "My Awesome App",
    "status": "Approved",
    "adminNotes": "Approved for promotion campaign",
    "userName": "john_doe",
    "userMobileNumber": "9876543210",
    "updatedAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Invalid Status
```json
{
  "message": "Status is required and must be either 'Approved' or 'Rejected'"
}
```

#### 400 Bad Request - Already Processed
```json
{
  "message": "This submission has already been approved"
}
```

#### 404 Not Found - Submission Not Found
```json
{
  "message": "Sponsor promotion submission not found"
}
```

**Note:**
- Only "Pending" submissions can be approved or rejected
- Admin can add notes when approving/rejecting
- Once processed, status cannot be changed
- Response includes both sponsor and user information

---

## Notes for Sponsor Promotion Management System

- Sponsor promotion management APIs require JWT token authentication
- Admin can view all sponsor promotion submissions with filtering and search
- Admin can approve or reject submissions
- Submissions include sponsor name, mobile number, email, and app promotion name
- Admin can add notes when approving/rejecting submissions
- Submissions are linked to the user who submitted them
- Search functionality allows finding submissions by sponsor details or app name
- Pagination supports large numbers of submissions
- Statistics provide overview of submission statuses

---

## Cron Jobs Management APIs

The system includes automated cron jobs that run daily to verify and maintain daily limit resets. These jobs ensure that all daily limits (scratch cards, spins, captcha) are properly reset at midnight.

### GET /admin/cron/status
Get the status of all cron jobs.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Cron jobs status retrieved successfully",
  "data": {
    "dailyResetJob": {
      "scheduled": true,
      "schedule": "0 0 * * * (Daily at 00:00)",
      "description": "Verifies daily limit resets for scratch cards, spins, and captcha"
    },
    "cleanupOldRecordsJob": {
      "scheduled": true,
      "schedule": "0 1 * * * (Daily at 01:00)",
      "description": "Cleans up old records older than 90 days"
    },
    "note": "Cron jobs automatically start when the server starts and database is connected"
  }
}
```

**Note:**
- Cron jobs automatically start when the server starts and database connection is established
- Daily reset job runs at midnight (00:00) to verify all daily limits are reset
- Cleanup job runs at 1 AM (01:00) to remove old records older than 90 days
- Jobs run in the configured timezone (default: Asia/Kolkata)

---

### POST /admin/cron/daily-reset
Manually check daily reset status and get statistics.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Daily reset status retrieved successfully",
  "data": {
    "resetTime": "2024-01-19T00:00:00.000Z",
    "today": "2024-01-19T00:00:00.000Z",
    "yesterday": "2024-01-18T00:00:00.000Z",
    "statistics": {
      "scratchCard": {
        "today": 150,
        "yesterday": 200
      },
      "dailySpin": {
        "today": 50,
        "yesterday": 75
      },
      "captcha": {
        "today": 300,
        "yesterday": 350
      }
    },
    "note": "Daily limits automatically reset at midnight. This shows current status."
  }
}
```

**Note:**
- This endpoint shows the current status of daily limits
- Shows counts for today vs yesterday for each limit type
- Daily limits automatically reset at midnight based on date queries
- This is a read-only check, actual reset happens automatically via date-based queries

---

## Notes for Cron Jobs System

- **Automatic Daily Reset**: Daily limits automatically reset at midnight through date-based queries
- **Cron Job Verification**: Cron jobs verify that resets are working correctly
- **Cleanup Old Records**: Old records (older than 90 days) are automatically cleaned up
- **Timezone Configuration**: Cron jobs run in configured timezone (default: Asia/Kolkata)
- **Auto-Start**: Cron jobs automatically start when server starts and database connects
- **Daily Limits Reset**: The following limits reset daily:
  - Scratch Card Daily Limit Claims
  - Daily Spin Usage
  - Captcha Daily Solves
- **No Manual Reset Needed**: The system uses date-based queries, so limits automatically reset at midnight
- **Logging**: All cron job activities are logged to console for monitoring

---

## Support Link Management APIs

Admins can manage support contact information including support link, email, phone, and WhatsApp. Users can access this information through the user API.

### POST /admin/support/link
Set or create support link settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "SupportLink": "https://support.example.com",
  "SupportEmail": "support@example.com",
  "SupportPhone": "+1234567890",
  "SupportWhatsApp": "+1234567890",
  "IsActive": true,
  "Description": "Contact us for any assistance"
}
```

**Response (Success - 200):**
```json
{
  "message": "Support link settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SupportLink": "https://support.example.com",
    "SupportEmail": "support@example.com",
    "SupportPhone": "+1234567890",
    "SupportWhatsApp": "+1234567890",
    "IsActive": true,
    "Description": "Contact us for any assistance",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Request Body Fields:**
- `SupportLink`: Support website URL (required, must be valid URL)
- `SupportEmail`: Support email address (optional, must be valid email if provided)
- `SupportPhone`: Support phone number (optional)
- `SupportWhatsApp`: Support WhatsApp number (optional)
- `IsActive`: Whether support is active (optional, default: true)
- `Description`: Description or instructions (optional)

**Error Responses:**

#### 400 Bad Request - Missing SupportLink
```json
{
  "message": "SupportLink is required"
}
```

#### 400 Bad Request - Invalid URL
```json
{
  "message": "SupportLink must be a valid URL"
}
```

#### 400 Bad Request - Invalid Email
```json
{
  "message": "SupportEmail must be a valid email address"
}
```

---

### GET /admin/support/link
Get current support link settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Support link settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SupportLink": "https://support.example.com",
    "SupportEmail": "support@example.com",
    "SupportPhone": "+1234567890",
    "SupportWhatsApp": "+1234567890",
    "IsActive": true,
    "Description": "Contact us for any assistance",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:**
- Returns default settings if none exist
- Default support link is created if settings don't exist

---

### PUT /admin/support/link
Update support link settings. All fields are optional - only provided fields will be updated.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "SupportLink": "https://new-support.example.com",
  "SupportEmail": "new-support@example.com",
  "SupportPhone": "+9876543210",
  "SupportWhatsApp": "+9876543210",
  "IsActive": false,
  "Description": "Updated support information"
}
```

**Response (Success - 200):**
```json
{
  "message": "Support link settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "SupportLink": "https://new-support.example.com",
    "SupportEmail": "new-support@example.com",
    "SupportPhone": "+9876543210",
    "SupportWhatsApp": "+9876543210",
    "IsActive": false,
    "Description": "Updated support information",
    "updatedAt": "2024-01-18T21:00:00.000Z"
  }
}
```

**Note:**
- Only provided fields will be updated
- If settings don't exist and SupportLink is provided, new settings will be created
- If settings don't exist and SupportLink is not provided, returns error
- Setting a field to empty string or null will clear that field

---

## Social Links Management APIs

Admins can set **Telegram**, **YouTube**, and **Instagram** URLs. Users read them via **`GET /users/social-links/public`** (no token).

### GET /admin/social-links

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success — 200):**
```json
{
  "message": "Social links settings retrieved successfully",
  "data": {
    "_id": "...",
    "TelegramLink": "https://t.me/example",
    "YouTubeLink": "https://www.youtube.com/@example",
    "InstagramLink": "https://www.instagram.com/example",
    "IsActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### PUT /admin/social-links

All body fields are optional. Omit a field to leave it unchanged. Send `null` or `""` to clear that link.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request body example:**
```json
{
  "TelegramLink": "https://t.me/my-channel",
  "YouTubeLink": "https://www.youtube.com/@my-channel",
  "InstagramLink": "https://www.instagram.com/my-page",
  "IsActive": true
}
```

- Each link must be a valid **`http`** or **`https`** URL when set.
- **`IsActive`**: When `false`, the public API returns all links as `null` with a short note.

---

## Notes for Support Link Management System

- Support link management APIs require JWT token authentication
- Admin can set support link, email, phone, and WhatsApp
- Support can be activated/deactivated using IsActive field
- URL validation ensures SupportLink is a valid URL
- Email validation ensures SupportEmail is a valid email format
- Users can access support information through user API
- If IsActive is false, users will see that support is unavailable
- Only one support link settings document exists in the system

---

## Admin Dashboard API

### GET /admin/dashboard
Get comprehensive dashboard statistics including total users, wallet balances, registration charts, and withdrawal statistics.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `days` (optional): Number of days for registration chart (default: 30, max recommended: 365)

**Example:**
```
GET /admin/dashboard?days=30
```

**Response (Success - 200):**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "users": {
      "totalUsers": 1250,
      "todayRegistrations": 15,
      "recentRegistrations": 85
    },
    "wallet": {
      "totalWalletBalance": 125000.50,
      "totalCoins": 500000
    },
    "withdrawals": {
      "totalWithdrawals": 50000.00,
      "statistics": {
        "pending": {
          "count": 25,
          "totalAmount": 12500.00
        },
        "approved": {
          "count": 150,
          "totalAmount": 50000.00
        },
        "rejected": {
          "count": 10,
          "totalAmount": 3000.00
        }
      }
    },
    "registrationChart": {
      "days": 30,
      "data": [
        {
          "date": "2024-01-01",
          "registrations": 5
        },
        {
          "date": "2024-01-02",
          "registrations": 8
        },
        {
          "date": "2024-01-03",
          "registrations": 12
        }
      ]
    }
  }
}
```

**Response Fields:**

**Users Section:**
- `totalUsers`: Total number of registered users
- `todayRegistrations`: Number of users registered today
- `recentRegistrations`: Number of users registered in the last 7 days

**Wallet Section:**
- `totalWalletBalance`: Sum of all users' wallet balances
- `totalCoins`: Sum of all users' coins

**Withdrawals Section:**
- `totalWithdrawals`: Total amount of all approved withdrawals
- `statistics.pending`: Count and total amount of pending withdrawals
- `statistics.approved`: Count and total amount of approved withdrawals
- `statistics.rejected`: Count and total amount of rejected withdrawals

**Registration Chart Section:**
- `days`: Number of days included in the chart
- `data`: Array of daily registration counts
  - `date`: Date in YYYY-MM-DD format
  - `registrations`: Number of users registered on that date

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- Dashboard API requires JWT token authentication
- Registration chart data includes all days in the specified range, with 0 for days with no registrations
- Total withdrawals amount only includes approved withdrawals
- All amounts are in the same currency as wallet balance
- The chart data is sorted chronologically from oldest to newest

---

## App Installation Reward Management APIs

### POST /admin/apps
Create a new app with reward coins.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "AppName": "Example App",
  "AppImage": "https://example.com/app-image.png",
  "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
  "RewardCoins": 50,
  "Difficulty": "Easy",
  "Status": "Active",
  "Description": "Install this app and earn coins!"
}
```

**Note:**
- `AppName`, `AppImage`, `AppDownloadUrl`, and `RewardCoins` are required
- `RewardCoins` must be 0 or greater
- `Difficulty` must be one of: "Easiest", "Easy", "Medium", "Hard" (default: "Medium")
- `Status` must be either "Active" or "Inactive" (default: "Active")
- `Description` is optional

**Response (Success - 200):**
```json
{
  "message": "App created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "AppName": "Example App",
    "AppImage": "https://example.com/app-image.png",
    "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
    "RewardCoins": 50,
    "Difficulty": "Easy",
    "Status": "Active",
    "Description": "Install this app and earn coins!",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

---

### GET /admin/apps
Get all apps with optional filters.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Active", "Inactive")
- `difficulty`: Filter by difficulty ("Easiest", "Easy", "Medium", "Hard")
- `sortBy`: Sort by "reward" (highest paying first) or default (newest first)

**Example Request:**
```
GET /admin/apps?status=Active&difficulty=Easy&sortBy=reward
```

**Response (Success - 200):**
```json
{
  "message": "Apps retrieved successfully",
  "data": {
    "apps": [
      {
        "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
        "rewardCoins": 50,
        "difficulty": "Easy",
        "status": "Active",
        "description": "Install this app and earn coins!",
        "statistics": {
          "totalSubmissions": 25,
          "approvedSubmissions": 20,
          "pendingSubmissions": 5
        },
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      }
    ],
    "totalApps": 1
  }
}
```

---

### GET /admin/apps/:appId
Get detailed information about a specific app.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "App retrieved successfully",
  "data": {
    "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "appName": "Example App",
    "appImage": "https://example.com/app-image.png",
    "appDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
    "rewardCoins": 50,
    "difficulty": "Easy",
    "status": "Active",
    "description": "Install this app and earn coins!",
    "statistics": {
      "totalSubmissions": 25,
      "approvedSubmissions": 20,
      "pendingSubmissions": 5,
      "rejectedSubmissions": 0
    },
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

---

### PUT /admin/apps/:appId
Update an existing app.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (All fields optional):**
```json
{
  "AppName": "Updated App Name",
  "AppImage": "https://example.com/new-image.png",
  "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.new",
  "RewardCoins": 75,
  "Difficulty": "Medium",
  "Status": "Active",
  "Description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "message": "App updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "AppName": "Updated App Name",
    "AppImage": "https://example.com/new-image.png",
    "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.new",
    "RewardCoins": 75,
    "Difficulty": "Medium",
    "Status": "Active",
    "Description": "Updated description",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T21:00:00.000Z"
  }
}
```

---

### DELETE /admin/apps/:appId
Delete an app (only if no submissions exist).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "App deleted successfully"
}
```

**Response (Error - 400):**
```json
{
  "message": "Cannot delete app. There are 25 submission(s) associated with this app."
}
```

---

### GET /admin/apps/submissions
Get all app installation submissions with optional filters.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")
- `appId`: Filter by app ID
- `userId`: Filter by user ID
- `sortBy`: Sort by "oldest" or default (newest first)

**Example Request:**
```
GET /admin/apps/submissions?status=Pending&sortBy=oldest
```

**Response (Success - 200):**
```json
{
  "message": "App installation submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userMobileNumber": "1234567890",
        "userDeviceId": "device123",
        "userReferCode": "PRK08F9",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b2",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      }
    ],
    "totalSubmissions": 1,
    "pendingCount": 1,
    "approvedCount": 0,
    "rejectedCount": 0
  }
}
```

---

### POST /admin/apps/submissions/:submissionId/status
Approve or reject an app installation submission.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Screenshot verified successfully"
}
```

OR for rejection:
```json
{
  "status": "Rejected",
  "adminNotes": "Screenshot does not show app installation"
}
```

**Response (Success - 200):**
```json
{
  "message": "Submission approved successfully",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "appName": "Example App",
    "rewardCoins": 50,
    "status": "Approved",
    "adminNotes": "Screenshot verified successfully",
    "userCoins": 150,
    "updatedAt": "2024-01-18T22:30:00.000Z"
  }
}
```

**Important Notes:**
- When a submission is **approved**: Reward coins are automatically added to the user's wallet
- When a submission is **rejected**: No coins are added, user can resubmit
- Admin can add notes when approving/rejecting
- Once a submission is processed (approved/rejected), it cannot be changed
- Users can only have one approved submission per app

---

## Notes for App Installation System

- App management APIs require JWT token authentication
- Admin can create, update, and delete apps with reward coins
- Apps can be filtered by difficulty (Easiest, Easy, Medium, Hard) and status (Active, Inactive)
- Apps can be sorted by highest paying (reward coins) or difficulty
- Users submit screenshots after installing apps
- Admin reviews and approves/rejects submissions
- When approved, reward coins are automatically added to user's wallet
- Users can only have one approved submission per app
- Users can resubmit if their submission was rejected

---

## Newly Added Admin APIs

### GET /admin/dashboard (Updated Summary Fields)
Dashboard response now includes additional requested summary fields:

- `data.requestedSummary.users.today`
- `data.requestedSummary.users.yesterday`
- `data.requestedSummary.users.sevenDays`
- `data.requestedSummary.users.thisMonth`
- `data.requestedSummary.users.lastMonth`
- `data.requestedSummary.users.total`
- `data.requestedSummary.withdrawals.today`
- `data.requestedSummary.withdrawals.yesterday`
- `data.requestedSummary.withdrawals.thisMonth`

---

### GET /admin/users/:userId/activity
Get complete user earning/activity timeline (app installs, captcha, scratch card, daily limit, conversion, withdrawal, sponsor submissions).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `page` (default: 1)
- `limit` (default: 50)
- `type` (example: `APP_INSTALL`, `CAPTCHA`, `WITHDRAWAL`)

**Response (Success - 200):**
```json
{
  "message": "User activity retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "UserName": "demo",
      "MobileNumber": "9999999999",
      "ReferCode": "ABC12X",
      "Coins": 1200,
      "WalletBalance": 50
    },
    "events": [],
    "summary": {
      "totalEvents": 0,
      "totalCoinsDelta": 0,
      "totalWalletDelta": 0
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalEvents": 0,
      "limit": 50
    }
  }
}
```

---

### GET /admin/task-controls
Get centralized task controls for:
- `Captcha`
- `DailySpin`
- `ScratchCardDailyLimit`
- `AppInstall`
- `Quiz` (enable/disable quiz, optional daily quiz limit `DailyLimit`, `CoinsPerTask`, `AdsEnabled`)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### POST /admin/task-controls/:taskType
Update task controls (ads, limit, coin, active state).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Param:**
- `taskType`: `Captcha` | `DailySpin` | `ScratchCardDailyLimit` | `AppInstall` | `Quiz`

**Quiz example** — disable quiz feature and remove daily cap:
```json
{ "IsActive": false, "DailyLimit": null }
```

**Quiz example** — enable with 20 attempts per user per day:
```json
{ "IsActive": true, "DailyLimit": 20 }
```

**Request Body (any fields optional):**
```json
{
  "IsActive": true,
  "AdsEnabled": true,
  "DailyLimit": 10,
  "CoinsPerTask": 5
}
```

---

### POST /admin/apps/submissions/bulk-status
Bulk approve/reject app-install submissions (select करके ek sath action).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "submissionIds": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "status": "Approved",
  "adminNotes": "Verified in bulk"
}
```

---

### POST /admin/withdrawal/requests/bulk-status
Bulk approve/reject withdrawal requests.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "requestIds": [
    "507f1f77bcf86cd799439031",
    "507f1f77bcf86cd799439032"
  ],
  "status": "Rejected",
  "adminNotes": "Invalid payout details"
}
```

---

### DELETE /admin/apps/submissions/:submissionId
Delete app-install submission (including option to delete approved ones).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `allowApprovedDelete=true` (required if submission is Approved)
- `revertReward=true` (if Approved submission reward should be reversed)

**Example:**
```
DELETE /admin/apps/submissions/507f1f77bcf86cd799439021?allowApprovedDelete=true&revertReward=true
```

---

### GET /admin/ads/settings
Get full ads management configuration for all tasks.

Managed task types:
- `Quiz`
- `Captcha`
- `DailySpin`
- `ScratchCard`
- `ScratchCardDailyLimit`
- `AppInstall`

Config includes:
- Global on/off
- Banner ads on/off
- Rewarded ads on/off
- Interstitial ads on/off
- Per-task ad toggles
- Per-task frequency (e.g. show interstitial every N quiz/spin/scratch actions)

---

### POST /admin/ads/settings
Update full ads settings in a single API.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body Example:**
```json
{
  "GlobalAdsEnabled": true,
  "BannerAdsEnabled": true,
  "RewardedAdsEnabled": true,
  "InterstitialAdsEnabled": true,
  "TaskRules": [
    {
      "TaskType": "Quiz",
      "IsActive": true,
      "BannerEnabled": true,
      "RewardedEnabled": true,
      "InterstitialEnabled": true,
      "InterstitialAfterCount": 3,
      "RewardedAfterCount": 2
    },
    {
      "TaskType": "ScratchCard",
      "InterstitialAfterCount": 2
    },
    {
      "TaskType": "DailySpin",
      "InterstitialAfterCount": 2
    }
  ]
}
```

---

### POST /admin/ads/settings/task/:taskType
Update ad settings for one specific task.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Param:**
- `taskType`: `Quiz | Captcha | DailySpin | ScratchCard | ScratchCardDailyLimit | AppInstall`

**Request Body Example:**
```json
{
  "IsActive": true,
  "BannerEnabled": true,
  "RewardedEnabled": true,
  "InterstitialEnabled": true,
  "InterstitialAfterCount": 4,
  "RewardedAfterCount": 2
}
```

---

## Withdrawal Daily Limit Control (Admin)

### POST /admin/withdrawal/threshold (Updated)
Now supports daily withdrawal request frequency control.

**Request Body:**
```json
{
  "MinimumWithdrawalAmount": 100,
  "DailyWithdrawalRequestLimit": 1
}
```

`DailyWithdrawalRequestLimit` allowed values:
- `1` => Din me ek withdrawal request
- `2` => Din me do withdrawal request

### GET /admin/withdrawal/threshold (Updated)
Now returns both:
- `MinimumWithdrawalAmount`
- `DailyWithdrawalRequestLimit`

---

## Popup template (admin)

Single promotional popup configured in MongoDB: **`Title`**, **`Description`**, **`IsActive`**. No images, banners, action buttons, or external URLs—the public app only reads **`title`** and **`description`**.

Older clients could send **`Body`** instead of **`Description`** once; **`Description`** is what you should use.

The mobile app loads **`GET /users/popup-template/public`** (no auth).

### GET /admin/popup-template

Returns the stored template (`Description` merges legacy **`Body`** for display until an admin saves with **`Description`**).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success (200):**
```json
{
  "message": "Popup template retrieved successfully",
  "data": {
    "_id": "...",
    "Title": "New offer",
    "Description": "Short message shown in the popup.",
    "IsActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

If no document exists yet, the API still returns success with empty defaults and **`"note": "No popup template saved yet"`**.

### POST /admin/popup-template

Create or update the **single** saved template (create fills missing strings with empty values; updates only change **`Title`**, **`Description`** / **`Body`**, **`IsActive`** when those keys are present).

**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** **`application/json`** or **`multipart/form-data`** without files.

**Fields:**
- **`Title`** (string)
- **`Description`** (string)—main popup copy
- **`IsActive`** (boolean or **`"true"`** / **`"false"`**)

Optional alias: **`Body`** maps to **`Description`** if **`Description`** is omitted.

Ignored if present (legacy / unused): **`image`**, **`imageBase64`**, **`ImageUrl`**, **`ActionLabel`**, **`ActionUrl`**.

### PUT /admin/popup-template

Creates the template if missing; otherwise updates only the fields supplied (partial update).

**Example:** `{ "Description": "Updated copy", "IsActive": true }`