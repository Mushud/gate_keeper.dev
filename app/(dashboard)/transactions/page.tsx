'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  CreditCardAcceptIcon, 
  CheckmarkCircleIcon, 
  Cancel01Icon, 
  Clock01Icon, 
  Package01Icon,
  Calendar01Icon,
  Dollar01Icon 
} from '@hugeicons/core-free-icons';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  transactionId: string;
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  credits: number;
  credited: boolean;
  channel: string;
  package?: {
    name: string;
    credits: number;
  };
  createdAt: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payment/history?limit=50');
      setTransactions(response.data.transactions || []);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <HugeiconsIcon icon={CheckmarkCircleIcon} size={16} strokeWidth={1.5} />;
      case 'failed':
        return <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />;
      case 'pending':
        return <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={1.5} />;
      default:
        return <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={1.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Transaction History</h1>
        <p className="text-zinc-600 mt-1">View all your payment and credit transactions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {[...Array(8)].map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24 rounded" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32 rounded" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-40 rounded" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4">
              <HugeiconsIcon icon={CreditCardAcceptIcon} size={32} strokeWidth={1.5} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-sm text-zinc-600">
              Your transaction history will appear here once you make a purchase.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.status === 'success' 
                              ? 'bg-green-100' 
                              : transaction.status === 'failed'
                              ? 'bg-red-100'
                              : 'bg-yellow-100'
                          }`}>
                            <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={1.5} className={`${
                              transaction.status === 'success' 
                                ? 'text-green-600' 
                                : transaction.status === 'failed'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">
                              {transaction.package?.name || 'Credit Purchase'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600 font-mono">
                          {transaction.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-zinc-900">
                          {transaction.currency} {transaction.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-zinc-900">
                          {transaction.credits.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="text-xs">
                          {transaction.channel.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            className={`${getStatusColor(transaction.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </Badge>
                          {transaction.credited && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} strokeWidth={1.5} />
                              <span>Credited</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {transactions.length > 0 && (
        <div className="mt-6 text-center text-sm text-zinc-500">
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
