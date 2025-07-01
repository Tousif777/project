import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || 'http://localhost:3000/api/auth/nextengine/callback';
  
  const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
  
  if (!clientId) {
    return new Response(`
      <html>
        <body>
          <h1>Error: Next Engine Client ID not configured</h1>
          <p>Please set NEXT_ENGINE_CLIENT_ID in your .env.local file</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }

  const oauthUrl = `https://base.next-engine.org/users/sign_in/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return new Response(`
    <html>
      <head>
        <title>Next Engine OAuth Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .info { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .error { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .success { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          pre { background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Next Engine OAuth Configuration Test</h1>
        
        <div class="info">
          <h3>Current Configuration:</h3>
          <p><strong>Client ID:</strong> ${clientId}</p>
          <p><strong>Redirect URI:</strong> ${redirectUri}</p>
          <p><strong>OAuth URL:</strong></p>
          <pre>${oauthUrl}</pre>
        </div>

        <div class="error">
          <h3>Common Issues & Solutions:</h3>
          <ol>
            <li><strong>Redirect URI Mismatch:</strong> The redirect_uri must match exactly in your Next Engine app settings</li>
            <li><strong>App Not Published:</strong> Your Next Engine app must be published/approved</li>
            <li><strong>Wrong Environment:</strong> Make sure you're using the correct client_id (test vs production)</li>
          </ol>
        </div>

        <div class="success">
          <h3>Test Different Redirect URIs:</h3>
          <p>Try these common redirect URI patterns:</p>
          <a href="?redirect_uri=http://localhost:3000/callback" class="button">Test: /callback</a>
          <a href="?redirect_uri=http://localhost:3000/auth/callback" class="button">Test: /auth/callback</a>
          <a href="?redirect_uri=http://localhost:3000/api/auth/nextengine/callback" class="button">Test: /api/auth/nextengine/callback</a>
        </div>

        <h3>Test Authorization:</h3>
        <a href="${oauthUrl}" class="button" target="_blank">🚀 Try Next Engine Authorization</a>
        
        <div class="info">
          <h3>Instructions:</h3>
          <ol>
            <li>Click the "Try Next Engine Authorization" button above</li>
            <li>If you get an error, try the different redirect URI patterns</li>
            <li>Update your Next Engine app settings to match the working redirect URI</li>
            <li>Once working, update your application to use the correct redirect URI</li>
          </ol>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
