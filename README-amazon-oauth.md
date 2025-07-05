# Amazon SP-API OAuth Setup Guide

## 1. Get the Authorization URL
- Make a GET request to `/api/amazon/auth-url` (or open it in your browser).
- The response will contain a URL. Open this URL in your browser.

## 2. Authorize the App
- Log in to Amazon Seller Central if prompted.
- Approve the app.
- You will be redirected to `/api/amazon/callback` with a code in the URL.

## 3. Get the Refresh Token
- The callback endpoint will exchange the code for a refresh token and return it as JSON.
- Copy the `refresh_token` value.

## 4. Store the Refresh Token
- Add the following line to your `.env.local`:

```
AMAZON_REFRESH_TOKEN=your-refresh-token-here
```

---

## Example: .env.local (after setup)

```
AMAZON_CLIENT_ID=...
AMAZON_CLIENT_SECRET=...
AMAZON_SELLER_ID=...
AMAZON_MARKETPLACE_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AMAZON_REFRESH_TOKEN=...
```

---

## Notes
- Never share your refresh token or credentials publicly.
- You can now use the refresh token to obtain access tokens and make SP-API requests.
