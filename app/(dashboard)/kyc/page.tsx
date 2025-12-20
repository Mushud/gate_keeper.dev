"use client";

import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldIcon,
  SmartPhone01Icon,
  User02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Clock01Icon,
  Search01Icon,
  Copy01Icon,
  BookOpen01Icon,
  IdentificationIcon,
  UserIdVerificationIcon,
  Wallet01Icon,
  BankIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "@/lib/auth";

interface VerificationResult {
  phoneNumber?: string;
  idNumber?: string;
  name: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  status: "success" | "not_found" | "failed";
  creditDeducted: number;
  remainingBalance?: number;
  verificationId: string;
  timestamp: string;
}

interface HistoryItem {
  _id: string;
  verificationType: string;
  phoneNumber?: string;
  idNumber?: string;
  resolvedName: string | null;
  status: string;
  creditDeducted: number;
  createdAt: string;
  metadata?: any;
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
  const [activeTab, setActiveTab] = useState("phone");

  // Ghana Card Normal states
  const [ghanaCardId, setGhanaCardId] = useState("");
  const [surname, setSurname] = useState("");
  const [firstnames, setFirstnames] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Ghana Card Enhanced states
  const [enhancedCardId, setEnhancedCardId] = useState("");
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile Money states
  const [momoPhoneNumber, setMomoPhoneNumber] = useState("");
  const [momoChannel, setMomoChannel] = useState("");

  // Bank Account states
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");

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

  const handleVerifyGhanaCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (
      !ghanaCardId.trim() ||
      !surname.trim() ||
      !firstnames.trim() ||
      !gender.trim() ||
      !dateOfBirth.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/verify-ghanacard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            idNumber: ghanaCardId.trim(),
            surname: surname.trim(),
            firstnames: firstnames.trim(),
            gender: gender.trim(),
            dateOfBirth: dateOfBirth.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      setResult(data.data);
      localStorage.setItem("kyc_api_key", apiKey.trim());
      loadHistory();

      // Clear form
      setGhanaCardId("");
      setSurname("");
      setFirstnames("");
      setGender("");
      setDateOfBirth("");
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyGhanaCardEnhanced = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!enhancedCardId.trim() || !cardImage) {
      setError("Please provide ID number and card image");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(cardImage);

      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const base64Data = base64Image.split(",")[1]; // Remove data:image/jpeg;base64, prefix

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/verify-ghanacard-enhanced`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey.trim(),
              },
              body: JSON.stringify({
                idNumber: enhancedCardId.trim(),
                base64Image: base64Data,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || data.error || "Verification failed"
            );
          }

          setResult(data.data);
          localStorage.setItem("kyc_api_key", apiKey.trim());
          loadHistory();

          // Clear form
          setEnhancedCardId("");
          setCardImage(null);
          setImagePreview(null);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (err: any) {
          setError(err.message || "An error occurred during verification");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read image file");
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
      setLoading(false);
    }
  };

  const handleVerifyMobileMoney = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!momoPhoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!momoChannel) {
      setError("Please select a mobile money channel");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/verify-momo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            phoneNumber: momoPhoneNumber.trim(),
            channel: momoChannel,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      setResult(data.data);
      localStorage.setItem("kyc_api_key", apiKey.trim());
      loadHistory();

      // Clear form
      setMomoPhoneNumber("");
      setMomoChannel("");
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!bankAccountNumber.trim()) {
      setError("Please enter an account number");
      return;
    }

    if (!bankCode) {
      setError("Please select a bank");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/verify-bank`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            accountNumber: bankAccountNumber.trim(),
            bankCode: bankCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      setResult(data.data);
      localStorage.setItem("kyc_api_key", apiKey.trim());
      loadHistory();

      // Clear form
      setBankAccountNumber("");
      setBankCode("");
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
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <HugeiconsIcon
            icon={ShieldIcon}
            size={24}
            strokeWidth={1.5}
            className="text-blue-600"
          />
          KYC Verification Services
        </h1>
        <p className="text-zinc-600 mt-2 text-sm">
          Verify phone numbers and Ghana Cards. Phone: 1 credit | Ghana Card: 2
          credits | Enhanced (with facial): 4 credits | Mobile Money: 1 credit | Bank Account: 1 credit
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Verification Form and History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <HugeiconsIcon
                  icon={UserIdVerificationIcon}
                  size={20}
                  strokeWidth={1.5}
                />
                Verification Services
              </CardTitle>
              <CardDescription className="text-sm">
                Choose your verification method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value);
                  setError(null);
                  setResult(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="phone" className="text-xs">
                    <HugeiconsIcon
                      icon={SmartPhone01Icon}
                      size={14}
                      strokeWidth={1.5}
                      className="mr-1"
                    />
                    Phone
                  </TabsTrigger>
                  <TabsTrigger value="ghanacard" className="text-xs">
                    <HugeiconsIcon
                      icon={IdentificationIcon}
                      size={14}
                      strokeWidth={1.5}
                      className="mr-1"
                    />
                    Ghana Card
                  </TabsTrigger>
                  <TabsTrigger value="enhanced" className="text-xs">
                    <HugeiconsIcon
                      icon={UserIdVerificationIcon}
                      size={14}
                      strokeWidth={1.5}
                      className="mr-1"
                    />
                    Enhanced
                  </TabsTrigger>
                  <TabsTrigger value="momo" className="text-xs">
                    <HugeiconsIcon
                      icon={Wallet01Icon}
                      size={14}
                      strokeWidth={1.5}
                      className="mr-1"
                    />
                    Momo
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="text-xs">
                    <HugeiconsIcon
                      icon={BankIcon}
                      size={14}
                      strokeWidth={1.5}
                      className="mr-1"
                    />
                    Bank
                  </TabsTrigger>
                </TabsList>

                {/* Phone Number Verification Tab */}
                <TabsContent value="phone" className="mt-0">
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

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading || !apiKey.trim() || !phoneNumber.trim()
                      }
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Verify Phone Number (1 credit)
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Ghana Card Normal Verification Tab */}
                <TabsContent value="ghanacard" className="mt-0">
                  <form onSubmit={handleVerifyGhanaCard} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey2">API Key</Label>
                      <Input
                        id="apiKey2"
                        type="text"
                        placeholder="gk_live_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ghanaCardId">Ghana Card ID Number</Label>
                      <Input
                        id="ghanaCardId"
                        type="text"
                        placeholder="GHA-123456789-0"
                        value={ghanaCardId}
                        onChange={(e) => setGhanaCardId(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="surname">Surname</Label>
                        <Input
                          id="surname"
                          type="text"
                          placeholder="Surname"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firstnames">First Names</Label>
                        <Input
                          id="firstnames"
                          type="text"
                          placeholder="First Names"
                          value={firstnames}
                          onChange={(e) => setFirstnames(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading ||
                        !apiKey.trim() ||
                        !ghanaCardId.trim() ||
                        !surname.trim() ||
                        !firstnames.trim() ||
                        !gender.trim() ||
                        !dateOfBirth.trim()
                      }
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Verify Ghana Card (2 credits)
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Ghana Card Enhanced Verification Tab */}
                <TabsContent value="enhanced" className="mt-0">
                  <form
                    onSubmit={handleVerifyGhanaCardEnhanced}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="apiKey3">API Key</Label>
                      <Input
                        id="apiKey3"
                        type="text"
                        placeholder="gk_live_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enhancedCardId">
                        Ghana Card ID Number
                      </Label>
                      <Input
                        id="enhancedCardId"
                        type="text"
                        placeholder="GHA-123456789-0"
                        value={enhancedCardId}
                        onChange={(e) => setEnhancedCardId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardImage">
                        Ghana Card Photo (for facial recognition)
                      </Label>
                      <Input
                        ref={fileInputRef}
                        id="cardImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-zinc-500">
                        Upload a clear photo of the Ghana Card holder for facial
                        verification
                      </p>
                    </div>

                    {imagePreview && (
                      <div className="mt-3 p-3 border rounded-lg">
                        <p className="text-xs font-medium text-zinc-700 mb-2">
                          Preview:
                        </p>
                        <img
                          src={imagePreview}
                          alt="Card preview"
                          className="max-h-40 rounded"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading ||
                        !apiKey.trim() ||
                        !enhancedCardId.trim() ||
                        !cardImage
                      }
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Verify with Facial Recognition (4 credits)
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Mobile Money Verification Tab */}
                <TabsContent value="momo" className="mt-0">
                  <form
                    onSubmit={handleVerifyMobileMoney}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="apiKey4">API Key</Label>
                      <Input
                        id="apiKey4"
                        type="text"
                        placeholder="gk_live_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="momoChannel">Mobile Money Channel</Label>
                      <select
                        id="momoChannel"
                        value={momoChannel}
                        onChange={(e) => setMomoChannel(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Channel</option>
                        <option value="mtn-gh">MTN Mobile Money</option>
                        <option value="vodafone-gh">Vodafone Cash</option>
                        <option value="tigo-gh">AirtelTigo Money</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="momoPhoneNumber">Phone Number</Label>
                      <Input
                        id="momoPhoneNumber"
                        type="text"
                        placeholder="0551234567 or +233551234567"
                        value={momoPhoneNumber}
                        onChange={(e) => setMomoPhoneNumber(e.target.value)}
                      />
                      <p className="text-xs text-zinc-500">
                        Enter the mobile money registered phone number
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading ||
                        !apiKey.trim() ||
                        !momoPhoneNumber.trim() ||
                        !momoChannel
                      }
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Verify Mobile Money (1 credit)
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Bank Account Verification Tab */}
                <TabsContent value="bank" className="mt-0">
                  <form
                    onSubmit={handleVerifyBankAccount}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="apiKey5">API Key</Label>
                      <Input
                        id="apiKey5"
                        type="text"
                        placeholder="gk_live_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankCode">Bank</Label>
                      <select
                        id="bankCode"
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Bank</option>
                        <option value="300302">STANDARD CHARTERED BANK</option>
                        <option value="300303">ABSA BANK GHANA LIMITED</option>
                        <option value="300304">GCB BANK LIMITED</option>
                        <option value="300305">NATIONAL INVESTMENT BANK</option>
                        <option value="300307">AGRICULTURAL DEVELOPMENT BANK</option>
                        <option value="300309">UNIVERSAL MERCHANT BANK</option>
                        <option value="300310">REPUBLIC BANK LIMITED</option>
                        <option value="300311">ZENITH BANK GHANA LTD</option>
                        <option value="300312">ECOBANK GHANA LTD</option>
                        <option value="300313">CAL BANK LIMITED</option>
                        <option value="300322">GUARANTY TRUST BANK</option>
                        <option value="300325">UNITED BANK OF AFRICA</option>
                        <option value="300329">ACCESS BANK LTD</option>
                        <option value="300331">CONSOLIDATED BANK GHANA</option>
                        <option value="300334">FIRST NATIONAL BANK</option>
                        <option value="300323">FIDELITY BANK LIMITED</option>
                        <option value="300320">BANK OF AFRICA</option>
                        <option value="300319">FIRST BANK OF NIGERIA</option>
                        <option value="300362">GHL Bank</option>
                        <option value="300316">FIRST ATLANTIC BANK</option>
                        <option value="300306">ARB APEX BANK LIMITED</option>
                        <option value="300324">SAHEL - SAHARA BANK (BSIC)</option>
                        <option value="300317">PRUDENTIAL BANK LTD</option>
                        <option value="300318">STANBIC BANK</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        type="text"
                        placeholder="Enter account number"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                      />
                      <p className="text-xs text-zinc-500">
                        Enter the bank account number to verify
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading ||
                        !apiKey.trim() ||
                        !bankAccountNumber.trim() ||
                        !bankCode
                      }
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            strokeWidth={1.5}
                            className="mr-2"
                          />
                          Verify Bank Account (1 credit)
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Error and Result Display (shared across all tabs) */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 mt-4">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      size={20}
                      strokeWidth={1.5}
                      className="text-red-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    className={`p-4 border rounded-lg mt-4 ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200"
                        : result.status === "not_found"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.status === "success" ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={20}
                          strokeWidth={1.5}
                          className="text-green-600 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={AlertCircleIcon}
                          size={20}
                          strokeWidth={1.5}
                          className="text-yellow-600 flex-shrink-0 mt-0.5"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 mb-2">
                          {result.status === "success"
                            ? "Verification Successful"
                            : "Not Found"}
                        </p>
                        <div className="space-y-1 text-sm">
                          {result.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={SmartPhone01Icon}
                                size={16}
                                strokeWidth={1.5}
                                className="text-zinc-500"
                              />
                              <span className="text-zinc-700">
                                {result.phoneNumber}
                              </span>
                            </div>
                          )}
                          {result.idNumber && (
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={IdentificationIcon}
                                size={16}
                                strokeWidth={1.5}
                                className="text-zinc-500"
                              />
                              <span className="text-zinc-700">
                                {result.idNumber}
                              </span>
                            </div>
                          )}
                          {result.name && (
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={User02Icon}
                                size={16}
                                strokeWidth={1.5}
                                className="text-zinc-500"
                              />
                              <span className="text-zinc-900 font-medium">
                                {result.name}
                              </span>
                            </div>
                          )}
                          {result.gender && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 text-xs">
                                Gender:
                              </span>
                              <span className="text-zinc-700">
                                {result.gender}
                              </span>
                            </div>
                          )}
                          {result.dateOfBirth && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 text-xs">
                                Date of Birth:
                              </span>
                              <span className="text-zinc-700">
                                {result.dateOfBirth}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={20}
                strokeWidth={1.5}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Verification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={1.5} />
                Recent Verifications
              </CardTitle>
              <CardDescription className="text-sm">
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
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    size={48}
                    strokeWidth={1.5}
                    className="mx-auto mb-3 opacity-30"
                  />
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
                          <div className="flex items-center gap-2 mb-1">
                            {item.verificationType === "phone" && (
                              <HugeiconsIcon
                                icon={SmartPhone01Icon}
                                size={14}
                                strokeWidth={1.5}
                                className="text-zinc-400"
                              />
                            )}
                            {item.verificationType === "ghana_card" && (
                              <HugeiconsIcon
                                icon={IdentificationIcon}
                                size={14}
                                strokeWidth={1.5}
                                className="text-zinc-400"
                              />
                            )}
                            {item.verificationType ===
                              "ghana_card_enhanced" && (
                              <HugeiconsIcon
                                icon={UserIdVerificationIcon}
                                size={14}
                                strokeWidth={1.5}
                                className="text-zinc-400"
                              />
                            )}
                            <span className="text-xs text-zinc-500 font-medium">
                              {item.verificationType === "phone"
                                ? "Phone"
                                : item.verificationType === "ghana_card"
                                ? "Ghana Card"
                                : "Enhanced"}
                            </span>
                          </div>
                          <div className="font-mono text-sm text-zinc-900 mb-1">
                            {item.phoneNumber || item.idNumber}
                          </div>
                          {item.resolvedName ? (
                            <div className="text-sm text-zinc-700 mb-1">
                              {item.resolvedName}
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500 mb-1 italic">
                              Name not found
                            </div>
                          )}
                          <div className="text-xs text-zinc-500">
                            {formatDate(item.createdAt)} • {item.creditDeducted}{" "}
                            {item.creditDeducted === 1 ? "credit" : "credits"}
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
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  size={20}
                  strokeWidth={1.5}
                />
                API Documentation
              </CardTitle>
              <CardDescription>
                Integrate KYC verification into your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone Verification API */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={SmartPhone01Icon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  1. Verify Phone Number (1 credit)
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify a Ghanaian phone number and get the registered name.
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
    "status": "success"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Ghana Card Normal Verification API */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={IdentificationIcon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  2. Verify Ghana Card (2 credits)
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify Ghana Card with ID number and personal details.
                </p>
                <CodeBlock
                  id="kyc-ghanacard"
                  language="bash"
                  code={`curl -X POST https://api.gatekeeperpro.live/api/kyc/verify-ghanacard \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "idNumber": "GHA-123456789-0",
    "surname": "Doe",
    "firstnames": "John",
    "gender": "MALE",
    "dateOfBirth": "1990-01-15"
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
    "idNumber": "GHA-123456789-0",
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "status": "success"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Ghana Card Enhanced Verification API */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={UserIdVerificationIcon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  3. Enhanced Verification with Facial Recognition (4 credits)
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify Ghana Card with facial recognition using base64 image.
                </p>
                <CodeBlock
                  id="kyc-enhanced"
                  language="bash"
                  code={`curl -X POST https://api.gatekeeperpro.live/api/kyc/verify-ghanacard-enhanced \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "idNumber": "GHA-123456789-0",
    "base64Image": "iVBORw0KGgoAAAANS..."
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
    "idNumber": "GHA-123456789-0",
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "M",
    "status": "success"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Mobile Money Verification API */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Wallet01Icon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  4. Verify Mobile Money (1 credit)
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify a Ghanaian mobile money account and get the registered name.
                </p>
                <CodeBlock
                  id="kyc-momo"
                  language="bash"
                  code={`curl -X POST https://api.gatekeeperpro.live/api/kyc/verify-momo \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "phoneNumber": "0548215801",
    "channel": "mtn-gh"
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
    "name": "MUSHUD KOFI ABU",
    "phone": "0548215801",
    "status": "success",
    "creditDeducted": 1,
    "remainingBalance": 99
  }
}`}
                  </pre>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 mb-2">
                    Supported Channels:
                  </p>
                  <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                    <li><code className="bg-blue-100 px-1 py-0.5 rounded">mtn-gh</code> - MTN Mobile Money</li>
                    <li><code className="bg-blue-100 px-1 py-0.5 rounded">vodafone-gh</code> - Vodafone Cash</li>
                    <li><code className="bg-blue-100 px-1 py-0.5 rounded">tigo-gh</code> - AirtelTigo Money</li>
                  </ul>
                </div>
              </div>

              {/* Bank Account Verification API */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={BankIcon}
                    size={16}
                    strokeWidth={1.5}
                  />
                  5. Verify Bank Account (1 credit)
                </h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Verify a Ghanaian bank account number and get the registered name.
                </p>
                <CodeBlock
                  id="kyc-bank"
                  language="bash"
                  code={`curl -X POST https://api.gatekeeperpro.live/api/kyc/verify-bank \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "accountNumber": "1234567890",
    "bankCode": "300361"
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
    "name": "KOFI MUSHUD ABU",
    "accountNumber": "1234567890",
    "status": "success",
    "creditDeducted": 1,
    "remainingBalance": 98
  }
}`}
                  </pre>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-700 mb-2">
                    Supported Banks:
                  </p>
                  <p className="text-xs text-green-600">
                    24 Ghanaian banks supported including GCB Bank, Ecobank, Absa Bank, Stanbic Bank, and more.
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-3">Credit Costs</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      1 credit
                    </span>
                    <span className="text-zinc-600">
                      Phone Number Verification
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      1 credit
                    </span>
                    <span className="text-zinc-600">
                      Mobile Money Verification
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      1 credit
                    </span>
                    <span className="text-zinc-600">
                      Bank Account Verification
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      2 credits
                    </span>
                    <span className="text-zinc-600">
                      Ghana Card Verification (Normal)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                      4 credits
                    </span>
                    <span className="text-zinc-600">
                      Ghana Card Enhanced (with Facial Recognition)
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-3">
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
                <h3 className="text-sm font-medium mb-3">Status Codes</h3>
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
                    <span className="px-2 py-0.5 rounded text-xs font-normal bg-yellow-100 text-yellow-700">
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
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    size={16}
                    strokeWidth={1.5}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span>
                    <strong>Note:</strong> Credits are deducted for each
                    verification attempt regardless of whether information is
                    found. All endpoints require only API key (no project ID
                    needed).
                  </span>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-3">Error Codes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                      401
                    </code>
                    <div>
                      <p className="text-zinc-900">Invalid API Key</p>
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
                      <p className="text-zinc-900">Insufficient Balance</p>
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
                      <p className="text-zinc-900">Invalid Data</p>
                      <p className="text-zinc-600">
                        Check phone format or Ghana Card details
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
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={20}
                  strokeWidth={1.5}
                  className="text-blue-600"
                />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Phone Verification
                </h3>
                <p className="text-sm text-blue-700">
                  Verify Ghanaian phone numbers and resolve registered names for
                  1 credit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon
                  icon={IdentificationIcon}
                  size={20}
                  strokeWidth={1.5}
                  className="text-purple-600"
                />
              </div>
              <div>
                <h3 className="font-medium text-purple-900 mb-1">Ghana Card</h3>
                <p className="text-sm text-purple-700">
                  Verify Ghana Card with personal details for 2 credits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon
                  icon={UserIdVerificationIcon}
                  size={20}
                  strokeWidth={1.5}
                  className="text-orange-600"
                />
              </div>
              <div>
                <h3 className="font-medium text-orange-900 mb-1">
                  Enhanced Facial
                </h3>
                <p className="text-sm text-orange-700">
                  Ghana Card verification with facial recognition for 4 credits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
