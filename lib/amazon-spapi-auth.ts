import { createHash, createHmac } from 'crypto';

// Amazon SP-API OAuth and Request Utilities
export function getAmazonAuthUrl() {
  const clientId = process.env.AMAZON_CLIENT_ID!;
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/amazon/callback`);
  const state = Math.random().toString(36).substring(2, 15);
  
  return `https://sellercentral.amazon.co.jp/apps/authorize/consent?application_id=${clientId}&state=${state}&redirect_uri=${redirectUri}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/amazon/callback`,
    }),
  });

  return response.json();
}

export async function getAccessTokenFromRefreshToken(refreshToken: string) {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  });

  return response.json();
}

// AWS Signature V4 for SP-API requests
export function createAWSSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: string = ''
) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
  const region = 'us-east-1'; // SP-API uses us-east-1
  const service = 'execute-api';
  
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname + urlObj.search;
  
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  
  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('');
  
  const signedHeaders = Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort()
    .join(';');
  
  const payloadHash = createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timeStamp,
    credentialScope,
    createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // Calculate signature
  const kDate = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate as any).update(region).digest();
  const kService = createHmac('sha256', kRegion as any).update(service).digest();
  const kSigning = createHmac('sha256', kService as any).update('aws4_request').digest();
  const signature = createHmac('sha256', kSigning as any).update(stringToSign).digest('hex');
  
  // Create authorization header
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'Authorization': authorization,
    'X-Amz-Date': timeStamp
  };
}
