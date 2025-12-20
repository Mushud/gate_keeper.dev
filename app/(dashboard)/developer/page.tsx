"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CodeIcon,
  Copy01Icon,
  BookOpen01Icon,
  LockPasswordIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ShieldIcon,
} from "@hugeicons/core-free-icons";

export default function DeveloperDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({
    code,
    id,
    language = "bash",
  }: {
    code: string;
    id: string;
    language?: string;
  }) => (
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
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={12}
                strokeWidth={1.5}
                className="mr-1"
              />
              Copied
            </>
          ) : (
            <>
              <HugeiconsIcon
                icon={Copy01Icon}
                size={12}
                strokeWidth={1.5}
                className="mr-1"
              />
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
          <HugeiconsIcon icon={BookOpen01Icon} size={32} strokeWidth={1.5} />
          Developer Documentation
        </h1>
        <p className="text-zinc-600 mt-2">
          Complete API reference for integrating OTP verification in your
          applications
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={20}
              strokeWidth={1.5}
              className="text-blue-600"
            />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
            <li>
              Create a project in the Projects section to get your API key
            </li>
            <li>Save your API key securely (it's only shown once)</li>
            <li>
              Use the API key in the{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">X-API-Key</code>{" "}
              header for all requests
            </li>
            <li>Ensure you have sufficient credits in your account balance</li>
          </ol>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={LockPasswordIcon}
              size={20}
              strokeWidth={1.5}
            />
            Authentication
          </CardTitle>
          <CardDescription>
            All API requests require authentication using your project API key
          </CardDescription>
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
          <CardDescription>
            Create and send an OTP to a phone number or email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Endpoint</h4>
            <code className="bg-zinc-100 px-3 py-2 rounded block text-sm">
              POST {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
              /api/generate_otp
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
            <h4 className="font-semibold text-sm mb-2">
              Success Response (200 OK)
            </h4>
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
              code={`curl -X POST ${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/generate_otp \\
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
              code={`const response = await fetch('${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/generate_otp', {
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

      {/* USSD Shortcode */}
      <Card className="mb-6 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={ShieldIcon}
              size={20}
              strokeWidth={1.5}
              className="text-purple-600"
            />
            USSD Shortcode for OTP Retrieval
          </CardTitle>
          <CardDescription className="text-purple-900">
            Users can retrieve their OTP via USSD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-purple-900">
            Users who request OTPs can dial the following USSD code to retrieve their OTP:
          </p>
          <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
            <code className="text-2xl font-bold text-purple-900">*713*882#</code>
          </div>
          <div className="space-y-2 text-sm text-purple-900">
            <p className="font-semibold">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>User dials <code className="bg-purple-100 px-1 py-0.5 rounded">*713*882#</code> on their phone</li>
              <li>System identifies the user by their phone number</li>
              <li>Most recent active OTP is displayed on screen</li>
              <li>User can enter the OTP in your application</li>
            </ol>
          </div>
          <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-300">
            <p className="text-xs text-purple-900">
              <strong>Note:</strong> This feature is particularly useful for users who may not receive SMS messages due to network issues or for those who prefer not to wait for SMS delivery.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verify OTP Endpoint */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>
            Validate the OTP code entered by the user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Endpoint</h4>
            <code className="bg-zinc-100 px-3 py-2 rounded block text-sm">
              POST {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
              /api/verify_otp
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
            <h4 className="font-semibold text-sm mb-2">
              Success Response (200 OK)
            </h4>
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
            <h4 className="font-semibold text-sm mb-2">
              Error Response (400 Bad Request)
            </h4>
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
              code={`curl -X POST ${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/verify_otp \\
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
              code={`const response = await fetch('${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
              }/api/verify_otp', {
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
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Store API Keys Securely
                </h4>
                <p className="text-sm text-zinc-600">
                  Never expose API keys in client-side code. Always make OTP
                  requests from your backend server.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Save the Reference ID
                </h4>
                <p className="text-sm text-zinc-600">
                  Store the reference returned from generate_otp. You'll need it
                  to verify the OTP later.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Handle Errors Gracefully
                </h4>
                <p className="text-sm text-zinc-600">
                  Check for insufficient balance, invalid phone numbers, and
                  rate limits. Show clear messages to users.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">OTP Expiration</h4>
                <p className="text-sm text-zinc-600">
                  OTPs expire after 10 minutes. Allow users to request a new OTP
                  if expired.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">Rate Limiting</h4>
                <p className="text-sm text-zinc-600">
                  The API has built-in rate limiting to prevent abuse. Implement
                  exponential backoff for retries.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Name Auto-Resolution
                </h4>
                <p className="text-sm text-zinc-600">
                  The API automatically resolves user names from phone numbers
                  when available, making signup flows smoother.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  USSD Alternative
                </h4>
                <p className="text-sm text-zinc-600">
                  Inform users they can retrieve their OTP by dialing <code className="bg-zinc-100 px-1 py-0.5 rounded">*713*882#</code> if they don't receive the SMS or prefer an alternative method.
                </p>
              </div>
            </div>
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
            If you encounter any issues or have questions about the API, please
            reach out:
          </p>
          <div className="flex gap-4">
            <Button variant="outline">View Projects</Button>
            <Button variant="outline">Check Logs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
