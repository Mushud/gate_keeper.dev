'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import api from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircleIcon, Loading01Icon, Cancel01Icon, SmartPhone01Icon } from '@hugeicons/core-free-icons';

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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: PricingPlan | null;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed';

const PAYMENT_METHODS = [
  { value: 'mtn-gh', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'vodafone-gh', label: 'Telecel (Vodafone)', icon: '📱' },
  { value: 'tigo-gh', label: 'AirtelTigo', icon: '📱' },
];

export function PaymentModal({ isOpen, onClose, package: pkg, onSuccess }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtn-gh');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    // Reset state when modal opens/closes
    if (!isOpen) {
      setStatus('idle');
      setError('');
      setTransactionId('');
      setPhoneNumber('');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!phoneNumber || !pkg) return;

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number starting with 0');
      return;
    }

    try {
      setStatus('initiating');
      setError('');

      const response = await api.post('/api/payment/initiate', {
        packageId: pkg.id,
        phoneNumber: cleanPhone,
        channel: paymentMethod,
      });

      const txnId = response.data.transactionId;
      setTransactionId(txnId);
      setStatus('pending');

      // Start polling for payment status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await api.get(`/api/payment/transaction/${txnId}`);
          const txnStatus = statusResponse.data.transaction.status;

          if (txnStatus === 'success') {
            setStatus('success');
            clearInterval(interval);
            setPollingInterval(null);
            
            // Wait a bit before closing to show success message
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000);
          } else if (txnStatus === 'failed' || txnStatus === 'cancelled') {
            setStatus('failed');
            setError('Payment failed. Please try again.');
            clearInterval(interval);
            setPollingInterval(null);
          }
        } catch (err) {
          console.error('Error polling transaction status:', err);
        }
      }, 3000); // Poll every 3 seconds

      setPollingInterval(interval);

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          setPollingInterval(null);
          if (status === 'pending') {
            setError('Payment confirmation timeout. Please check your payment history.');
            setStatus('failed');
          }
        }
      }, 5 * 60 * 1000);

    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setStatus('failed');
    }
  };

  const handleClose = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    onClose();
  };

  if (!pkg) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {pkg.name} Package</DialogTitle>
          <DialogDescription>
            {pkg.credits.toLocaleString()} credits for {pkg.currency || 'GHS'} {pkg.price}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === 'idle' || status === 'initiating' ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.value} id={method.value} />
                        <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer">
                          <span>{method.icon}</span>
                          <span>{method.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="phone">Mobile Money Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0248123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={10}
                    className="mt-1"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Enter the mobile money number registered with {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} disabled={status === 'initiating'}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!phoneNumber || status === 'initiating'}
                  className="min-w-[120px]"
                >
                  {status === 'initiating' ? (
                    <>
                      <HugeiconsIcon icon={Loading01Icon} size={16} strokeWidth={1.5} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {pkg.currency || 'GHS'} {pkg.price}</>
                  )}
                </Button>
              </div>
            </>
          ) : status === 'pending' ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <HugeiconsIcon icon={SmartPhone01Icon} size={32} strokeWidth={1.5} className="text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Waiting for Payment Approval
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                Please check your phone and approve the payment request from{' '}
                {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <HugeiconsIcon icon={Loading01Icon} size={16} strokeWidth={1.5} className="animate-spin" />
                <span>Waiting for confirmation...</span>
              </div>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <HugeiconsIcon icon={CheckmarkCircleIcon} size={32} strokeWidth={1.5} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-sm text-zinc-600">
                Your account has been credited with {pkg.credits.toLocaleString()} credits
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <HugeiconsIcon icon={Cancel01Icon} size={32} strokeWidth={1.5} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Payment Failed
              </h3>
              <p className="text-sm text-zinc-600 mb-4">{error}</p>
              <Button onClick={() => setStatus('idle')}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
