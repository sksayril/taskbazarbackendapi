# User API Documentation

This document describes the User APIs available in the application.

## Base URL
```
http://localhost:3100/users
```

## Public Base URL
```
http://localhost:3100
```

---

## Referral Link Redirect API (Public - No Authentication Required)

### GET /refer/:referCode
Redirect users to the ProfitKaro app using a referral code. This endpoint validates the referral code and redirects to the app (if installed) or Play Store.

**Endpoint:**
```
GET /refer/:referCode
```

**Alternative Format (Query Parameter):**
```
GET /refer?code=VYD62W
GET /refer?refer=VYD62W
```

**Example URLs:**
- `https://apiprofit.seotube.in/refer/VYD62W`
- `https://apiprofit.seotube.in/refer?code=VYD62W`
- `https://apiprofit.seotube.in/refer?refer=VYD62W`

**How It Works:**
1. Validates the referral code exists in the database
2. Returns an HTML page with JavaScript that:
   - Tries to open the Android app using Intent URL: `intent://refer?code=VYD62W#Intent;scheme=profitkaro;package=com.profitkaro;S.refer=VYD62W;end`
   - Falls back to custom scheme: `profitkaro://refer?code=VYD62W`
   - Finally redirects to Play Store: `https://play.google.com/store/apps/details?id=com.profitkaro&referrer=VYD62W`

**Success Response (200 OK):**
Returns an HTML page that automatically redirects to the app or Play Store.

**Error Responses:**

#### 400 Bad Request - Invalid Referral Code
```html
<html>
  <head><title>Invalid Referral Link</title></head>
  <body>
    <h1>Invalid Referral Link</h1>
    <p>The referral code is missing or invalid.</p>
  </body>
</html>
```

#### 404 Not Found - Referral Code Not Found
```html
<html>
  <head><title>Referral Code Not Found</title></head>
  <body>
    <h1>Referral Code Not Found</h1>
    <p>The referral code "VYD62W" does not exist.</p>
    <p><a href="https://play.google.com/store/apps/details?id=com.profitkaro">Download ProfitKaro App</a></p>
  </body>
</html>
```

**Notes:**
- This is a **public endpoint** - no authentication required
- Validates referral code exists before redirecting
- Works on Android devices (tries app first, then Play Store)
- On iOS/Desktop, redirects directly to Play Store
- The referral code is passed to the app via deep link parameters
- App package name: `com.profitkaro`
- Custom scheme: `profitkaro://`

**Example Usage:**

#### Using cURL
```bash
# Path-based format
curl -L "http://localhost:3100/refer/VYD62W"

# Query parameter format
curl -L "http://localhost:3100/refer?code=VYD62W"
```

#### Using Browser
Simply open the URL in a browser:
```
https://apiprofit.seotube.in/refer/VYD62W
```

<!-- #### Using JavaScript (for web integration) -->
```javascript
// Redirect user to referral link
const referCode = 'VYD62W';
window.location.href = `https://apiprofit.seotube.in/refer/${referCode}`;

// Or open in new window
window.open(`https://apiprofit.seotube.in/refer/${referCode}`, '_blank');
```

**App Deep Link Configuration:**

For the Android app to receive the referral code, configure these in `AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <!-- Custom scheme -->
    <data android:scheme="profitkaro" android:host="refer" />
    
    <!-- Intent URL support -->
    <data android:scheme="intent" />
</intent-filter>
```

The app should read the referral code from the intent:
- Intent URL: `S.refer` parameter
- Custom scheme: `code` query parameter

---

## 1. User Signup

Create a new user account with auto-generated refer code.

### Endpoint
```
POST /users/signup
```

### Request Body

**Required Fields:**
```json
{
  "UserName": "john_doe",
  "MobileNumber": "9876543210",
  "Password": "yourpassword123",
  "DeviceId": "device123456"
}
```

**With Optional Referral Code:**
```json
{
  "UserName": "john_doe",
  "MobileNumber": "9876543210",
  "Password": "yourpassword123",
  "DeviceId": "device123456",
  "ReferralCode": "PRK08F9"
}
```

**Note:** 
- `UserName`, `MobileNumber`, `Password`, and `DeviceId` are **required** fields.
- `UserName` must be unique and between 3-30 characters long.
- `DeviceId` must be unique - each device can only be registered to one account.
- If a `DeviceId` is already registered, signup will be rejected.
- `ReferralCode` is **optional**. If provided, it must be a valid referral code from another existing user.
- **Referral code is permanent**: Once a referral code is set during signup, it cannot be removed or changed. If no referral code is provided during signup, `ReferredBy` will be `null` and cannot be set later.
- `SignupTime` is automatically recorded when the user signs up.

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "User Created Successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "UserName": "john_doe",
    "MobileNumber": "9876543210",
    "DeviceId": "device123456",
    "ReferCode": "PRK08F9",
    "ReferredBy": "ABC12X",
    "Coins": 0,
    "WalletBalance": 0,
    "SignupTime": "2024-01-18T20:00:00.000Z",
    "__v": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIk1vYmlsZU51bWJlciI6Ijk4NzY1NDMyMTAiLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** 
- The JWT token is valid for 30 days from the time of generation.
- A unique ReferCode is automatically generated for each user (format: 3 letters + 2 digits + 1 letter, e.g., "PRK08F9", "ABC12X").
- Each user must have a unique MobileNumber and DeviceId.
- `DeviceId` is required and must be unique - one device can only be registered to one account.
- `SignupTime` is automatically recorded when the user signs up.
- If a ReferralCode is provided during signup, it will be validated and stored in the `ReferredBy` field. If no referral code is provided, `ReferredBy` will be `null`.
- **Referral code is permanent**: Once set during signup, the referral code (ReferredBy) cannot be removed or changed. This ensures referral tracking integrity.
- **Signup Bonus**: All new users automatically receive a signup bonus (configured by admin). The bonus can be in Coins or WalletBalance (RS) based on admin settings.
- **Referral Rewards**: If a valid referral code is used during signup, additional rewards are automatically calculated and distributed:
  - The new user receives `RewardForNewUser` (configured by admin) in addition to the signup bonus
  - The referrer (user whose code was used) receives `RewardForReferrer` (configured by admin)
  - Rewards are added to Coins or WalletBalance based on admin settings

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "MobileNumber and Password are required"
}
```

#### 400 Bad Request - MobileNumber Already Exists
```json
{
  "message": "User with this MobileNumber already exists"
}
```

#### 400 Bad Request - UserName Already Exists
```json
{
  "message": "UserName already exists. Please choose a different username."
}
```

#### 400 Bad Request - Invalid UserName
```json
{
  "message": "UserName must be between 3 and 30 characters long"
}
```

#### 400 Bad Request - DeviceId Already Registered
```json
{
  "message": "DeviceId already registered. This device is already associated with another account."
}
```

#### 400 Bad Request - Missing DeviceId
```json
{
  "message": "DeviceId is required"
}
```

#### 400 Bad Request - Invalid Referral Code
```json
{
  "message": "Invalid Referral Code"
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

## 2. User Login

Authenticate a user and retrieve their information.

### Endpoint
```
POST /users/login
```

### Request Body
```json
{
  "MobileNumber": "9876543210",
  "Password": "yourpassword123",
  "DeviceId": "device123456"
}
```

**Note:**
- `MobileNumber`, `Password`, and `DeviceId` are **required** fields.
- `DeviceId` must match the device ID that was used during signup.
- Users can only login from their registered device.
- `LastLoginTime` is automatically updated on successful login.

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Login Successful",
  "data": {
    "UserName": "john_doe",
    "MobileNumber": "9876543210",
    "DeviceId": "device123456",
    "ReferCode": "PRK08F9",
    "_id": "507f1f77bcf86cd799439011",
    "LastLoginTime": "2024-01-18T22:00:00.000Z",
    "isBlocked": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIk1vYmlsZU51bWJlciI6Ijk4NzY1NDMyMTAiLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** 
- The JWT token is valid for 30 days from the time of generation.
- `LastLoginTime` is automatically updated on successful login.
- Users can only login from their registered device - DeviceId must match the one used during signup.
- `isBlocked` field shows whether the user account is blocked (false = active, true = blocked).
- **Blocked users cannot login** - if a user is blocked, login will be rejected with a 403 error.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "MobileNumber and Password are required"
}
```

#### 400 Bad Request - Missing DeviceId
```json
{
  "message": "DeviceId is required"
}
```

#### 401 Unauthorized - Invalid Password
```json
{
  "message": "Invalid password"
}
```

#### 403 Forbidden - Device ID Mismatch
```json
{
  "message": "Device ID mismatch. You can only login from your registered device."
}
```

#### 403 Forbidden - Account Blocked
```json
{
  "message": "Your account has been blocked",
  "isBlocked": true,
  "blockedAt": "2024-01-18T22:30:00.000Z",
  "blockedReason": "Violation of terms of service"
}
```

**Note:** 
- Blocked users cannot login to the system.
- The response includes `blockedAt` timestamp and `blockedReason` (if provided by admin).
- Contact administrator if you believe your account was blocked in error.

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 3. Get User Profile

Retrieve the complete user profile including mobile number, device ID, wallet balance, coins, and referral code.

### Endpoint
```
GET /users/profile
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "User profile retrieved successfully",
      "data": {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userName": "john_doe",
        "mobileNumber": "9876543210",
        "deviceId": "device123",
        "referCode": "PRK08F9",
        "coins": 100,
        "walletBalance": 500.50,
        "referredBy": null,
        "signupTime": "2024-01-18T20:00:00.000Z",
        "lastLoginTime": "2024-01-18T22:00:00.000Z",
        "isBlocked": false,
        "blockedAt": null,
        "blockedReason": null,
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      }
}
```

**Note:** 
- Returns complete user profile information
- Includes username, mobile number, device ID, referral code, coins, wallet balance
- Shows if user was referred by someone (referredBy field)
- Includes signup time (when user registered) and last login time (most recent login timestamp)
- Includes account creation and update timestamps
- **Blocked Status**: Includes `isBlocked`, `blockedAt`, and `blockedReason` fields
- **Blocked users cannot access any protected APIs** - all API requests will return 403 error if user is blocked

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 4. Get Signup Bonus Info

Retrieve information about the signup bonus configuration.

### Endpoint
```
GET /users/signupbonus/info
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Signup bonus info retrieved successfully",
  "data": {
    "signupBonusAmount": 100,
    "rewardType": "Coins",
    "description": "New users receive 100 coins as signup bonus"
  }
}
```

**Note:** 
- Returns the current signup bonus configuration set by admin
- Shows the bonus amount and whether it's given as Coins or WalletBalance (RS)
- If signup bonus is disabled (amount = 0), description will indicate no bonus is configured
- This information is useful for displaying signup incentives to potential new users

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 5. Get User Wallet Balance and Coins

Retrieve the wallet balance and coins for the authenticated user.

### Endpoint
```
GET /users/wallet
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Wallet details retrieved successfully",
  "data": {
    "Coins": 100,
    "WalletBalance": 500.50,
    "MobileNumber": "9876543210"
  }
}
```

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 6. Add Coins to User Wallet

Add coins to the authenticated user's wallet.

### Endpoint
```
POST /users/addcoins
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Coins": 100
}
```

**Note:** 
- `Coins` is **required** and must be a positive number greater than 0
- The coins will be added to the user's current coin balance
- User must be authenticated with a valid JWT token

### Success Response (200 OK)
```json
{
  "message": "Coins added successfully",
  "data": {
    "coinsAdded": 100,
    "previousCoins": 50,
    "currentCoins": 150,
    "walletBalance": 500.50,
    "MobileNumber": "9876543210"
  }
}
```

**Note:** 
- `coinsAdded` shows the amount of coins that were added
- `previousCoins` shows the coin balance before adding
- `currentCoins` shows the updated coin balance after adding
- `walletBalance` shows the current wallet balance (unchanged)
- `MobileNumber` shows the user's mobile number

### Error Responses

#### 400 Bad Request - Missing Coins
```json
{
  "message": "Coins is required"
}
```

#### 400 Bad Request - Invalid Coins Value
```json
{
  "message": "Coins must be a valid number"
}
```

#### 400 Bad Request - Invalid Coins Amount
```json
{
  "message": "Coins must be greater than 0"
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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 7. Add Amount (RS) to Wallet Balance

Add **RS amount** to the authenticated user's `WalletBalance`.

### Endpoint
```
POST /users/addwallet
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Amount": 50
}
```

**Note:** 
- `Amount` is **required** and must be a positive number greater than 0
- This API adds RS directly to the user's `WalletBalance`
- User must be authenticated with a valid JWT token

### Success Response (200 OK)
```json
{
  "message": "Wallet balance added successfully",
  "data": {
    "amountAdded": 50,
    "previousWalletBalance": 100,
    "currentWalletBalance": 150,
    "coins": 500,
    "MobileNumber": "9876543210"
  }
}
```

**Error Responses**

#### 400 Bad Request - Missing Amount
```json
{
  "message": "Amount is required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "Amount must be a valid number"
}
```

#### 400 Bad Request - Amount <= 0
```json
{
  "message": "Amount must be greater than 0"
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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 8. Get User Refer Code

Retrieve the refer code for the authenticated user.

### Endpoint
```
GET /users/refercode
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Refer code retrieved successfully",
  "data": {
    "UserName": "john_doe",
    "ReferCode": "PRK08F9",
    "MobileNumber": "9876543210",
    "ReferralCount": 5,
    "TotalEarnings": 25,
    "RewardType": "Coins",
    "RewardPerReferral": 5
  }
}
```

**Note:** 
- `UserName` is the user's username
- `ReferCode` is the user's unique referral code
- `ReferralCount` shows how many users have joined using this referral code (users who have `ReferredBy` matching this `ReferCode`)
- `TotalEarnings` shows the total amount earned from all referrals (ReferralCount × RewardPerReferral)
- `RewardType` indicates whether rewards are in "Coins" or "WalletBalance"
- `RewardPerReferral` shows the reward amount given per referral (configured by admin)

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 9. Get Captcha

Get a captcha challenge to solve.

### Endpoint
```
GET /users/captcha
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Captcha generated successfully",
  "data": {
    "Captcha": "ABC12"
  }
}
```

**Note:** 
- Captcha format: 3 uppercase letters followed by 2 digits (e.g., "ABC12", "XYZ45")
- Captcha is case-sensitive

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

## 10. Solve Captcha

Solve a captcha and earn rewards (Coins or WalletBalance).

### Endpoint
```
POST /users/captcha/solve
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Captcha": "ABC12"
}
```

### Success Response (200 OK)
```json
{
  "message": "Captcha solved successfully",
  "data": {
    "RewardAmount": 1,
    "RewardType": "Coins",
    "TodaySolves": 3,
    "DailyLimit": 10,
    "Coins": 15,
    "WalletBalance": 0
  }
}
```

**Note:** 
- Users have a daily limit for solving captchas (set by admin)
- Rewards can be in Coins or WalletBalance (set by admin)
- Each captcha solve is tracked and counted per day
- Once daily limit is reached, user cannot solve more captchas until next day

### Error Responses

#### 400 Bad Request - Missing Captcha
```json
{
  "message": "Captcha is required"
}
```

#### 400 Bad Request - Invalid Captcha Format
```json
{
  "message": "Invalid captcha format. Should be 3 letters followed by 2 digits (e.g., ABC12)"
}
```

#### 400 Bad Request - Daily Limit Reached
```json
{
  "message": "Daily captcha limit reached. You can solve 10 captchas per day."
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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

## Example Usage

### Using cURL

#### Signup (without referral code)
```bash
curl -X POST http://localhost:3100/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "UserName": "john_doe",
    "MobileNumber": "9876543210",
    "Password": "yourpassword123",
    "DeviceId": "device123456"
  }'
```

#### Signup (with referral code)
```bash
curl -X POST http://localhost:3100/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "UserName": "john_doe",
    "MobileNumber": "9876543210",
    "Password": "yourpassword123",
    "DeviceId": "device123456",
    "ReferralCode": "PRK08F9"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3100/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "MobileNumber": "9876543210",
    "Password": "yourpassword123",
    "DeviceId": "device123456"
  }'
```

#### Get Wallet Balance and Coins
```bash
curl -X GET http://localhost:3100/users/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Add Coins to Wallet
```bash
curl -X POST http://localhost:3100/users/addcoins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Coins": 100
  }'
```

#### Get Refer Code
```bash
curl -X GET http://localhost:3100/users/refercode \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get All Daily Bonuses
```bash
curl -X GET http://localhost:3100/users/dailybonus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Claim Daily Bonus
```bash
curl -X POST http://localhost:3100/users/dailybonus/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Captcha
```bash
curl -X GET http://localhost:3100/users/captcha \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Solve Captcha
```bash
curl -X POST http://localhost:3100/users/captcha/solve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Captcha": "ABC12"
  }'
```

### Using JavaScript (Fetch API)

#### Signup (without referral code)
```javascript
fetch('http://localhost:3100/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    MobileNumber: '9876543210',
    Password: 'yourpassword123',
    DeviceId: 'device123456'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User created:', data);
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Token:', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Signup (with referral code)
```javascript
fetch('http://localhost:3100/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    UserName: 'john_doe',
    MobileNumber: '9876543210',
    Password: 'yourpassword123',
    DeviceId: 'device123456',
    ReferralCode: 'PRK08F9'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User created:', data);
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Referred By:', data.data.ReferredBy);
  console.log('Token:', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Login
```javascript
fetch('http://localhost:3100/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    MobileNumber: '9876543210',
    Password: 'yourpassword123',
    DeviceId: 'device123456'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login successful:', data);
  console.log('User Refer Code:', data.data.ReferCode);
  console.log('Token:', data.token);
  // Store token for future requests
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Get Wallet Balance and Coins
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/wallet', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Wallet details:', data);
  console.log('Coins:', data.data.Coins);
  console.log('Wallet Balance:', data.data.WalletBalance);
})
.catch(error => console.error('Error:', error));
```

#### Add Coins to Wallet
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/addcoins', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Coins: 100
  })
})
.then(response => response.json())
.then(data => {
  console.log('Coins added:', data.message);
  console.log('Coins Added:', data.data.coinsAdded);
  console.log('Previous Coins:', data.data.previousCoins);
  console.log('Current Coins:', data.data.currentCoins);
  console.log('Wallet Balance:', data.data.walletBalance);
})
.catch(error => console.error('Error:', error));
```

#### Get Refer Code
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/refercode', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Users Joined:', data.data.ReferralCount);
  console.log('Total Earnings:', data.data.TotalEarnings, data.data.RewardType);
  console.log('Reward Per Referral:', data.data.RewardPerReferral);
})
.catch(error => console.error('Error:', error));
```

#### Get All Daily Bonuses
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/dailybonus', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Daily Bonuses:', data.data.bonuses);
  console.log('Current Day:', data.data.currentDay);
  console.log('Reward Type:', data.data.rewardType);
  console.log('Total Coins:', data.data.totalCoins);
  console.log('Total Wallet Balance:', data.data.totalWalletBalance);
  // Display bonuses with claim status
  data.data.bonuses.forEach(bonus => {
    console.log(`${bonus.day}: ${bonus.amount} ${data.data.rewardType} - ${bonus.claimed ? 'Claimed' : 'Available'}${bonus.isToday ? ' (Today)' : ''}`);
  });
})
.catch(error => console.error('Error:', error));
```

#### Claim Daily Bonus
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/dailybonus/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Bonus claimed:', data.message);
  console.log('Amount:', data.data.amount, data.data.rewardType);
  console.log('Total Coins:', data.data.totalCoins);
  console.log('Total Wallet Balance:', data.data.totalWalletBalance);
  console.log('Note: You can only claim once per day');
})
.catch(error => console.error('Error:', error));
```

#### Get Captcha
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/captcha', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Captcha:', data.data.Captcha);
  // Display captcha to user for solving
})
.catch(error => console.error('Error:', error));
```

#### Solve Captcha
```javascript
const token = localStorage.getItem('token');
const captcha = 'ABC12'; // User input

fetch('http://localhost:3100/users/captcha/solve', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Captcha: captcha
  })
})
.then(response => response.json())
.then(data => {
  console.log('Captcha solved!');
  console.log('Reward:', data.data.RewardAmount, data.data.RewardType);
  console.log('Today Solves:', data.data.TodaySolves, '/', data.data.DailyLimit);
  console.log('Total Coins:', data.data.Coins);
})
.catch(error => console.error('Error:', error));
```

---

## JWT Token

Both signup and login endpoints return a JWT (JSON Web Token) that should be used for authenticating subsequent API requests.

### Token Details
- **Expiration:** 30 days from generation
- **Payload:** Contains user ID and MobileNumber
- **Usage:** Include the token in the `Authorization` header for protected routes:
  ```
  Authorization: Bearer <token>
  ```

### Example: Using Token in Requests
```bash
curl -X GET http://localhost:3100/protected-route \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

## User Model Fields

### Required Fields
- **UserName**: User's username (must be unique, 3-30 characters long)
- **MobileNumber**: User's mobile phone number (must be unique)
- **Password**: User's password (will be encrypted and stored securely)
- **DeviceId**: Device identifier (required, must be unique - one device per user)

### Auto-Generated Fields
- **ReferCode**: Automatically generated unique referral code (format: 3 letters + 2 digits + 1 letter)
  - Example: "PRK08F9", "ABC12X", "XYZ45M"
  - Each user gets a unique refer code upon signup
- **SignupTime**: Automatically recorded timestamp when user signs up
- **LastLoginTime**: Automatically updated timestamp on each successful login (initially null)

### Optional Fields
- **ReferredBy**: Referral code used during signup (stored if a valid referral code is provided, otherwise null)
  - **Permanent once set**: If a referral code is provided during signup, it cannot be removed or changed later
  - If no referral code is provided during signup, this field remains `null` and cannot be set later

### Default Fields
- **Coins**: User's coin balance (default: 0)
- **WalletBalance**: User's wallet balance in currency (default: 0)

---

## Validation Rules

1. **MobileNumber Uniqueness**: Each mobile number can only be registered once. One mobile number = one user.
2. **Password Security**: Passwords are hashed using bcrypt before storage. Never store plain text passwords.
3. **DeviceId**: Required field, must be unique. Each device can only be registered to one account. Cannot signup with a DeviceId that is already registered.
4. **DeviceId Login Restriction**: Users can only login from their registered device. DeviceId must match the one used during signup.
5. **ReferCode Uniqueness**: Each refer code is automatically generated and guaranteed to be unique.
6. **Required Fields**: UserName, MobileNumber, Password, and DeviceId are mandatory for signup.
7. **UserName Requirements**: UserName must be unique and between 3-30 characters long.
7. **Referral Code Permanence**: Referral code (ReferredBy) is optional during signup, but once set, it cannot be removed or changed. If not provided during signup, it remains null permanently.
8. **SignupTime Tracking**: Automatically recorded when user signs up.
9. **LastLoginTime Tracking**: Automatically updated on each successful login.

---

## 11. Get All Daily Bonuses

Retrieve all daily bonuses with claim status for the current week.

### Endpoint
```
GET /users/dailybonus
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonuses retrieved successfully",
  "data": {
    "bonuses": [
      {
        "day": "Monday",
        "amount": 10,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Tuesday",
        "amount": 15,
        "claimed": true,
        "isToday": false
      },
      {
        "day": "Wednesday",
        "amount": 20,
        "claimed": false,
        "isToday": true
      },
      {
        "day": "Thursday",
        "amount": 25,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Friday",
        "amount": 30,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Saturday",
        "amount": 50,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Sunday",
        "amount": 100,
        "claimed": false,
        "isToday": false
      }
    ],
    "rewardType": "Coins",
    "weekStartDate": "2024-01-01T00:00:00.000Z",
    "currentDay": "Wednesday",
    "totalCoins": 150,
    "totalWalletBalance": 0
  }
}
```

**Note:** 
- `bonuses` array contains all 7 days with their bonus amounts and claim status
- `claimed` indicates if the bonus for that day has been claimed this week
- `isToday` indicates which day is today
- `weekStartDate` shows when the current week started (Monday)
- `totalCoins` shows the user's total coins balance
- `totalWalletBalance` shows the user's total wallet balance
- Weekly reset happens automatically - all claims reset every Monday

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## 12. Claim Daily Bonus

Claim the daily bonus for the current day.

### Endpoint
```
POST /users/dailybonus/claim
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonus for Wednesday claimed successfully",
  "data": {
    "day": "Wednesday",
    "amount": 20,
    "rewardType": "Coins",
    "coins": 45,
    "walletBalance": 0,
    "totalCoins": 45,
    "totalWalletBalance": 0
  }
}
```

**Note:** 
- Users can claim each day's bonus **only once per day** - cannot claim the same day multiple times
- Weekly reset happens automatically every Monday
- Bonus is added to Coins or WalletBalance based on admin settings
- `totalCoins` and `totalWalletBalance` show updated balances after claiming

### Error Responses

#### 400 Bad Request - Already Claimed
```json
{
  "message": "Daily bonus for Wednesday has already been claimed. You can only claim once per day."
}
```

#### 400 Bad Request - No Bonus Available
```json
{
  "message": "No bonus available for Sunday"
}
```

#### 400 Bad Request - Settings Not Configured
```json
{
  "message": "Daily bonus settings not configured"
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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

## Withdrawal Request APIs

### GET /users/withdrawal/threshold
Get the minimum withdrawal amount threshold and check if user can withdraw.

**Endpoint:**
```
GET /users/withdrawal/threshold
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Withdrawal threshold retrieved successfully",
  "data": {
    "minimumWithdrawalAmount": 500,
    "denominations": [10, 20, 30, 50],
    "currentWalletBalance": 300,
    "canWithdraw": false
  }
}
```

**Note:** 
- `minimumWithdrawalAmount`: The minimum amount required to make a withdrawal (set by admin)
- `denominations`: Array of allowed withdrawal amounts `[10, 20, 30, 50]`. Users must pick one of these values.
- `currentWalletBalance`: User's current wallet balance
- `canWithdraw`: Boolean indicating if user has enough balance to withdraw (balance >= minimum)
- The live API also returns `dailyWithdrawalRequestLimit`, `requestsToday`, and `remainingRequestsToday`. `requestsToday` counts **UPI, Bank, and gift-voucher** requests together for the daily cap.

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

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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

### POST /users/withdrawal/request
Submit a withdrawal request.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "Amount": 10,
  "PaymentMethod": "UPI",
  "UPIId": "user@upi",
  "VirtualId": "VIRTUAL123"
}
```
<!-- this is testdata -->
OR for Bank Transfer:
```json
{
  "Amount": 50,
  "PaymentMethod": "BankTransfer",
  "BankAccountNumber": "1234567890",
  "BankIFSC": "BANK0001234",
  "BankName": "Bank Name",
  "AccountHolderName": "John Doe"
}
```

**Allowed Denominations:** `10, 20, 30, 50` — Amount must be one of these values.

**Response (Success - 200):**
```json
{
  "message": "Withdrawal request submitted successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "amount": 10,
    "paymentMethod": "UPI",
    "status": "Pending",
    "remainingWalletBalance": 400,
    "createdAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Response (Error - 400 - Invalid Denomination):**
```json
{
  "message": "Amount must be one of the allowed denominations: 10, 20, 30, 50"
}
```

**Response (Error - 400):**
```json
{
  "message": "Insufficient wallet balance. Available: 5, Requested: 10"
}
```

**Response (Error - 400):**
```json
{
  "message": "Daily withdrawal request limit reached. You can place only 1 withdrawal request(s) per day."
}
```

**Validation Rules:**
- Amount must be one of the allowed denominations: `10, 20, 30, 50`
- Wallet balance must be sufficient
- For UPI: UPIId or VirtualId is required
- For Bank Transfer: BankAccountNumber, BankIFSC, BankName, and AccountHolderName are required
- Amount is deducted from wallet immediately when request is submitted
- Use `/users/withdrawal/threshold` endpoint to check available denominations before submitting request

---

### GET /users/withdrawal/requests
Get all withdrawal requests for the authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
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
        "amount": 500,
        "paymentMethod": "BankTransfer",
        "upiId": null,
        "virtualId": null,
        "bankAccountNumber": "****7890",
        "bankIFSC": "BANK0001234",
        "bankName": "Bank Name",
        "accountHolderName": "John Doe",
        "status": "Approved",
        "adminNotes": "Payment processed",
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "totalRequests": 2,
    "currentWalletBalance": 400
  }
}
```

**Notes:**
- Bank account numbers are masked for security (only last 4 digits visible)
- Requests are sorted by creation date (newest first)
- If request is rejected, amount is returned to wallet
- If request is approved, amount stays deducted

---

## Gift Voucher (Gift Card Redeem) APIs

Use these endpoints when the user selects **Gift Voucher Withdraw** on the withdrawal screen (instead of UPI or Bank). Amount is deducted from the wallet when the request is created; status starts as **Pending**. After admin **Deliver**, the user can read `voucherCode` from their list.

**Brands (fixed list):** `Amazon`, `Flipkart`, `GooglePlay`, `Paytm` — send these exact strings as `Brand`.

**Allowed amounts:** Server accepts only these denominations: **50, 100, 250, 500, 1000** (₹). Extend the list in backend if you add more slabs.

**Daily limit:** The same `DailyWithdrawalRequestLimit` as UPI/Bank applies to **all** withdrawal actions combined (cash withdrawal + gift voucher requests) per calendar day.

---

### GET /users/gift-voucher/options

Returns brands, allowed denominations, wallet balance, and how many withdrawal actions remain today.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Gift voucher options retrieved successfully",
  "data": {
    "type": "giftcard",
    "brands": ["Amazon", "Flipkart", "GooglePlay", "Paytm"],
    "denominations": [50, 100, 250, 500, 1000],
    "dailyWithdrawalRequestLimit": 1,
    "requestsToday": 0,
    "remainingRequestsToday": 1,
    "currentWalletBalance": 500
  }
}
```

**Response (Error - 404):**
```json
{
  "message": "User Not Found"
}
```

---

### POST /users/gift-voucher/request

Submit a gift voucher redeem request. Wallet balance is reduced immediately; record is stored with `status: "Pending"`.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Brand": "Amazon",
  "Amount": 100
}
```

**Response (Success - 200):**
```json
{
  "message": "Gift voucher request submitted successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "type": "giftcard",
    "brand": "Amazon",
    "amount": 100,
    "status": "Pending",
    "remainingWalletBalance": 400,
    "requestsToday": 1,
    "remainingRequestsToday": 0,
    "createdAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Response (Error - 400) — invalid brand:**
```json
{
  "message": "Brand is required and must be one of: Amazon, Flipkart, GooglePlay, Paytm"
}
```

**Response (Error - 400) — bad denomination:**
```json
{
  "message": "Amount must be one of the allowed denominations: 50, 100, 250, 500, 1000"
}
```

**Response (Error - 400) — daily limit:**
```json
{
  "message": "Daily withdrawal request limit reached. You can place only 1 withdrawal request(s) per day (includes UPI, Bank, and gift vouchers)."
}
```

**Response (Error - 400) — insufficient balance:**
```json
{
  "message": "Insufficient wallet balance. Available: 50, Requested: 100"
}
```

---

### GET /users/gift-voucher/requests

List the authenticated user’s gift voucher requests. `voucherCode` is **only** included when `status` is `Delivered`.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Gift voucher requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "type": "giftcard",
        "brand": "Amazon",
        "amount": 100,
        "status": "Delivered",
        "voucherCode": "ABCD-EFGH-IJKL",
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T23:00:00.000Z"
      }
    ],
    "totalRequests": 1,
    "currentWalletBalance": 400
  }
}
```

For `Pending`, `Approved`, or `Rejected`, `voucherCode` will be `null`.

---

## Daily Spin APIs

### GET /users/dailyspin/status
Get today's spin usage and remaining spins, plus lifetime total spins.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "message": "Daily spin status retrieved successfully",
  "data": {
    "dailySpinLimit": 20,
    "spinsUsedToday": 5,
    "spinsRemainingToday": 15,
    "totalSpins": 120
  }
}
```

**Notes:**
- `dailySpinLimit`: Admin configured daily limit (default: 10)
- `spinsUsedToday`: Total spins used today (counted from stored spin usage records)
- `spinsRemainingToday`: Remaining spins for today
- `totalSpins`: Lifetime total spins used by user
- If the user is blocked, request returns **403 Account Blocked** (same as other protected APIs)

---

### POST /users/dailyspin/use
Use/consume spins and **note down** (store) the spin usage. This is how the app should record spin count usage.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "SpinCount": 1
}
```

**Notes:**
- If `SpinCount` is not sent, it defaults to `1`
- `SpinCount` must be a positive integer
- Cannot exceed remaining spins for today
- Each successful call stores a spin usage record in DB (note down)

**Response (Success - 200):**
```json
{
  "message": "Spin usage recorded successfully",
  "data": {
    "spinCountUsed": 1,
    "dailySpinLimit": 20,
    "spinsUsedToday": 6,
    "spinsRemainingToday": 14,
    "totalSpins": 121
  }
}
```

**Error Responses:**

#### 400 Bad Request - Invalid SpinCount
```json
{
  "message": "SpinCount must be a positive integer"
}
```

#### 400 Bad Request - Daily Limit Exceeded
```json
{
  "message": "Daily spin limit exceeded. Remaining spins today: 0",
  "data": {
    "dailySpinLimit": 20,
    "spinsUsedToday": 20,
    "spinsRemainingToday": 0
  }
}
```

---

## Leaderboard APIs

### GET /users/leaderboard
Get users leaderboard ranked by wallet balance or coins. Shows top users and current user's rank.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `type`: Leaderboard type - `wallet` (default) or `coins`
- `limit`: Number of users per page (default: 100, max: 500)
- `page`: Page number (default: 1)

**Example Request:**
```
GET /users/leaderboard?type=wallet&limit=50&page=1
```

**Response (Success - 200):**
```json
{
  "message": "Leaderboard retrieved successfully",
  "data": {
    "type": "wallet",
    "leaderboard": [
      {
        "rank": 1,
        "userName": "john_doe",
        "referCode": "PRK08F9",
        "coins": 5000,
        "walletBalance": 10000
      },
      {
        "rank": 2,
        "userName": "jane_smith",
        "referCode": "PRK12A5",
        "coins": 3000,
        "walletBalance": 8000
      },
      {
        "rank": 3,
        "userName": "bob_wilson",
        "referCode": "PRK45M2",
        "coins": 2000,
        "walletBalance": 6000
      }
    ],
    "currentUser": {
      "rank": 25,
      "userName": "alice_brown",
      "referCode": "PRK45M2",
      "coins": 500,
      "walletBalance": 1000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 500,
      "limit": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "userRank": 25,
    "userInCurrentPage": false
  }
}
```

**Note:**
- Leaderboard returns: `rank`, `userName`, `referCode`, `coins`, and `walletBalance`
- Leaderboard is sorted by wallet balance (descending) by default, or by coins if `type=coins`
- Blocked users are excluded from the leaderboard
- Shows current user's rank and position with same fields (rank, userName, referCode, coins, walletBalance)
- Includes pagination for large leaderboards
- `userInCurrentPage` indicates if current user appears in the current page results

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 403 Forbidden - Account Blocked
```json
{
  "message": "Your account has been blocked",
  "isBlocked": true,
  "blockedAt": "2024-01-18T22:30:00.000Z",
  "blockedReason": "Violation of terms of service"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
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
curl -X GET "http://localhost:3100/users/leaderboard?type=wallet&limit=50&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/leaderboard?type=wallet&limit=50&page=1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Leaderboard:', data.data.leaderboard);
  console.log('My Rank:', data.data.currentUser.rank);
  console.log('My Position:', data.data.userRank);
})
.catch(error => console.error('Error:', error));
```

---

### GET /users/leaderboard/top
Get top users leaderboard (Public - No authentication required). Shows top users by wallet balance or coins.

**Headers:**
```
Content-Type: application/json
```

**Query Parameters (Optional):**
- `type`: Leaderboard type - `wallet` (default) or `coins`
- `limit`: Number of top users to show (default: 10, max: 100)

**Example Request:**
```
GET /users/leaderboard/top?type=wallet&limit=20
```

**Response (Success - 200):**
```json
{
  "message": "Top users leaderboard retrieved successfully",
  "data": {
    "type": "wallet",
    "leaderboard": [
      {
        "rank": 1,
        "userName": "john_doe",
        "referCode": "PRK08F9",
        "coins": 5000,
        "walletBalance": 10000
      },
      {
        "rank": 2,
        "userName": "jane_smith",
        "referCode": "PRK12A5",
        "coins": 3000,
        "walletBalance": 8000
      },
      {
        "rank": 3,
        "userName": "bob_wilson",
        "referCode": "PRK45M2",
        "coins": 2000,
        "walletBalance": 6000
      }
    ],
    "totalShown": 3
  }
}
```

**Note:**
- This is a public endpoint - no authentication required
- Shows only top users (limited by `limit` parameter)
- Returns: `rank`, `userName`, `referCode`, `coins`, and `walletBalance`
- Blocked users are excluded from the leaderboard
- Leaderboard is sorted by wallet balance (descending) by default, or by coins if `type=coins`

**Error Responses:**

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
curl -X GET "http://localhost:3100/users/leaderboard/top?type=wallet&limit=20" \
  -H "Content-Type: application/json"
```

**Using JavaScript (Fetch API):**
```javascript
fetch('http://localhost:3100/users/leaderboard/top?type=wallet&limit=20', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Top Users:', data.data.leaderboard);
  console.log('Leaderboard Type:', data.data.type);
})
.catch(error => console.error('Error:', error));
```

**Notes:**
- Leaderboard APIs show users ranked by wallet balance or coins
- **Response Format**: Both endpoints return `rank`, `userName`, `referCode`, `coins`, and `walletBalance`
- Blocked users are automatically excluded from leaderboards
- Protected leaderboard endpoint (`/users/leaderboard`) shows current user's rank and position
- Public leaderboard endpoint (`/users/leaderboard/top`) shows top users only
- Leaderboard supports pagination for large user bases
- Current user's rank is calculated and shown in protected endpoint with same fields (rank, userName, referCode, coins, walletBalance)
- Sorting: Wallet balance leaderboard sorts by WalletBalance (desc), then Coins (desc)
- Sorting: Coins leaderboard sorts by Coins (desc), then WalletBalance (desc)

---

## Notes

- All endpoints require `Content-Type: application/json` header
- UserName, MobileNumber, Password, and DeviceId are required for signup
- MobileNumber, Password, and DeviceId are required for login
- DeviceId must be unique - one device can only be registered to one account
- Users can only login from their registered device - DeviceId must match during login
- SignupTime is automatically recorded when user signs up
- LastLoginTime is automatically updated on each successful login
- Passwords are encrypted using crypto-js (AES encryption) before storage
- GET endpoints (`/users/wallet` and `/users/refercode`) require JWT token authentication
- Include JWT token in `Authorization: Bearer <token>` header for protected routes
- JWT tokens expire after 30 days - users will need to login again after expiration
- Set `JWT_SECRET` environment variable for production (defaults to a placeholder if not set)
- The base URL may vary depending on your server configuration
- **User Blocking System**: Admin can block/unblock users via admin APIs
- **Blocked users cannot login** - login endpoint checks blocked status and returns 403 error if blocked
- **Blocked users cannot access any protected APIs** - all protected endpoints automatically check blocked status via middleware
- When a blocked user tries to access any protected API, they receive a 403 error with blocked status details
- Blocked status includes `isBlocked` (boolean), `blockedAt` (timestamp), and `blockedReason` (optional reason)
- ReferCode is automatically generated and cannot be manually set
- Each user must have a unique combination of MobileNumber and DeviceId
- Coins and WalletBalance are initialized to 0 when a user signs up
- ReferralCode is optional during signup - if provided, it must be a valid referral code from an existing user
- If a valid ReferralCode is provided, it will be stored in the ReferredBy field
- Daily bonus APIs require JWT token authentication
- Daily bonuses reset automatically every week (Monday to Sunday cycle)
- Users can claim each day's bonus once per week
- Weekly reset happens automatically - when a new week starts, all claim statuses reset
- Withdrawal request APIs require JWT token authentication
- Users can only have one pending withdrawal request at a time
- Amount is deducted from wallet immediately when withdrawal request is submitted
- If withdrawal is rejected by admin, amount is automatically returned to wallet
- If withdrawal is approved, amount stays deducted (payment should be processed externally)
- Bank account numbers are masked in user-facing APIs for security

---

## App Installation Reward APIs

### GET /users/apps
Get all available apps for installation with filters.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `filter`: Filter by "highest" (highest paying) or "easiest" (easiest apps first)
- `difficulty`: Filter by difficulty ("Easiest", "Easy", "Medium", "Hard")

**Example Request:**
```
GET /users/apps?filter=highest&difficulty=Easy
```

**Success Response (200 OK):**
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
        "description": "Install this app and earn coins!",
        "userStatus": "available",
        "canSubmit": true,
        "createdAt": "2024-01-18T20:00:00.000Z"
      }
    ],
    "totalApps": 1,
    "availableApps": 1,
    "pendingApps": 0,
    "approvedApps": 0
  }
}
```

**Note:**
- `userStatus` can be: "available" (can submit), "pending" (waiting for approval), "approved" (already approved), "rejected" (can resubmit)
- `canSubmit` indicates if user can submit a new installation for this app
- Apps are filtered to show only "Active" apps
- Filter "highest" sorts by highest reward coins first
- Filter "easiest" sorts by easiest difficulty first (Easiest → Easy → Medium → Hard)

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

---

### POST /users/apps/:appId/submit
Submit app installation with screenshot for review. Supports multiple upload methods:
1. **File Upload** (multipart/form-data) - Recommended
2. **Base64 Image** (JSON)
3. **Direct URL** (JSON) - Legacy support

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data (for file upload) OR application/json (for base64/URL)
```

**Method 1: File Upload (Recommended)**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `screenshot`: Image file (JPEG, PNG, etc.) - Max 5MB

**Method 2: Base64 Image**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "screenshotBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "fileName": "screenshot.jpg"
}
```

**Method 3: Direct URL (Legacy - for backward compatibility)**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "ScreenshotUrl": "https://example.com/screenshot.png"
}
```

**Note:**
- When using file upload, the image is automatically uploaded to AWS S3
- The S3 URL is stored in the database
- Supported image formats: JPEG, PNG, GIF, etc.
- Maximum file size: 5MB
- Base64 images should include the data URL prefix (e.g., "data:image/jpeg;base64,")

**Success Response (200 OK):**
```json
{
  "message": "App installation submitted successfully. Please wait for admin approval.",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "appName": "Example App",
    "appImage": "https://example.com/app-image.png",
    "rewardCoins": 50,
    "screenshotUrl": "https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/1234567890-screenshot.jpg",
    "status": "Pending",
    "createdAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Note:**
- `screenshotUrl` will be the AWS S3 URL when using file upload or base64
- The image is stored in the `app-screenshots` folder in S3
- The URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`

**Error Responses:**

#### 400 Bad Request - Missing Screenshot
```json
{
  "message": "Screenshot is required. Please provide either a file upload, base64 image, or ScreenshotUrl"
}
```

#### 400 Bad Request - Invalid File Type
```json
{
  "message": "Only image files are allowed"
}
```

#### 400 Bad Request - File Too Large
```json
{
  "message": "File size exceeds 5MB limit"
}
```

#### 500 Internal Server Error - S3 Upload Failed
```json
{
  "message": "Failed to upload screenshot to S3",
  "error": "Error details"
}
```

#### 400 Bad Request - Already Submitted
```json
{
  "message": "You have already submitted and been approved for this app"
}
```

#### 400 Bad Request - Pending Submission
```json
{
  "message": "You already have a pending submission for this app. Please wait for admin approval."
}
```

#### 404 Not Found - App Not Found
```json
{
  "message": "App not found"
}
```

#### 400 Bad Request - App Not Active
```json
{
  "message": "This app is not available for installation"
}
```

**Note:**
- Users can only have one approved submission per app
- Users can resubmit if their previous submission was rejected
- Users cannot submit if they have a pending submission for the same app
- **File upload is recommended** - images are automatically uploaded to AWS S3
- Screenshots are stored in AWS S3 bucket: `streaming-bucket-123`
- S3 URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP, etc.

---

### GET /users/apps/submissions
Get user's app installation submission history.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")

**Example Request:**
```
GET /users/apps/submissions?status=Approved
```

**Success Response (200 OK):**
```json
{
  "message": "App installation submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Approved",
        "adminNotes": "Screenshot verified successfully",
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:30:00.000Z"
      }
    ],
    "totalSubmissions": 1,
    "pendingCount": 0,
    "approvedCount": 1,
    "rejectedCount": 0,
    "totalEarnings": 50
  }
}
```

**Note:**
- `totalEarnings` shows the sum of reward coins from all approved submissions
- Submissions are sorted by creation date (newest first)
- Shows all app details including name, image, reward coins, and difficulty

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

---

## Example Usage for App Installation APIs

### Using cURL

#### Get All Apps (Highest Paying)
```bash
curl -X GET "http://localhost:3100/users/apps?filter=highest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Easiest Apps
```bash
curl -X GET "http://localhost:3100/users/apps?filter=easiest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Submit App Installation (File Upload - Recommended)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "screenshot=@/path/to/screenshot.jpg"
```

#### Submit App Installation (Base64)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "screenshotBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "fileName": "screenshot.jpg"
  }'
```

#### Submit App Installation (Direct URL - Legacy)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ScreenshotUrl": "https://example.com/screenshot.png"
  }'
```

#### Get User's Submission History
```bash
curl -X GET "http://localhost:3100/users/apps/submissions?status=Approved" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Get All Apps
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/apps?filter=highest', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Available Apps:', data.data.apps);
  data.data.apps.forEach(app => {
    console.log(`${app.appName}: ${app.rewardCoins} coins - ${app.userStatus}`);
  });
})
.catch(error => console.error('Error:', error));
```

#### Submit App Installation (File Upload - Recommended)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b1';
const fileInput = document.getElementById('screenshotFile'); // File input element
const file = fileInput.files[0];

const formData = new FormData();
formData.append('screenshot', file);

fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - browser will set it with boundary for FormData
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Submission successful:', data.message);
  console.log('S3 URL:', data.data.screenshotUrl);
  console.log('Reward Coins:', data.data.rewardCoins);
  console.log('Status:', data.data.status);
})
.catch(error => console.error('Error:', error));
```

#### Submit App Installation (Base64)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b1';

// Convert file to base64
const fileInput = document.getElementById('screenshotFile');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = function(e) {
  const base64String = e.target.result;
  
  fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      screenshotBase64: base64String,
      fileName: file.name
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Submission successful:', data.message);
    console.log('S3 URL:', data.data.screenshotUrl);
    console.log('Reward Coins:', data.data.rewardCoins);
  })
  .catch(error => console.error('Error:', error));
};

reader.readAsDataURL(file);
```

#### Submit App Installation (Direct URL - Legacy)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b3b1';
const screenshotUrl = 'https://example.com/screenshot.png';

fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ScreenshotUrl: screenshotUrl
  })
})
.then(response => response.json())
.then(data => {
  console.log('Submission successful:', data.message);
  console.log('Reward Coins:', data.data.rewardCoins);
  console.log('Status:', data.data.status);
})
.catch(error => console.error('Error:', error));
```

#### Get Submission History
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/apps/submissions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Submissions:', data.data.totalSubmissions);
  console.log('Total Earnings:', data.data.totalEarnings, 'coins');
  console.log('Approved:', data.data.approvedCount);
  console.log('Pending:', data.data.pendingCount);
  data.data.submissions.forEach(sub => {
    console.log(`${sub.appName}: ${sub.status} - ${sub.appRewardCoins} coins`);
  });
})
.catch(error => console.error('Error:', error));
```

---

## Notes for App Installation System

- App installation APIs require JWT token authentication
- Users can browse available apps with filters (highest paying, easiest)
- Users can filter apps by difficulty level
- Users submit screenshots after installing apps
- **Screenshots are automatically uploaded to AWS S3** when using file upload or base64
- S3 bucket: `streaming-bucket-123`, Region: `us-east-1`
- S3 URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`
- Admin reviews and approves/rejects submissions
- When approved, reward coins are automatically added to user's wallet
- Users can only have one approved submission per app
- Users can resubmit if their submission was rejected
- Users can track their submission history and total earnings
- Maximum file size: 5MB
- Supported image formats: JPEG, PNG, GIF, WebP, etc.

---

## Coin Conversion APIs

### GET /users/coinconversion/rate
Get coin-to-RS (rupees) conversion rate and user's conversion potential.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Coin conversion rate retrieved successfully",
  "data": {
    "coinsPerRupee": 10,
    "minimumCoinsToConvert": 100,
    "userCoins": 500,
    "rupeesValue": "50.00",
    "canConvert": true
  }
}
```

**Note:**
- `coinsPerRupee`: How many coins equal 1 rupee (set by admin)
- `minimumCoinsToConvert`: Minimum coins required to convert (set by admin)
- `userCoins`: Current coins balance of the user
- `rupeesValue`: How much rupees the user's coins are worth
- `canConvert`: Whether user has enough coins to convert (meets minimum requirement)

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

### POST /users/coinconversion/convert
Convert coins to RS (rupees). Coins are deducted and rupees are added to wallet balance.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Coins": 200
}
```

**Success Response (200 OK):**
```json
{
  "message": "Coins converted to RS successfully",
  "data": {
    "coinsConverted": 200,
    "rupeesAdded": "20.00",
    "remainingCoins": 300,
    "walletBalance": "50.00",
    "conversionRate": 10
  }
}
```

**Note:**
- Coins are deducted from user's coin balance
- Rupees are added to user's wallet balance
- Conversion is irreversible
- Must meet minimum coins requirement set by admin

**Error Responses:**

#### 400 Bad Request - Missing Coins
```json
{
  "message": "Coins is required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "Coins must be greater than 0"
}
```

#### 400 Bad Request - Below Minimum
```json
{
  "message": "Minimum 100 coins required to convert"
}
```

#### 400 Bad Request - Insufficient Coins
```json
{
  "message": "Insufficient coins. You have 50 coins, but trying to convert 200 coins"
}
```

---

## Example Usage for Coin Conversion APIs

### Using cURL

#### Get Conversion Rate
```bash
curl -X GET http://localhost:3100/users/coinconversion/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Convert Coins to RS
```bash
curl -X POST http://localhost:3100/users/coinconversion/convert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Coins": 200
  }'
```

### Using JavaScript (Fetch API)

#### Get Conversion Rate
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/coinconversion/rate', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Conversion Rate:', data.data.coinsPerRupee, 'coins per rupee');
  console.log('Your Coins:', data.data.userCoins);
  console.log('Worth:', data.data.rupeesValue, 'rupees');
  console.log('Can Convert:', data.data.canConvert);
})
.catch(error => console.error('Error:', error));
```

#### Convert Coins to RS
```javascript
const token = localStorage.getItem('token');
const coinsToConvert = 200;

fetch('http://localhost:3100/users/coinconversion/convert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Coins: coinsToConvert
  })
})
.then(response => response.json())
.then(data => {
  console.log('Conversion successful!');
  console.log('Coins Converted:', data.data.coinsConverted);
  console.log('Rupees Added:', data.data.rupeesAdded);
  console.log('Remaining Coins:', data.data.remainingCoins);
  console.log('Wallet Balance:', data.data.walletBalance);
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Coin Conversion System

- Coin conversion APIs require JWT token authentication
- Admin sets the conversion rate (coins per rupee) and minimum coins required
- Users can check their conversion potential using the rate API
- Users can convert coins to rupees which are added to wallet balance
- Conversion is irreversible - coins are deducted permanently
- Must meet minimum coins requirement to convert
- Cannot convert more coins than user has
---

## Wallet & Task History API

### GET /users/wallethistory
Get a combined history of all wallet-related activities for the authenticated user (earnings and deductions).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of records per page (default: 50)
- `type`: Filter by event type (optional). Supported values:
  - `SCRATCH_CARD`
  - `SCRATCH_CARD_DAILY_LIMIT`
  - `CAPTCHA`
  - `APP_INSTALL`
  - `WITHDRAWAL`
  - `COIN_CONVERSION`

**Success Response (200 OK):**
```json
{
  "message": "Wallet & task history retrieved successfully",
  "data": {
    "events": [
      {
        "type": "SCRATCH_CARD",
        "sourceId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "title": "Scratch Card - Wednesday",
        "coinsChange": 40,
        "walletChange": 0,
        "status": "Completed",
        "meta": {
          "day": "Wednesday",
          "rewardType": "Coins",
          "weekStartDate": "2024-01-15T00:00:00.000Z"
        },
        "createdAt": "2024-01-17T10:30:00.000Z"
      },
      {
        "type": "WITHDRAWAL",
        "sourceId": "60f7b3b3b3b3b3b3b3b3b3c0",
        "title": "Withdrawal - UPI",
        "coinsChange": 0,
        "walletChange": -100,
        "status": "Pending",
        "meta": {
          "paymentMethod": "UPI",
          "amount": 100
        },
        "createdAt": "2024-01-18T09:00:00.000Z"
      },
      {
        "type": "COIN_CONVERSION",
        "sourceId": "60f7b3b3b3b3b3b3b3b3b3d1",
        "title": "Coin Conversion",
        "coinsChange": -200,
        "walletChange": 20,
        "status": "Completed",
        "meta": {
          "conversionRate": 10
        },
        "createdAt": "2024-01-18T11:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalEvents": 100,
      "limit": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "totals": {
      "totalCoinsChange": 500,
      "totalWalletChange": -150,
      "currentCoins": 1000,
      "currentWalletBalance": 350.50
    }
  }
}
```

**Response Fields:**
- `events`: Array of history records (sorted by newest first)
  - `type`: Event type (`SCRATCH_CARD`, `SCRATCH_CARD_DAILY_LIMIT`, `CAPTCHA`, `APP_INSTALL`, `WITHDRAWAL`, `COIN_CONVERSION`)
  - `sourceId`: ID of the underlying record (e.g., scratch card claim ID, withdrawal request ID)
  - `title`: Short description of the event
  - `coinsChange`: Coins added (+) or removed (-) by this event
  - `walletChange`: Wallet balance added (+) or removed (-) by this event
  - `status`: Status of the event (e.g., `Completed`, `Pending`, `Approved`, `Rejected`)
  - `meta`: Extra details depending on the type (day, app name, payment method, conversion rate, etc.)
  - `createdAt`: When the event happened
- `pagination`: Standard pagination info
- `totals`:
  - `totalCoinsChange`: Sum of `coinsChange` over all events in result set
  - `totalWalletChange`: Sum of `walletChange` over all events in result set
  - `currentCoins`: User's current coins balance
  - `currentWalletBalance`: User's current wallet balance

**Notes:**
- History includes:
  - Scratch cards (`SCRATCH_CARD`)
  - Daily limit scratch cards (`SCRATCH_CARD_DAILY_LIMIT`)
  - Captcha rewards (`CAPTCHA`)
  - Approved app installation rewards (`APP_INSTALL`)
  - Withdrawal requests (`WITHDRAWAL`)
  - Coin conversions (`COIN_CONVERSION`)
- Withdrawals show a negative `walletChange` (amount deducted). If the request is later rejected, the refund happens via admin logic and may appear in another admin-specific history.
- You can filter by `type` to show only one category (e.g., only withdrawals or only coin conversions).
- This API is designed for showing a Paytm-style wallet statement screen in the app.
- Each event shows exactly which task was completed and how much coins/wallet balance was earned or spent.

**Detailed Event Type Examples:**

**SCRATCH_CARD:**
```json
{
  "type": "SCRATCH_CARD",
  "title": "Scratch Card - Wednesday",
  "coinsChange": 40,
  "walletChange": 0,
  "status": "Completed",
  "meta": {
    "day": "Wednesday",
    "rewardType": "Coins",
    "weekStartDate": "2024-01-15T00:00:00.000Z"
  }
}
```

**SCRATCH_CARD_DAILY_LIMIT:**
```json
{
  "type": "SCRATCH_CARD_DAILY_LIMIT",
  "title": "Scratch Card Daily Limit",
  "coinsChange": 50,
  "walletChange": 10.50,
  "status": "Completed",
  "meta": {}
}
```

**CAPTCHA:**
```json
{
  "type": "CAPTCHA",
  "title": "Captcha Solve",
  "coinsChange": 1,
  "walletChange": 0,
  "status": "Completed",
  "meta": {
    "rewardType": "Coins"
  }
}
```

**APP_INSTALL:**
```json
{
  "type": "APP_INSTALL",
  "title": "App Install - Example App",
  "coinsChange": 50,
  "walletChange": 0,
  "status": "Approved",
  "meta": {
    "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "appName": "Example App"
  }
}
```

**WITHDRAWAL:**
```json
{
  "type": "WITHDRAWAL",
  "title": "Withdrawal - UPI",
  "coinsChange": 0,
  "walletChange": -100,
  "status": "Pending",
  "meta": {
    "paymentMethod": "UPI",
    "amount": 100
  }
}
```

**COIN_CONVERSION:**
```json
{
  "type": "COIN_CONVERSION",
  "title": "Coin Conversion",
  "coinsChange": -200,
  "walletChange": 20,
  "status": "Completed",
  "meta": {
    "conversionRate": 10
  }
}
```

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

**Example Usage:**

#### Get All History
```bash
curl -X GET "http://localhost:3100/users/wallethistory?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Only Scratch Card History
```bash
curl -X GET "http://localhost:3100/users/wallethistory?type=SCRATCH_CARD" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Only Withdrawal History
```bash
curl -X GET "http://localhost:3100/users/wallethistory?type=WITHDRAWAL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Only Coin Conversion History
```bash
curl -X GET "http://localhost:3100/users/wallethistory?type=COIN_CONVERSION" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Only App Install History
```bash
curl -X GET "http://localhost:3100/users/wallethistory?type=APP_INSTALL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('token');

// Get all history
fetch('http://localhost:3100/users/wallethistory?page=1&limit=50', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Events:', data.data.pagination.totalEvents);
  console.log('Total Coins Earned:', data.data.totals.totalCoinsChange);
  console.log('Total Wallet Change:', data.data.totals.totalWalletChange);
  
  // Show each completed task
  data.data.events.forEach(event => {
    if (event.coinsChange > 0) {
      console.log(`Task: ${event.title} - Earned ${event.coinsChange} coins`);
    }
    if (event.walletChange > 0) {
      console.log(`Task: ${event.title} - Earned ₹${event.walletChange}`);
    }
  });
})
.catch(error => console.error('Error:', error));

// Get only scratch card history
fetch('http://localhost:3100/users/wallethistory?type=SCRATCH_CARD', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Scratch Card Claims:', data.data.events.length);
  const totalScratchCoins = data.data.events.reduce((sum, e) => sum + e.coinsChange, 0);
  console.log('Total Coins from Scratch Cards:', totalScratchCoins);
});
```

---

## Scratch Card APIs

### GET /users/scratchcard
Get scratch card information for the current day.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card info retrieved successfully",
  "data": {
    "currentDay": "Wednesday",
    "todayAmount": 40,
    "rewardType": "Coins",
    "isClaimed": false,
    "canClaim": true,
    "weekStartDate": "2024-01-15T00:00:00.000Z",
    "allDays": {
      "Sunday": 50,
      "Monday": 20,
      "Tuesday": 30,
      "Wednesday": 40,
      "Thursday": 25,
      "Friday": 35,
      "Saturday": 100
    }
  }
}
```

**Note:**
- `currentDay`: Current day of the week
- `todayAmount`: Reward amount for today's scratch card
- `isClaimed`: Whether user has already claimed today's scratch card
- `canClaim`: Whether user can claim today's scratch card
- `allDays`: Shows reward amounts for all days of the week

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

### POST /users/scratchcard/claim
Claim today's scratch card reward.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card for Wednesday claimed successfully",
  "data": {
    "day": "Wednesday",
    "rewardAmount": 40,
    "rewardType": "Coins",
    "coins": 140,
    "walletBalance": 0,
    "claimedAt": "2024-01-17T10:30:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Already Claimed
```json
{
  "message": "Scratch card for Wednesday has already been claimed. You can only claim once per day."
}
```

#### 400 Bad Request - No Reward Available
```json
{
  "message": "No scratch card reward available for Sunday"
}
```

#### 400 Bad Request - Settings Not Configured
```json
{
  "message": "Scratch card settings not configured"
}
```

**Note:**
- Users can claim scratch card once per day
- Reward is automatically added to coins or wallet balance based on admin settings
- Weekly reset happens automatically every Monday

---

### GET /users/scratchcard/history
Get user's scratch card claim history.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of records per page (default: 50)

**Example Request:**
```
GET /users/scratchcard/history?page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card history retrieved successfully",
  "data": {
    "claims": [
      {
        "claimId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "day": "Wednesday",
        "rewardAmount": 40,
        "rewardType": "Coins",
        "weekStartDate": "2024-01-15T00:00:00.000Z",
        "claimedAt": "2024-01-17T10:30:00.000Z"
      },
      {
        "claimId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "day": "Tuesday",
        "rewardAmount": 30,
        "rewardType": "Coins",
        "weekStartDate": "2024-01-15T00:00:00.000Z",
        "claimedAt": "2024-01-16T09:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalClaims": 25,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalCoinsEarned": 500,
      "totalWalletEarned": 0,
      "totalClaims": 25
    }
  }
}
```

**Note:**
- Returns all scratch card claims with pagination
- Includes statistics: total coins earned, total wallet earned, total claims
- Claims are sorted by creation date (newest first)

---

## Example Usage for Scratch Card APIs

### Using cURL

#### Get Scratch Card Info
```bash
curl -X GET http://localhost:3100/users/scratchcard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Claim Scratch Card
```bash
curl -X POST http://localhost:3100/users/scratchcard/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Scratch Card History
```bash
curl -X GET "http://localhost:3100/users/scratchcard/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Scratch Card Daily Limit APIs

### GET /users/scratchcard/dailylimit
Get scratch card daily limit information. This is a separate feature from the regular scratch card.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card daily limit info retrieved successfully",
  "data": {
    "isActive": true,
    "dailyLimit": 3,
    "rewardAmount": 10.50,
    "rewardCoins": 50,
    "claimsToday": 1,
    "remainingClaims": 2,
    "canClaim": true
  }
}
```

**Response Fields:**
- `isActive`: Whether the daily limit feature is enabled
- `dailyLimit`: Maximum number of claims allowed per day
- `rewardAmount`: Wallet balance reward amount
- `rewardCoins`: Coins reward amount
- `claimsToday`: Number of times user has claimed today
- `remainingClaims`: Number of claims remaining today
- `canClaim`: Whether user can claim (true if feature is active, has remaining claims, and rewards are configured)

**Error Responses:**

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

**Note:**
- If settings are not configured, returns default values with `isActive: false` and `canClaim: false`
- Daily limit resets at midnight (00:00:00) each day
- This feature is separate from the regular scratch card feature

---

### POST /users/scratchcard/dailylimit/claim
Claim scratch card with daily limit. Both wallet balance and coins will be added if configured.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card daily limit claimed successfully",
  "data": {
    "claimId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "coinsAdded": 50,
    "amountAdded": 10.50,
    "currentCoins": 150,
    "currentWalletBalance": 110.50,
    "claimsToday": 1,
    "remainingClaims": 2,
    "claimedAt": "2024-01-18T10:30:00.000Z"
  }
}
```

**Response Fields:**
- `claimId`: Unique ID of the claim record
- `coinsAdded`: Coins that were added (0 if not configured)
- `amountAdded`: Wallet balance that was added (0 if not configured)
- `currentCoins`: User's current coin balance after claim
- `currentWalletBalance`: User's current wallet balance after claim
- `claimsToday`: Total number of claims made today (after this claim)
- `remainingClaims`: Number of claims remaining today
- `claimedAt`: Timestamp when the claim was made

**Error Responses:**

#### 400 Bad Request - Settings Not Configured
```json
{
  "message": "Scratch card daily limit settings not configured"
}
```

#### 400 Bad Request - Feature Disabled
```json
{
  "message": "Scratch card daily limit feature is currently disabled"
}
```

#### 400 Bad Request - No Rewards Configured
```json
{
  "message": "No rewards configured for scratch card daily limit"
}
```

#### 400 Bad Request - Daily Limit Reached
```json
{
  "message": "Daily limit reached. You have already claimed 3 time(s) today. Maximum allowed: 3"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

**Note:**
- Both `RewardAmount` (wallet balance) and `RewardCoins` will be added if configured
- Daily limit is enforced per user per day
- Limit resets at midnight (00:00:00) each day
- This feature is completely separate from the regular scratch card feature
- Users can use both features independently

---

## Example Usage for Scratch Card Daily Limit APIs

### Using cURL

#### Get Scratch Card Daily Limit Info
```bash
curl -X GET http://localhost:3100/users/scratchcard/dailylimit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Claim Scratch Card Daily Limit
```bash
curl -X POST http://localhost:3100/users/scratchcard/dailylimit/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (fetch)

#### Get Scratch Card Daily Limit Info
```javascript
fetch('http://localhost:3100/users/scratchcard/dailylimit', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Daily Limit Info:', data);
  if (data.data.canClaim) {
    console.log(`You can claim! ${data.data.remainingClaims} claims remaining today.`);
  }
})
.catch(error => console.error('Error:', error));
```

#### Claim Scratch Card Daily Limit
```javascript
fetch('http://localhost:3100/users/scratchcard/dailylimit/claim', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Claim Result:', data);
  if (data.data.coinsAdded > 0) {
    console.log(`Coins added: ${data.data.coinsAdded}`);
  }
  if (data.data.amountAdded > 0) {
    console.log(`Amount added: ${data.data.amountAdded}`);
  }
  console.log(`Remaining claims: ${data.data.remainingClaims}`);
})
.catch(error => console.error('Error:', error));
```

### Using JavaScript (Fetch API)

#### Get Scratch Card Info
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Today:', data.data.currentDay);
  console.log('Reward Amount:', data.data.todayAmount, data.data.rewardType);
  console.log('Can Claim:', data.data.canClaim);
  console.log('Is Claimed:', data.data.isClaimed);
})
.catch(error => console.error('Error:', error));
```

#### Claim Scratch Card
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Claimed successfully!');
  console.log('Reward:', data.data.rewardAmount, data.data.rewardType);
  console.log('Total Coins:', data.data.coins);
  console.log('Wallet Balance:', data.data.walletBalance);
})
.catch(error => console.error('Error:', error));
```

#### Get Scratch Card History
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard/history?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Claims:', data.data.statistics.totalClaims);
  console.log('Total Coins Earned:', data.data.statistics.totalCoinsEarned);
  console.log('Total Wallet Earned:', data.data.statistics.totalWalletEarned);
  data.data.claims.forEach(claim => {
    console.log(`${claim.day}: ${claim.rewardAmount} ${claim.rewardType} - ${claim.claimedAt}`);
  });
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Scratch Card System

- Scratch card APIs require JWT token authentication
- Admin sets different reward amounts for each day of the week
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday
- Rewards can be in Coins or WalletBalance (set by admin)
- Users can view their complete scratch card claim history
- History includes pagination and statistics

---

## Admin APIs for Commission Slabs and User Earnings

### Commission Slab Settings APIs

Commission slabs allow admins to set percentage-based commission rates based on user earnings. This enables tiered commission structures where users earning more get different commission percentages.

#### POST /admin/commission/slabs
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
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:**
- `SlabName`: Name of the commission slab (e.g., "Bronze Tier", "Silver Tier")
- `MinEarnings`: Minimum earnings amount for this slab (must be >= 0)
- `MaxEarnings`: Maximum earnings amount (null means no upper limit)
- `CommissionPercentage`: Commission percentage (0-100)
- `RewardType`: Either "Coins" or "WalletBalance"
- `IsActive`: Whether the slab is active
- `Order`: Lower order = checked first when determining which slab applies
- `CommissionBasedOn`: What the commission is calculated from (default: "ReferredUserWalletBalance")
  - `ReferredUserWalletBalance`: Commission based on total wallet balance of the referred user
  - `WithdrawalRequestAmount`: Commission based on withdrawal request amount
  - `WithdrawalRequestTime`: Commission based on withdrawal request time/date
- Slabs cannot overlap - each earnings range must be unique

**Error Responses:**

#### 400 Bad Request - Overlapping Slabs
```json
{
  "message": "Slab overlaps with existing slab \"Bronze Tier\" (0 - 1000)"
}
```

#### 400 Bad Request - Invalid Percentage
```json
{
  "message": "CommissionPercentage must be between 0 and 100"
}
```

---

#### GET /admin/commission/slabs
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

#### PUT /admin/commission/slabs/:slabId
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
    "updatedAt": "2024-01-18T21:00:00.000Z"
  }
}
```

---

#### DELETE /admin/commission/slabs/:slabId
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

### Updated Referral Settings API (with Percentage Support)

#### POST /admin/referral/settings
Set referral settings with support for both fixed amounts and percentage-based rewards.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (Fixed Amount Mode):**
```json
{
  "RewardForNewUser": 50,
  "RewardForReferrer": 25,
  "RewardType": "Coins",
  "UsePercentage": false
}
```

**Request Body (Percentage Mode):**
```json
{
  "RewardForNewUser": 50,
  "RewardForReferrer": 10,
  "RewardType": "Coins",
  "UsePercentage": true,
  "ReferrerPercentage": 15,
  "PercentageBasedOn": "SignupBonus"
}
```

**Response (Success - 200):**
```json
{
  "message": "Referral settings updated successfully",
  "data": {
    "RewardForNewUser": 50,
    "RewardForReferrer": 25,
    "RewardType": "Coins",
    "UsePercentage": true,
    "ReferrerPercentage": 15,
    "PercentageBasedOn": "SignupBonus"
  }
}
```

**Note:**
- `UsePercentage`: If true, referral rewards are calculated as a percentage
- `ReferrerPercentage`: Percentage (0-100) the referrer gets when `UsePercentage` is true
- `PercentageBasedOn`: What the percentage is calculated from:
  - `SignupBonus`: Percentage of the new user's signup bonus
  - `TotalEarnings`: Percentage of the new user's total earnings
  - `WalletBalance`: Percentage of the new user's wallet balance
- When `UsePercentage` is false, `RewardForReferrer` is a fixed amount
- `RewardForNewUser` is always a fixed amount

---

### Get All Users with Earnings API

#### GET /admin/users/earnings
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

**Error Responses:**

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

---

## Notes for Commission Slabs and Earnings

- **Commission Slabs**: Allow admins to set tiered commission percentages based on user earnings
- **Commission Basis Options**: Admin can choose what the commission is calculated from:
  - **ReferredUserWalletBalance**: Commission is calculated based on the total wallet balance of the user who was referred. When a user refers someone, the commission is calculated from the referred user's current wallet balance.
  - **WithdrawalRequestAmount**: Commission is calculated based on the withdrawal request amount. When a referred user makes a withdrawal request, the commission is calculated from that withdrawal amount.
  - **WithdrawalRequestTime**: Commission is calculated based on the withdrawal request time/date. This can be used for time-based commission structures.
- **Slab Overlap Prevention**: System prevents overlapping earnings ranges
- **Percentage-Based Referrals**: Referral rewards can be calculated as a percentage of new user's earnings
- **Earnings Tracking**: Complete breakdown of how much each user earned from different sources
- **User Earnings API**: Shows which user name earned how much amount from each source
- **Sorting Options**: Users can be sorted by total earnings, coins, wallet balance, or referral count
- **Search Functionality**: Search users by username, mobile number, or referral code
- **Pagination**: Large user lists are paginated for better performance

---

## Sponsor Promotion Submission APIs

Users can submit sponsor promotion requests with sponsor details and app promotion information. Admin can review and approve/reject these submissions.

### POST /users/sponsor/promotion
Submit a sponsor promotion request with sponsor details and app promotion information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "SponsorName": "John Doe",
  "MobileNumber": "9876543210",
  "Email": "sponsor@example.com",
  "AppPromotion": "My Awesome App"
}
```

**Response (Success - 200):**
```json
{
  "message": "Sponsor promotion submission created successfully",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "sponsorName": "John Doe",
    "mobileNumber": "9876543210",
    "email": "sponsor@example.com",
    "appPromotion": "My Awesome App",
    "status": "Pending",
    "createdAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:**
- `SponsorName`: Name of the sponsor (required, non-empty string)
- `MobileNumber`: Sponsor's mobile number (required, non-empty string)
- `Email`: Sponsor's email address (required, valid email format)
- `AppPromotion`: Name of the app to promote (required, non-empty string)
- Submission status is automatically set to "Pending"
- Admin will review and approve/reject the submission

**Error Responses:**

#### 400 Bad Request - Missing Fields
```json
{
  "message": "SponsorName, MobileNumber, Email, and AppPromotion are required"
}
```

#### 400 Bad Request - Invalid Email
```json
{
  "message": "Email must be a valid email address"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

---

### GET /users/sponsor/promotion
Get all sponsor promotion submissions for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")

**Example Request:**
```
GET /users/sponsor/promotion?status=Pending
```

**Response (Success - 200):**
```json
{
  "message": "Sponsor promotion submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b1",
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
    "totalSubmissions": 2,
    "pendingCount": 1,
    "approvedCount": 1,
    "rejectedCount": 0
  }
}
```

**Note:**
- Returns all sponsor promotion submissions for the authenticated user
- Can filter by status using query parameter
- Submissions are sorted by creation date (newest first)
- Includes counts for each status

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

---

## Example Usage for Sponsor Promotion APIs

### Using cURL

#### Submit Sponsor Promotion
```bash
curl -X POST http://localhost:3100/users/sponsor/promotion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "SponsorName": "John Doe",
    "MobileNumber": "9876543210",
    "Email": "sponsor@example.com",
    "AppPromotion": "My Awesome App"
  }'
```

#### Get User's Sponsor Submissions
```bash
curl -X GET "http://localhost:3100/users/sponsor/promotion?status=Pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Submit Sponsor Promotion
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/sponsor/promotion', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    SponsorName: 'John Doe',
    MobileNumber: '9876543210',
    Email: 'sponsor@example.com',
    AppPromotion: 'My Awesome App'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Submission successful:', data.message);
  console.log('Submission ID:', data.data.submissionId);
  console.log('Status:', data.data.status);
})
.catch(error => console.error('Error:', error));
```

#### Get User's Sponsor Submissions
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/sponsor/promotion?status=Pending', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Submissions:', data.data.totalSubmissions);
  console.log('Pending:', data.data.pendingCount);
  console.log('Approved:', data.data.approvedCount);
  data.data.submissions.forEach(sub => {
    console.log(`${sub.sponsorName} - ${sub.appPromotion}: ${sub.status}`);
  });
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Sponsor Promotion System

- Sponsor promotion APIs require JWT token authentication
- Users can submit multiple sponsor promotion requests
- Each submission includes sponsor name, mobile number, email, and app promotion name
- Submissions start with "Pending" status
- Admin reviews and approves/rejects submissions
- Users can view their submission history and status
- Email validation ensures valid email format
- All fields are required for submission

---

## Daily Limits and Automatic Reset

The system automatically resets all daily limits at midnight (00:00) every day. No manual action is required.

### Automatic Daily Reset

The following daily limits are automatically reset daily:

1. **Scratch Card Daily Limit**: Resets at midnight - users can claim again the next day
2. **Daily Spin Limit**: Resets at midnight - users get their full daily spin limit back
3. **Captcha Daily Limit**: Resets at midnight - users can solve captchas again

### How It Works

- The system uses date-based queries to check if activities occurred "today"
- At midnight, all previous day's activities are automatically excluded from "today's" count
- Users don't need to do anything - limits reset automatically
- Cron jobs run in the background to verify and maintain the reset process

### Cron Jobs

The system includes automated cron jobs that:
- **Daily Reset Verification** (runs at 00:00): Verifies that all daily limits are properly reset
- **Cleanup Old Records** (runs at 01:00): Removes old records older than 90 days for database maintenance

These jobs run automatically when the server starts and require no manual intervention.

**Note**: Daily limits reset automatically based on date queries. The system checks if records are from "today" vs "yesterday", so limits effectively reset at midnight without needing to clear any data.

---

## Popup template (public)

Promotional popup text is configured by admin (**`GET`/`POST`/`PUT /admin/popup-template`**, see **`admin.md`**). The public endpoint returns only **`title`**, **`description`**, and **`isActive`** (no banner image, links, or CTA).

### GET /users/popup-template/public

**No authentication.** Returns **`isActive: true`** with **`title`** and **`description`** only when **`IsActive`** is true and at least one of **title** or **description** is non-empty (**description** merges legacy **`Body`** until admins save **`Description`**). Otherwise **`isActive: false`**, **`title`** / **`description`** are **`null`**, plus **`note`**.



**Response (active popup, 200):**
```json
{
  "message": "Popup template retrieved successfully",
  "data": {
    "isActive": true,
    "title": "Limited time",
    "description": "Complete tasks to earn more"
  }
}
```

**Response (inactive / empty / disabled, 200):**
```json
{
  "message": "Popup template retrieved successfully",
  "data": {
    "isActive": false,
    "title": null,
    "description": null,
    "note": "Popup is currently disabled"
  }
}
```

Possible **`note`** values: **`Popup is not configured`**, **`Popup is currently disabled`**, **`Popup has no title or description to display`**.

**Example (fetch in app):**
```javascript
fetch('http://localhost:3100/users/popup-template/public')
  .then(r => r.json())
  .then(({ data }) => {
    if (data.isActive && (data.title || data.description)) {
      // Render data.title, data.description only
    }
  });
```

---

## Social Links API

Public links for Telegram, YouTube, and Instagram (configured by admin). Use **`GET /users/social-links/public`** — **no JWT required**.

### GET /users/social-links/public
Returns Telegram, YouTube, and Instagram URLs for the mobile app / website footer.

**Response (Success — active, 200):**
```json
{
  "message": "Social links retrieved successfully",
  "data": {
    "telegramLink": "https://t.me/example",
    "youtubeLink": "https://www.youtube.com/@example",
    "instagramLink": "https://www.instagram.com/example",
    "isActive": true
  }
}
```

**Response (admin disabled social links, 200):**
```json
{
  "message": "Social links retrieved successfully",
  "data": {
    "telegramLink": null,
    "youtubeLink": null,
    "instagramLink": null,
    "isActive": false,
    "note": "Social links are currently unavailable"
  }
}
```

Individual link fields may be `null` if the admin cleared them while `isActive` is still `true`.

---

## Support Link API

Users can retrieve support contact information including support link, email, phone, and WhatsApp.

### GET /users/support/link
Get support contact information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "message": "Support link retrieved successfully",
  "data": {
    "supportLink": "https://support.example.com",
    "supportEmail": "support@example.com",
    "supportPhone": "+1234567890",
    "supportWhatsApp": "+1234567890",
    "description": "Contact us for any assistance",
    "isActive": true
  }
}
```

**Response (When Support is Inactive):**
```json
{
  "message": "Support link retrieved successfully",
  "data": {
    "supportLink": null,
    "supportEmail": null,
    "supportPhone": null,
    "supportWhatsApp": null,
    "description": null,
    "isActive": false,
    "note": "Support is currently unavailable"
  }
}
```

**Response Fields:**
- `supportLink`: Support website URL
- `supportEmail`: Support email address
- `supportPhone`: Support phone number
- `supportWhatsApp`: Support WhatsApp number
- `description`: Support description or instructions
- `isActive`: Whether support is currently active
- `note`: Message shown when support is inactive

**Note:**
- Returns support information configured by admin
- If support is inactive (IsActive = false), all fields return null with a note
- Support information is managed by admin through admin APIs
- All fields are optional and may be null if not configured

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

---

## Example Usage for Support Link API

### Using cURL

#### Get Support Link
```bash
curl -X GET http://localhost:3100/users/support/link \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Get Support Link
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/support/link', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  if (data.data.isActive) {
    console.log('Support Link:', data.data.supportLink);
    console.log('Support Email:', data.data.supportEmail);
    console.log('Support Phone:', data.data.supportPhone);
    console.log('Support WhatsApp:', data.data.supportWhatsApp);
    console.log('Description:', data.data.description);
  } else {
    console.log('Support is currently unavailable');
  }
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Support Link System

- Support link API requires JWT token authentication
- Support information is managed by admin through admin APIs
- Users can access support link, email, phone, and WhatsApp
- Support can be activated/deactivated by admin
- If support is inactive, users see a message that support is unavailable
- All support fields are optional and may be null
- Support link must be a valid URL (validated by admin)
- Support email must be a valid email format (validated by admin)

---

## Newly Added / Updated User APIs

### GET /users/task-controls/public
Public API for task controls (no auth required).  
Useful for showing ads-control, limit-control, coin-control in app startup screens.

The `data` array includes one entry per controlled task type, including **`Quiz`** (quiz enable/disable, daily attempt limit, optional coin reward override, ads flag).

**Response (Success - 200):**
```json
{
  "message": "Task controls retrieved successfully",
  "data": [
    {
      "TaskType": "Captcha",
      "IsActive": true,
      "AdsEnabled": true,
      "DailyLimit": 20,
      "CoinsPerTask": 2
    },
    {
      "TaskType": "Quiz",
      "IsActive": true,
      "AdsEnabled": true,
      "DailyLimit": 15,
      "CoinsPerTask": 3
    },
    {
      "TaskType": "AppInstall",
      "IsActive": true,
      "AdsEnabled": false,
      "DailyLimit": 5,
      "CoinsPerTask": 50
    }
  ]
}
```

---

### GET /users/quiz/settings/public
Public endpoint for **quiz-only** configuration (no auth). Use when the app needs just quiz limits and on/off without loading all task controls.

**Fields:**
- `IsActive` — when `false`, treat the quiz feature as disabled in the client.
- `DailyLimit` — max quiz attempts per user per calendar day (integer), or `null` if admin did not set a limit (client may fall back to its own default or treat as unlimited).
- `AdsEnabled`, `CoinsPerTask` — same meaning as other task controls; optional for quiz UI/rewards.

**Response (Success - 200):**
```json
{
  "message": "Quiz settings retrieved successfully",
  "data": {
    "TaskType": "Quiz",
    "IsActive": true,
    "AdsEnabled": true,
    "DailyLimit": 15,
    "CoinsPerTask": 3
  }
}
```

---

### GET /users/quiz/settings
Authenticated version of quiz settings (same response shape as the public quiz endpoint).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### GET /users/task-controls
Authenticated version of task controls API.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### POST /users/captcha/solve (Updated)
Now respects centralized task controls:
- `IsActive` check
- `DailyLimit` override
- `CoinsPerTask` override
- response includes `adsEnabled`

---

### GET /users/dailyspin/status (Updated)
Now includes:
- admin-controlled daily limit override
- `isActive`
- `adsEnabled`

---

### POST /users/dailyspin/use (Updated)
Now respects:
- `IsActive` from task control
- admin `DailyLimit` override

---

### GET /users/scratchcard/dailylimit (Updated)
Now respects:
- `IsActive`
- admin `DailyLimit` override
- admin `CoinsPerTask` override
- response includes `adsEnabled`

---

### POST /users/scratchcard/dailylimit/claim (Updated)
Now respects:
- `IsActive`
- admin `DailyLimit` override
- admin `CoinsPerTask` override

---

### GET /users/apps (Updated)
Now supports AppInstall task control:
- if `IsActive=false`, returns empty app list
- `rewardCoins` can be overridden via `CoinsPerTask`
- response includes `taskControl`

---

### POST /users/apps/:appId/submit (Updated)
Now supports AppInstall task control:
- blocks submission if `IsActive=false`
- enforces admin `DailyLimit` for app submissions

---

## Ads Management User APIs

### GET /users/ads/settings/public
Public endpoint to get full ads configuration (no token required).

Use this for app startup/home screen to know:
- global ad enable/disable
- task-wise banner/rewarded/interstitial toggle
- per task frequency (after how many actions to show ad)

---

### GET /users/ads/settings
Authenticated version of ads settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### GET /users/ads/decision
Evaluate if ad should be shown now for a task based on action count.

**Query Params:**
- `taskType` (required): `Quiz | Captcha | DailySpin | ScratchCard | ScratchCardDailyLimit | AppInstall`
- `actionCount` (optional, default `0`)

**Example:**
```
GET /users/ads/decision?taskType=ScratchCard&actionCount=4
```

**Response (Success - 200):**
```json
{
  "message": "Ads decision evaluated successfully",
  "data": {
    "taskType": "ScratchCard",
    "actionCount": 4,
    "globalAdsEnabled": true,
    "bannerAdsEnabled": true,
    "rewardedAdsEnabled": true,
    "interstitialAdsEnabled": true,
    "taskActive": true,
    "decision": {
      "showBanner": true,
      "showRewarded": true,
      "showInterstitial": true,
      "shouldShowInterstitialNow": true,
      "shouldShowRewardedNow": false,
      "interstitialAfterCount": 2,
      "rewardedAfterCount": 3
    }
  }
}
```

---

## Withdrawal Daily Limit (User Side)

### GET /users/withdrawal/threshold (Updated)
Now also returns daily withdrawal request limit information and allowed denominations:
- `dailyWithdrawalRequestLimit`
- `requestsToday`
- `remainingRequestsToday`
- `denominations` — array of allowed withdrawal amounts (e.g. `[10, 20, 30, 50]`), configurable by admin
- `canWithdraw` (wallet + daily limit dono consider karta hai)

### POST /users/withdrawal/request (Updated)
Now enforces admin daily request limit (`1` or `2` per day) and validates Amount against allowed denominations from DB.

If invalid denomination:
```json
{
  "message": "Amount must be one of the allowed denominations: 10, 20, 30, 50"
}
```

If limit reached:
```json
{
  "message": "Daily withdrawal request limit reached. You can place only 1 withdrawal request(s) per day."
}
```

Success response now also includes:
- `requestsToday`
- `remainingRequestsToday`

### GET /users/withdrawal/requests (Updated)
Now also returns:
- `dailyWithdrawalRequestLimit`