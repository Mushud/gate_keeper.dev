'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, FilterIcon, CheckmarkCircle01Icon, CancelCircleIcon, Mail01Icon, SmartPhone02Icon, Refresh01Icon, ViewIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OTPLog {
  _id: string;
  receiver: string;
  name?: string;
  email?: string;
  type: string;
  verified: boolean;
  reference: string;
  generatedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  status: string;
  projectName?: string;
  projectSenderID?: string;
  failedAttempts?: number;
  tokenUsed?: number;
  locked?: boolean;
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<OTPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<OTPLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, typeFilter, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/api/account/logs?${params.toString()}`);
      setLogs(response.data.logs || response.data.payload?.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError(err.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getStatusLabel = (log: OTPLog) => {
    if (log.verified) return 'Verified';
    if (log.status === 'expired' || (log.expiresAt && new Date(log.expiresAt) < new Date())) {
      return 'Expired';
    }
    return 'Unverified';
  };

  const getStatusColor = (log: OTPLog) => {
    if (log.verified) return 'bg-green-100 text-green-800';
    if (log.status === 'expired' || (log.expiresAt && new Date(log.expiresAt) < new Date())) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const viewDetails = (log: OTPLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportLogs = () => {
    const csv = [
      ['Reference', 'Project', 'Receiver', 'Name', 'Type', 'Status', 'Generated At', 'Verified At'].join(','),
      ...logs.map(log => [
        log.reference,
        log.projectName || '',
        log.receiver,
        log.name || '',
        log.type,
        getStatusLabel(log),
        new Date(log.generatedAt).toLocaleString(),
        log.verifiedAt ? new Date(log.verifiedAt).toLocaleString() : 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otp-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };



  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">OTP Logs</h1>
          <p className="text-zinc-600 mt-1">View and search OTP verification history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <HugeiconsIcon icon={Refresh01Icon} size={16} strokeWidth={1.5} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} disabled={logs.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={FilterIcon} size={20} strokeWidth={1.5} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 rounded" />
              <Skeleton className="h-10 rounded" />
              <Skeleton className="h-10 rounded" />
              <Skeleton className="h-10 rounded" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search receiver, name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} />
                </Button>
              </form>

              {/* Status Filter */}
              <select
                className="px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              {/* Type Filter */}
              <select
                className="px-3 py-2 border rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="phone">Phone (SMS)</option>
                <option value="email">Email</option>
              </select>

              {/* Limit */}
              <select
                className="px-3 py-2 border rounded-md"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value="25">Show 25</option>
                <option value="50">Show 50</option>
                <option value="100">Show 100</option>
                <option value="200">Show 200</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>OTP Records</CardTitle>
          <CardDescription>
            Showing {logs.length} record{logs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Reference</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Receiver</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Generated</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-16 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-40 rounded" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-40 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-600">No OTP logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Reference</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Receiver</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Generated</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Verified</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-zinc-50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-zinc-100 px-2 py-1 rounded">
                          {log.reference.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <div className="font-medium">{log.projectName}</div>
                          {log.projectSenderID && (
                            <div className="text-xs text-zinc-500">{log.projectSenderID}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <div>{log.name || log.receiver}</div>
                          {log.name && (
                            <div className="text-xs text-zinc-500">{log.receiver}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          log.type === 'phone' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {log.type === 'phone' ? <HugeiconsIcon icon={SmartPhone02Icon} size={12} strokeWidth={1.5} /> : <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={1.5} />}
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(log)}`}>
                          {log.verified ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} strokeWidth={1.5} /> : <HugeiconsIcon icon={CancelCircleIcon} size={12} strokeWidth={1.5} />}
                          {getStatusLabel(log)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600">
                        {new Date(log.generatedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600">
                        {log.verifiedAt ? new Date(log.verifiedAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(log)}
                        >
                          <HugeiconsIcon icon={ViewIcon} size={14} strokeWidth={1.5} className="mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>OTP Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this OTP request
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Reference</p>
                  <code className="text-xs bg-zinc-100 px-2 py-1 rounded block break-all">
                    {selectedLog.reference}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(selectedLog)}`}>
                    {selectedLog.verified ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} strokeWidth={1.5} /> : <HugeiconsIcon icon={CancelCircleIcon} size={12} strokeWidth={1.5} />}
                    {getStatusLabel(selectedLog)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Project</p>
                  <p className="text-sm">{selectedLog.projectName}</p>
                  {selectedLog.projectSenderID && (
                    <p className="text-xs text-zinc-500">{selectedLog.projectSenderID}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Type</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    selectedLog.type === 'phone' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedLog.type === 'phone' ? <HugeiconsIcon icon={SmartPhone02Icon} size={12} strokeWidth={1.5} /> : <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={1.5} />}
                    {selectedLog.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Receiver</p>
                  <p className="text-sm">{selectedLog.receiver}</p>
                </div>
                {selectedLog.name && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 mb-1">Name</p>
                    <p className="text-sm">{selectedLog.name}</p>
                  </div>
                )}
              </div>

              {selectedLog.email && (
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Email</p>
                  <p className="text-sm">{selectedLog.email}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Generated At</p>
                  <p className="text-sm text-zinc-600">{new Date(selectedLog.generatedAt).toLocaleString()}</p>
                </div>
                {selectedLog.verifiedAt && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 mb-1">Verified At</p>
                    <p className="text-sm text-zinc-600">{new Date(selectedLog.verifiedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedLog.expiresAt && (
                <div>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">Expires At</p>
                  <p className="text-sm text-zinc-600">{new Date(selectedLog.expiresAt).toLocaleString()}</p>
                  {new Date(selectedLog.expiresAt) < new Date() && !selectedLog.verified && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ This OTP has expired</p>
                  )}
                </div>
              )}

              {(selectedLog.failedAttempts !== undefined || selectedLog.tokenUsed !== undefined) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.failedAttempts !== undefined && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 mb-1">Failed Attempts</p>
                      <p className="text-sm text-zinc-600">{selectedLog.failedAttempts}</p>
                    </div>
                  )}
                  {selectedLog.tokenUsed !== undefined && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 mb-1">Token Used</p>
                      <p className="text-sm text-zinc-600">{selectedLog.tokenUsed}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.locked && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">🔒 This OTP is locked due to too many failed attempts</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setDetailsOpen(false)} variant="outline">
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} className="mr-1" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
