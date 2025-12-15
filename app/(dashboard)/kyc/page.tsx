"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FiShield,
  FiPhone,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiCopy,
  FiBook,
  FiCode,
} from "react-icons/fi";
import { useAuth } from "@/lib/auth";

interface VerificationResult {
  phoneNumber: string;
  name: string | null;
  status: "success" | "not_found" | "failed";
  creditDeducted: number;
  remainingBalance: number;
  verificationId: string;
  timestamp: string;
}

interface HistoryItem {
  _id: string;
  phoneNumber: string;
  resolvedName: string | null;
  status: string;
  creditDeducted: number;
  createdAt: string;
}

export default function KYCVerificationPage() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
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

  // Load saved API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("kyc_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/verify-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      setResult(data.data);

      // Save API key to localStorage
      localStorage.setItem("kyc_api_key", apiKey.trim());

      // Refresh history
      loadHistory();

      // Clear phone number input
      setPhoneNumber("");
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!apiKey.trim()) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/history?limit=20&page=1`,
        {
          headers: {
            "x-api-key": apiKey.trim(),
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setHistory(data.data.verifications);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (apiKey.trim()) {
      loadHistory();
    }
  }, [apiKey]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50";
      case "not_found":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-zinc-600 bg-zinc-50";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
          <FiShield className="w-8 h-8 text-blue-600" />
          KYC Phone Verification
        </h1>
        <p className="text-zinc-600 mt-2">
          Verify phone numbers and resolve registered names. Each verification
          costs 1 credit.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Verification Form and History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPhone className="w-5 h-5" />
                Verify Phone Number
              </CardTitle>
              <CardDescription>
                Enter a Ghanaian phone number to resolve the registered name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyPhone} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="text"
                    placeholder="gk_live_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500">
                    Get your API key from the Projects page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    placeholder="0551234567 or +233551234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500">
                    Supports formats: 0551234567 or +233551234567
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    className={`p-4 border rounded-lg ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200"
                        : result.status === "not_found"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.status === "success" ? (
                        <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 mb-2">
                          {result.status === "success"
                            ? "Verification Successful"
                            : "Name Not Found"}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-700">
                              {result.phoneNumber}
                            </span>
                          </div>
                          {result.name && (
                            <div className="flex items-center gap-2">
                              <FiUser className="w-4 h-4 text-zinc-500" />
                              <span className="text-zinc-900 font-medium">
                                {result.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !apiKey.trim() || !phoneNumber.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FiSearch className="w-4 h-4 mr-2" />
                      Verify Phone Number
                    </>
                  )}
                </Button>

                <div className="text-xs text-zinc-500 text-center">
                  Each verification costs 1 credit
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Verification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiClock className="w-5 h-5" />
                Recent Verifications
              </CardTitle>
              <CardDescription>
                Your verification history (last 20 records)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <FiClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No verification history yet</p>
                  <p className="text-xs mt-1">
                    Verify a phone number to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-zinc-900 mb-1">
                            {item.phoneNumber}
                          </div>
                          {item.resolvedName ? (
                            <div className="text-sm font-medium text-zinc-700 mb-1">
                              {item.resolvedName}
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500 mb-1 italic">
                              Name not found
                            </div>
                          )}
                          <div className="text-xs text-zinc-500">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - API Documentation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiBook className="w-5 h-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Integrate KYC verification into your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Verify Phone Number
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify a Ghanaian phone number and get the registered name.
                  Costs 1 credit per verification.
                </p>
                <CodeBlock
                  id="kyc-verify"
                  language="bash"
                  code={`curl -X POST https://api.gatekeeperpro.live/api/kyc/verify-phone \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "phoneNumber": "0551234567"
  }'`}
                />
                <div className="mt-3 p-3 bg-zinc-50 rounded-lg">
                  <p className="text-xs font-semibold text-zinc-700 mb-2">
                    Response:
                  </p>
                  <pre className="text-xs text-zinc-600 overflow-x-auto">
                    {`{
  "success": true,
  "data": {
    "phoneNumber": "+233551234567",
    "name": "John Doe",
    "status": "success",
    "verificationId": "65abc...",
    "timestamp": "2025-12-15T10:30:00Z"
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3">
                  Phone Number Format
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-zinc-600">Supports both formats:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-600 ml-2">
                    <li>
                      <code className="bg-zinc-100 px-1 py-0.5 rounded">
                        0551234567
                      </code>{" "}
                      - Local format
                    </li>
                    <li>
                      <code className="bg-zinc-100 px-1 py-0.5 rounded">
                        +233551234567
                      </code>{" "}
                      - International format
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3">Status Codes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      success
                    </span>
                    <span className="text-zinc-600">
                      Name found and returned
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                      not_found
                    </span>
                    <span className="text-zinc-600">
                      Number is valid but name not registered
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      failed
                    </span>
                    <span className="text-zinc-600">
                      Verification failed due to an error
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Each verification deducts 1 credit
                    regardless of whether a name is found. Requires only API key
                    (no project ID needed).
                  </span>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3">Error Codes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                      401
                    </code>
                    <div>
                      <p className="font-medium text-zinc-900">
                        Invalid API Key
                      </p>
                      <p className="text-zinc-600">
                        Check your X-API-Key header
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                      402
                    </code>
                    <div>
                      <p className="font-medium text-zinc-900">
                        Insufficient Balance
                      </p>
                      <p className="text-zinc-600">
                        Purchase credits in Billing section
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                      400
                    </code>
                    <div>
                      <p className="font-medium text-zinc-900">
                        Invalid Phone Format
                      </p>
                      <p className="text-zinc-600">
                        Must be valid Ghanaian phone number
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 mt-6 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FiShield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Secure Verification
                </h3>
                <p className="text-sm text-blue-700">
                  All verifications are processed securely and logged for your
                  records
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Ghana Numbers
                </h3>
                <p className="text-sm text-green-700">
                  Supports all major Ghanaian mobile networks (MTN, Vodafone,
                  AirtelTigo)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FiUser className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">
                  Name Resolution
                </h3>
                <p className="text-sm text-purple-700">
                  Get the registered name associated with any valid phone number
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
