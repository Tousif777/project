# Next Engine OAuth Authorization Flow - Implementation Guide

## 🚀 Quick Start

### 1. Set Environment Variables
Make sure your `.env.local` file contains:
```bash
NEXT_ENGINE_CLIENT_ID=your_client_id_here
NEXT_ENGINE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000  # Your app URL
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Navigate to Dashboard
Open http://localhost:3000/dashboard

### 4. Authorize Next Engine
1. Click "Authorize Next Engine Access" button
2. You'll be redirected to Next Engine login
3. Login with your Next Engine credentials
4. Grant permission to the application
5. You'll be redirected back to your dashboard

## 🔧 Implementation Details

### Files Created/Modified:

#### API Routes:
- `/app/api/auth/nextengine/callback/route.ts` - Handles OAuth callback
- `/app/api/auth/nextengine/oauth/route.ts` - Initiates OAuth flow
- `/app/api/auth/nextengine/status/route.ts` - Check auth status
- `/app/api/nextengine/test/route.ts` - Test API calls

#### Components:
- `/components/nextengine/NextEngineAuth.tsx` - Authorization UI component

#### Updated Files:
- `/lib/nextengine-api.ts` - Added cookie-based token management
- `/lib/integrations/nextEngine.ts` - Updated to use cookie authentication
- `/app/dashboard/page.tsx` - Added auth component

## 🧪 Testing the Integration

### Test API Calls
After authorization, test the integration:

```bash
# Test sales data
curl http://localhost:3000/api/nextengine/test?type=sales

# Test inventory data
curl http://localhost:3000/api/nextengine/test?type=inventory
```

### Test Frontend
Visit the dashboard and verify:
- ✅ Auth component shows "Next Engine Connected"
- ✅ Company and user info displayed
- ✅ No authentication errors

## 🔄 OAuth Flow Explained

1. **User clicks "Authorize"** → POST `/api/auth/nextengine/oauth`
2. **Redirect to Next Engine** → `https://base.next-engine.org/users/sign_in?client_id=...`
3. **User logs in and grants permission** → Next Engine redirects back
4. **Callback handled** → GET `/api/auth/nextengine/callback?uid=...&state=...`
5. **Exchange for tokens** → POST to `https://api.next-engine.org/api_neauth`
6. **Store tokens in cookies** → Secure httpOnly cookies
7. **Redirect to dashboard** → User sees success state

## 🔒 Security Features

- **HttpOnly cookies** - Tokens not accessible via JavaScript
- **Secure cookies** - HTTPS only in production
- **Token expiry** - Access token (1 day), Refresh token (3 days)
- **Automatic refresh** - Tokens refreshed during API calls

## 🎯 Usage in Your Code

### Check Authentication Status:
```typescript
import { isNextEngineAuthenticated } from '@/lib/nextengine-api';

const isAuth = await isNextEngineAuthenticated();
```

### Fetch Next Engine Data:
```typescript
import { getNextEngineData } from '@/lib/integrations/nextEngine';

// This will automatically use stored cookies
const salesData = await getNextEngineData('sales');
const inventoryData = await getNextEngineData('inventory');
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Authentication required" error**
   - User needs to authorize first
   - Check cookies are being set/read correctly

2. **Redirect URI mismatch**
   - Verify NEXTAUTH_URL environment variable
   - Check Next Engine app settings match redirect URI

3. **Invalid client credentials**
   - Verify CLIENT_ID and CLIENT_SECRET
   - Ensure credentials are for correct environment (test/production)

### Debug Mode:
Check browser console and server logs for detailed error messages.

## 📝 Next Steps

1. **Database Storage**: Replace cookie storage with database for production
2. **Error Handling**: Add comprehensive error handling and retry logic
3. **User Management**: Link tokens to specific users in your system
4. **Monitoring**: Add logging and monitoring for API calls
5. **Rate Limiting**: Implement rate limiting for API calls

## ✅ Verification Checklist

- [ ] Environment variables set correctly
- [ ] OAuth callback route accessible
- [ ] Dashboard shows auth component
- [ ] Successful authorization flow
- [ ] API test routes working
- [ ] Tokens stored and retrieved correctly
- [ ] Real Next Engine data accessible

The OAuth flow is now fully implemented and ready for use!
