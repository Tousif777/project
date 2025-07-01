// Test script for Next Engine integration
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { testNextEngineConnection } from '../lib/integrations/nextEngine';
import { getOAuthUrl, getTokenStatus } from '../lib/nextengine-api';

async function testNextEngineIntegration() {
  console.log('🚀 Testing Next Engine Integration...\n');

  // Debug: Log environment variables (without showing sensitive data)
  console.log('Environment check:');
  console.log('- CLIENT_ID exists:', !!process.env.NEXT_ENGINE_CLIENT_ID);
  console.log('- CLIENT_SECRET exists:', !!process.env.NEXT_ENGINE_CLIENT_SECRET);
  console.log('- CLIENT_ID length:', process.env.NEXT_ENGINE_CLIENT_ID?.length || 0);
  console.log('- CLIENT_SECRET length:', process.env.NEXT_ENGINE_CLIENT_SECRET?.length || 0);
  console.log();

  // Test 1: Credentials validation
  console.log('1. Testing credentials format...');
  try {
    const connectionResult = await testNextEngineConnection({
      clientId: process.env.NEXT_ENGINE_CLIENT_ID || '',
      clientSecret: process.env.NEXT_ENGINE_CLIENT_SECRET || '',
      environment: 'production'
    });
    
    if (connectionResult.success) {
      console.log('✅ Credentials validation passed');
      console.log('Details:', connectionResult.details);
    } else {
      console.log('❌ Credentials validation failed:', connectionResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Credentials test error:', error);
    return;
  }

  // Test 2: OAuth URL generation
  console.log('\n2. Testing OAuth URL generation...');
  try {
    const clientId = process.env.NEXT_ENGINE_CLIENT_ID || '';
    const redirectUri = 'http://localhost:3000/api/auth/nextengine/callback'; // Example redirect URI
    
    const oauthUrl = getOAuthUrl(clientId, redirectUri);
    console.log('✅ OAuth URL generated successfully');
    console.log('OAuth URL:', oauthUrl);
    console.log();
    console.log('To complete the OAuth flow:');
    console.log('1. Redirect user to the OAuth URL above');
    console.log('2. Handle callback with uid and state parameters');
    console.log('3. Exchange uid/state for access_token');
    console.log();
  } catch (error) {
    console.log('❌ OAuth URL generation error:', error);
  }

  // Test 3: Token status check
  console.log('\n3. Checking current token status...');
  try {
    const tokenStatus = getTokenStatus();
    console.log('Token Status:', tokenStatus);
    
    if (!tokenStatus.hasAccessToken) {
      console.log('ℹ️  No access token available. OAuth authorization required.');
    } else if (tokenStatus.isExpired) {
      console.log('⚠️  Access token is expired. Refresh needed.');
    } else {
      console.log('✅ Valid access token available');
    }
  } catch (error) {
    console.log('❌ Token status check error:', error);
  }

  console.log('\n📝 Next Steps for Implementation:');
  console.log('1. Set up OAuth callback route: /api/auth/nextengine/callback');
  console.log('2. Implement user authorization flow in your application');
  console.log('3. Store access_token and refresh_token securely (database recommended)');
  console.log('4. Test real API calls with valid tokens');
  console.log();
  console.log('Note: Real data fetching requires completing the OAuth flow first.');
  console.log('The integration is ready but needs user authorization to access Next Engine data.');
}

// Run the test
testNextEngineIntegration().catch(console.error);
