'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Dollar01Icon, ArrowMoveUpRightIcon, CreditCardAcceptIcon, Package01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import { PaymentModal } from '@/components/PaymentModal';
import { Skeleton } from '@/components/ui/skeleton';

interface BalanceInfo {
  accountID: string;
  name: string;
  balance: number;
  verified: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency?: string;
  pricePerCredit: number;
  popular?: boolean;
  description?: string;
  features?: string[];
}

export default function BillingPage() {
  const { user } = useAuth();
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PricingPlan | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchPackages();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/account/balance');
      setBalanceInfo(response.data);
    } catch (err: any) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to load balance information');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await api.get('/api/billing/packages');
      setPricingPlans(response.data.packages || []);
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
      setError('Failed to load billing packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = (plan: PricingPlan) => {
    setSelectedPackage(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setSuccess('Payment successful! Your account has been credited.');
    setTimeout(() => setSuccess(''), 5000);
    fetchBalance(); // Refresh balance
  };



  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Billing & Credits</h1>
        <p className="text-zinc-600 mt-1">Manage your account balance and purchase OTP credits</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {/* Current Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <Card className="md:col-span-1">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-12 w-1/2 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="md:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600 mb-2">Current Balance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-zinc-900">
                        {balanceInfo?.balance.toLocaleString() || 0}
                      </p>
                      <span className="text-sm text-zinc-600">credits</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Account: {balanceInfo?.accountID}
                    </p>
                  </div>
                  <div className="p-4 rounded-full bg-blue-100">
                    <HugeiconsIcon icon={Dollar01Icon} size={32} strokeWidth={1.5} className="text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-100">
                    <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={1.5} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">How Credits Work</h3>
                    <p className="text-sm text-zinc-600">
                      Each OTP sent (via SMS or email) consumes 1 credit from your account balance. 
                      Purchase credits below to ensure uninterrupted service. Credits never expire.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Low Balance Warning */}
      {balanceInfo && balanceInfo.balance < 50 && (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={ArrowMoveUpRightIcon} size={20} strokeWidth={1.5} className="text-amber-600" />
              <p className="text-sm text-amber-800">
                <strong>Low Balance Warning:</strong> Your credit balance is running low. 
                Purchase more credits to avoid service interruption.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Purchase Credits</h2>
        <p className="text-zinc-600 mb-6">Choose a package that fits your needs</p>

        {loadingPackages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-1/2 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-1/2 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pricingPlans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-zinc-600">No billing packages available at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.description && (
                      <p className="text-xs text-zinc-600 mb-2">{plan.description}</p>
                    )}
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-zinc-900">
                        {plan.currency || '₵'}{plan.price}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">Credits</span>
                      <span className="font-semibold text-zinc-900">
                        {plan.credits.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">Per Credit</span>
                      <span className="font-semibold text-zinc-900">
                        {plan.currency || '₵'}{plan.pricePerCredit.toFixed(5)}
                      </span>
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <div className="pt-2 border-t">
                        <ul className="text-xs text-zinc-600 space-y-1">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-1">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePurchase(plan)}
                    className={`w-full ${
                      plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }`}
                  >
                    <HugeiconsIcon icon={CreditCardAcceptIcon} size={16} strokeWidth={1.5} className="mr-2" />
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Package01Icon} size={20} strokeWidth={1.5} />
            Credit Usage
          </CardTitle>
          <CardDescription>Understanding how credits are consumed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">SMS (Phone) OTP</h4>
                <p className="text-sm text-blue-800">
                  <strong>1 credit</strong> per SMS sent. Delivery to any phone number worldwide.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Email OTP</h4>
                <p className="text-sm text-green-800">
                  <strong>1 credit</strong> per email sent. Includes HTML formatting and branding.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg">
              <h4 className="font-semibold text-zinc-900 mb-2">Important Notes</h4>
              <ul className="text-sm text-zinc-700 space-y-1 list-disc list-inside">
                <li>Credits are deducted only when OTP is successfully generated</li>
                <li>Failed deliveries do not consume credits</li>
                <li>Credits never expire and can be used across all projects</li>
                <li>Volume discounts available for enterprise customers - contact support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods (Coming Soon) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Accepted payment options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="px-4 py-2 bg-zinc-100 rounded text-sm font-medium">
              💳 Credit Card
            </div>
            <div className="px-4 py-2 bg-zinc-100 rounded text-sm font-medium">
              💰 Debit Card
            </div>
            <div className="px-4 py-2 bg-zinc-100 rounded text-sm font-medium">
              🏦 Bank Transfer
            </div>
            <div className="px-4 py-2 bg-zinc-100 rounded text-sm font-medium">
              📱 Mobile Money
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            All transactions are secured with industry-standard encryption. 
            We use trusted payment processors to ensure your data is safe.
          </p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        package={selectedPackage}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
