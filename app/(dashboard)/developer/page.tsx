'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiCode, FiCopy, FiBook, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function DeveloperDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'bash' }: { code: string; id: string; language?: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 font-medium">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyToClipboard(code, id)}
          className="h-7"
        >
          {copiedId === id ? (
            <>
              <FiCheckCircle className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <FiCopy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto">
        {code}
      </pre>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
          <FiBook className="w-8 h-8" />
          Developer Documentation
        </h1>
        <p className="text-zinc-600 mt-2">
          Complete API reference for integrating OTP verification in your applications
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-blue-600" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
            <li>Create a project in the Projects section to get your API key</li>
            <li>Save your API key securely (it's only shown once)</li>
            <li>Use the API key in the <code className="bg-blue-100 px-1 py-0.5 rounded">X-API-Key</code> header for all requests</li>
            <li>Ensure you have sufficient credits in your account balance</li>
          </ol>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiLock className="w-5 h-5" />
            Authentication
          </CardTitle>
          <CardDescription>All API requests require authentication using your project API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-700">
            Include your project API key in the request headers:
          </p>
          <CodeBlock
            id="auth-header"
            language="HTTP Headers"
            code="X-API-Key: your-project-api-key-here"
          />
        </CardContent>
      </Card>

      {/* Generate OTP Endpoint */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate OTP</CardTitle>
          <CardDescription>Create and send an OTP to a phone number or email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Endpoint</h4>
            <code className="bg-zinc-100 px-3 py-2 rounded block text-sm">
              POST {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/generate_otp
            </code>
          </div>

          {/* Headers */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Headers</h4>
            <CodeBlock
              id="gen-headers"
              code={`X-API-Key: your-project-api-key
Content-Type: application/json`}
            />
          </div>

          {/* Request Body */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Request Body</h4>
            <CodeBlock
              id="gen-body"
              language="JSON"
              code={`{
  "project": "your-project-id",
  "phoneNumber": "+233241234567",  // For SMS OTP
  "email": "user@example.com",     // For Email OTP (optional)
  "size": 6,                        // OTP length (default: 4, max: 10)
  "extra": {                        // Optional metadata
    "userId": "12345",
    "purpose": "login"
  }
}`}
            />
          </div>

          {/* Response */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Success Response (200 OK)</h4>
            <CodeBlock
              id="gen-response"
              language="JSON"
              code={`{
  "message": "OTP generated successfully",
  "reference": "550e8400-e29b-41d4-a716-446655440000",
  "receiver": "+233241234567",
  "name": "John Doe",               // Auto-resolved if available
  "type": "phone",                  // "phone", "email", or "mixed"
  "expiresAt": "2025-12-13T12:10:00.000Z",
  "otp": "123456"                   // Only in development mode
}`}
            />
          </div>

          {/* cURL Example */}
          <div>
            <h4 className="font-semibold text-sm mb-2">cURL Example</h4>
            <CodeBlock
              id="gen-curl"
              language="bash"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/generate_otp \\
  -H "X-API-Key: your-project-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "your-project-id",
    "phoneNumber": "+233241234567",
    "size": 6
  }'`}
            />
          </div>

          {/* JavaScript Example */}
          <div>
            <h4 className="font-semibold text-sm mb-2">JavaScript Example</h4>
            <CodeBlock
              id="gen-js"
              language="JavaScript"
              code={`const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/generate_otp', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-project-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'your-project-id',
    phoneNumber: '+233241234567',
    size: 6
  })
});

const data = await response.json();
console.log('OTP Reference:', data.reference);
// Store the reference to verify later`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Verify OTP Endpoint */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Validate the OTP code entered by the user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Endpoint</h4>
            <code className="bg-zinc-100 px-3 py-2 rounded block text-sm">
              POST {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/verify_otp
            </code>
          </div>

          {/* Headers */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Headers</h4>
            <CodeBlock
              id="verify-headers"
              code={`X-API-Key: your-project-api-key
Content-Type: application/json`}
            />
          </div>

          {/* Request Body */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Request Body</h4>
            <CodeBlock
              id="verify-body"
              language="JSON"
              code={`{
  "reference": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456"
}`}
            />
          </div>

          {/* Response */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Success Response (200 OK)</h4>
            <CodeBlock
              id="verify-response"
              language="JSON"
              code={`{
  "message": "OTP verified successfully",
  "reference": "550e8400-e29b-41d4-a716-446655440000",
  "receiver": "+233241234567",
  "name": "John Doe",
  "verified": true
}`}
            />
          </div>

          {/* Error Response */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Error Response (400 Bad Request)</h4>
            <CodeBlock
              id="verify-error"
              language="JSON"
              code={`{
  "error": "Invalid OTP code",
  "message": "OTP verification failed",
  "attemptsRemaining": 2
}`}
            />
          </div>

          {/* cURL Example */}
          <div>
            <h4 className="font-semibold text-sm mb-2">cURL Example</h4>
            <CodeBlock
              id="verify-curl"
              language="bash"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/verify_otp \\
  -H "X-API-Key: your-project-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference": "550e8400-e29b-41d4-a716-446655440000",
    "otp": "123456"
  }'`}
            />
          </div>

          {/* JavaScript Example */}
          <div>
            <h4 className="font-semibold text-sm mb-2">JavaScript Example</h4>
            <CodeBlock
              id="verify-js"
              language="JavaScript"
              code={`const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/verify_otp', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-project-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reference: otpReference,  // From generate_otp response
    otp: userEnteredOTP       // From user input
  })
});

const data = await response.json();
if (data.verified) {
  console.log('User verified:', data.name);
  // Proceed with login/signup
} else {
  console.error('Verification failed');
}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Store API Keys Securely</h4>
                <p className="text-sm text-zinc-600">
                  Never expose API keys in client-side code. Always make OTP requests from your backend server.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Save the Reference ID</h4>
                <p className="text-sm text-zinc-600">
                  Store the reference returned from generate_otp. You'll need it to verify the OTP later.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Handle Errors Gracefully</h4>
                <p className="text-sm text-zinc-600">
                  Check for insufficient balance, invalid phone numbers, and rate limits. Show clear messages to users.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">OTP Expiration</h4>
                <p className="text-sm text-zinc-600">
                  OTPs expire after 10 minutes. Allow users to request a new OTP if expired.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Rate Limiting</h4>
                <p className="text-sm text-zinc-600">
                  The API has built-in rate limiting to prevent abuse. Implement exponential backoff for retries.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Name Auto-Resolution</h4>
                <p className="text-sm text-zinc-600">
                  The API automatically resolves user names from phone numbers when available, making signup flows smoother.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Common Error Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-3">Code</th>
                  <th className="text-left py-2 px-3">Error</th>
                  <th className="text-left py-2 px-3">Solution</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 px-3 font-mono">401</td>
                  <td className="py-2 px-3">Invalid API Key</td>
                  <td className="py-2 px-3">Check your X-API-Key header</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">402</td>
                  <td className="py-2 px-3">Insufficient Balance</td>
                  <td className="py-2 px-3">Purchase credits in Billing section</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">400</td>
                  <td className="py-2 px-3">Invalid OTP Code</td>
                  <td className="py-2 px-3">User entered wrong code</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">404</td>
                  <td className="py-2 px-3">Reference Not Found</td>
                  <td className="py-2 px-3">OTP expired or invalid reference</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">429</td>
                  <td className="py-2 px-3">Too Many Requests</td>
                  <td className="py-2 px-3">Rate limit exceeded, wait before retry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 mb-4">
            If you encounter any issues or have questions about the API, please reach out:
          </p>
          <div className="flex gap-4">
            <Button variant="outline">
              View Projects
            </Button>
            <Button variant="outline">
              Check Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
