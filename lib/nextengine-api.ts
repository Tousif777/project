import { cookies } from 'next/headers';

const BASE_URL = 'https://api.next-engine.org';

interface AccessTokenResponse {
  result: string;
  access_token: string;
  refresh_token: string;
  company_ne_id: string;
  company_name: string;
  uid: string;
  pic_ne_id: string;
  pic_name: string;
  pic_mail_address: string;
}

// Token storage - in production, use database or secure storage
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Get access token using the Next Engine OAuth flow
 * Note: This requires uid and state from the OAuth authorization process
 */
async function getAccessToken(clientId: string, clientSecret: string, uid?: string, state?: string): Promise<string> {
  if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return accessToken;
  }

  // If we have a refresh token, try to refresh first
  if (refreshToken) {
    console.log('Attempting to refresh Next Engine access token...');
    try {
      const refreshed = await refreshAccessToken(clientId, clientSecret, refreshToken);
      if (refreshed) {
        return accessToken!;
      }
    } catch (error) {
      console.warn('Token refresh failed, will need new authorization:', error);
    }
  }

  // If no uid/state provided, we cannot get a new token without user authorization
  if (!uid || !state) {
    throw new Error('Next Engine requires OAuth authorization. Please implement the OAuth flow: 1) Redirect user to get uid/state, 2) Use uid/state to get access_token');
  }

  console.log('Requesting new Next Engine access token...');
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('uid', uid);
  params.append('state', state);

  const response = await fetch(`${BASE_URL}/api_neauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get access token from Next Engine: ${response.status} ${errorBody}`);
  }

  const data: AccessTokenResponse = await response.json();
  
  if (data.result !== 'success' || !data.access_token) {
    throw new Error('Failed to get access token from Next Engine: ' + JSON.stringify(data));
  }

  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  // Access token expires in 1 day according to documentation
  tokenExpiryTime = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000); // 23 hours 55 minutes

  console.log('Successfully obtained new Next Engine access token.');
  return accessToken;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<boolean> {
  try {
    console.log('Refreshing Next Engine access token...');
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);

    const response = await fetch(`${BASE_URL}/api_neauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data: AccessTokenResponse = await response.json();
    
    if (data.result !== 'success' || !data.access_token) {
      throw new Error('Refresh response invalid');
    }

    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    tokenExpiryTime = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000);

    console.log('Successfully refreshed Next Engine access token.');
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Make authenticated API calls to Next Engine
 */
export async function fetchNextEngineData(
  clientId: string, 
  clientSecret: string, 
  endpoint: string, 
  params: Record<string, any> = {},
  uid?: string,
  state?: string,
  cookieTokens?: { accessToken?: string; refreshToken?: string }
) {
  // Use provided tokens from cookies if available, otherwise use in-memory tokens
  let useAccessToken = cookieTokens?.accessToken || accessToken;
  let useRefreshToken = cookieTokens?.refreshToken || refreshToken;

  // If no tokens available and no uid/state provided, throw error
  if (!useAccessToken && (!uid || !state)) {
    throw new Error('Next Engine requires OAuth authorization. Please implement the OAuth flow: 1) Redirect user to get uid/state, 2) Use uid/state to get access_token');
  }

  // If no access token but we have uid/state, get new token
  if (!useAccessToken && uid && state) {
    const token = await getAccessToken(clientId, clientSecret, uid, state);
    useAccessToken = token;
    useRefreshToken = refreshToken; // refreshToken is set by getAccessToken
  }

  // Ensure we have a valid access token
  if (!useAccessToken) {
    throw new Error('Next Engine authentication failed: No valid access token available');
  }

  // Add access_token and refresh_token to params for automatic token refresh
  const allParams = { 
    ...params, 
    access_token: useAccessToken,
    ...(useRefreshToken && { refresh_token: useRefreshToken })
  };
  const body = new URLSearchParams(allParams);
  const url = `${BASE_URL}/${endpoint}`;

  console.log(`Fetching data from Next Engine endpoint: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  console.log(`Next Engine API response status: ${response.status}`);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Next Engine API error response:`, errorBody);
    throw new Error(`Next Engine API request to ${endpoint} failed: ${response.status} ${errorBody}`);
  }

  // Check if response has content
  const responseText = await response.text();
  console.log(`Next Engine API response text length: ${responseText.length}`);
  
  if (!responseText || responseText.trim() === '') {
    throw new Error(`Next Engine API returned empty response for endpoint: ${endpoint}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Next Engine API response:', responseText);
    throw new Error(`Invalid JSON response from Next Engine API: ${parseError}`);
  }
  
  if (result.result === 'error') {
    throw new Error(`Next Engine API returned an error: ${result.message || JSON.stringify(result)}`);
  }

  // Check if tokens were refreshed and update them (both in-memory and return new ones)
  if (result.access_token && result.refresh_token) {
    console.log('Next Engine tokens were refreshed automatically');
    accessToken = result.access_token;
    refreshToken = result.refresh_token;
    tokenExpiryTime = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000);
  }

  return result;
}

/**
 * Initialize OAuth flow - redirect user to get uid and state
 */
export function getOAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri
  });
  
  return `https://base.next-engine.org/users/sign_in?${params}`;
}

/**
 * Store OAuth tokens (implement secure storage in production)
 */
export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  tokenExpiryTime = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000);
}

/**
 * Get current token status
 */
export function getTokenStatus() {
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    isExpired: tokenExpiryTime ? Date.now() >= tokenExpiryTime : true,
    expiresAt: tokenExpiryTime ? new Date(tokenExpiryTime).toISOString() : null
  };
}

/**
 * Get tokens from cookies (for server-side usage)
 */
export async function getTokensFromCookies() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('ne_access_token')?.value;
    const refreshToken = cookieStore.get('ne_refresh_token')?.value;
    const userInfo = cookieStore.get('ne_user_info')?.value;
    
    return {
      accessToken,
      refreshToken,
      userInfo: userInfo ? JSON.parse(userInfo) : null
    };
  } catch (error) {
    console.error('Error reading tokens from cookies:', error);
    return { accessToken: null, refreshToken: null, userInfo: null };
  }
}

/**
 * Check if user is authenticated with Next Engine
 */
export async function isNextEngineAuthenticated() {
  const { accessToken } = await getTokensFromCookies();
  return !!accessToken;
}

/**
 * Make authenticated API calls using cookies
 */
export async function fetchNextEngineDataWithCookies(
  endpoint: string, 
  params: Record<string, any> = {}
) {
  const { accessToken, refreshToken } = await getTokensFromCookies();
  
  if (!accessToken) {
    throw new Error('No Next Engine access token available. User needs to authorize.');
  }

  const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
  const clientSecret = process.env.NEXT_ENGINE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Next Engine credentials not configured');
  }

  // Add access_token and refresh_token to params for automatic token refresh
  const allParams = { 
    ...params, 
    access_token: accessToken,
    ...(refreshToken && { refresh_token: refreshToken })
  };
  const body = new URLSearchParams(allParams);
  const url = `${BASE_URL}/${endpoint}`;

  console.log(`Fetching data from Next Engine endpoint: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Next Engine API request to ${endpoint} failed: ${response.status} ${errorBody}`);
  }

  const result = await response.json();
  
  if (result.result === 'error') {
    throw new Error(`Next Engine API returned an error: ${result.message || JSON.stringify(result)}`);
  }

  // Note: Token refresh via cookies would require a different approach
  // In production, consider using a database to store and update tokens
  
  return result.data || result;
}
