'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api, { checkoutApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Copy01Icon, Link01Icon, CodeIcon, Delete01Icon } from '@hugeicons/core-free-icons';

interface Project {
  _id: string;
  name: string;
  senderID: string;
  status: string;
}

interface CheckoutSession {
  sessionToken: string;
  projectName: string;
  checkoutUrl: string;
  status: string;
  successUrl: string;
  expiresAt: string;
  createdAt: string;
  checkoutType?: 'standard' | 'direct';
  receiver?: string;
  otpSent?: boolean;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CheckoutSession | null>(null);
  const [checkoutType, setCheckoutType] = useState<'standard' | 'direct'>('standard');
  const [formData, setFormData] = useState({
    project: '',
    apiKey: '',
    phoneNumber: '',
    email: '',
    successUrl: '',
    statusCallback: '',
    metadata: '{}',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchSessions();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      console.log('Checkout - Projects API Response:', response.data);
      const projectsData = response.data.payload?.projects || response.data.projects || [];
      console.log('Checkout - Extracted projects:', projectsData);
      setProjects(projectsData);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Note: You'll need to add this endpoint to your backend
      // For now, we'll just clear the sessions
      setSessions([]);
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!formData.project || !formData.apiKey || !formData.successUrl) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate direct checkout requires phone or email
    if (checkoutType === 'direct' && !formData.phoneNumber && !formData.email) {
      setError('Direct checkout requires either phone number or email');
      return;
    }

    // Validate URLs
    try {
      new URL(formData.successUrl);
      if (formData.statusCallback) new URL(formData.statusCallback);
    } catch {
      setError('Please enter valid URLs');
      return;
    }

    // Validate metadata JSON
    let metadata = {};
    if (formData.metadata.trim()) {
      try {
        metadata = JSON.parse(formData.metadata);
      } catch {
        setError('Invalid JSON in metadata field');
        return;
      }
    }

    try {
      setCreating(true);
      setError('');
      // Create a custom API instance with the project API key
      const payload: any = {
        project: formData.project,
        successUrl: formData.successUrl,
        statusCallback: formData.statusCallback || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      // Only include phone/email for direct checkout
      if (checkoutType === 'direct') {
        if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber;
        if (formData.email) payload.email = formData.email;
      }

      const response = await api.post('/api/checkout/create', payload, {
        headers: {
          'X-API-Key': formData.apiKey,
        },
      });

      const newSession: CheckoutSession = {
        sessionToken: response.data.sessionToken,
        checkoutUrl: response.data.checkoutUrl,
        projectName: projects.find(p => p._id === formData.project)?.name || '',
        status: 'pending',
        successUrl: formData.successUrl,
        expiresAt: response.data.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        checkoutType: response.data.checkoutType || checkoutType,
        receiver: response.data.receiver,
        otpSent: response.data.otpSent,
      }; 

      setSessions([newSession, ...sessions]);
      setSelectedSession(newSession);
      if (response.data.otpSent) {
        setSuccess('Checkout session created! OTP sent to ' + response.data.receiver);
      } else {
        setSuccess('Checkout session created! User will enter phone/email on checkout page.');
      }
      setFormData({ project: '', apiKey: '', phoneNumber: '', email: '', successUrl: '', statusCallback: '', metadata: '{}' });

      setTimeout(() => {
        setSuccess('');
        setShowCreateModal(false);
        setShowCodeModal(true);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create checkout session');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowCodeModal(false);
    setSelectedSession(null);
    setCheckoutType('standard');
    setFormData({ project: '', apiKey: '', phoneNumber: '', email: '', successUrl: '', statusCallback: '', metadata: '{}' });
    setError('');
  };

  const getIntegrationCode = (session: CheckoutSession) => {
    return `<!-- Redirect to Checkout -->
<a href="${session.checkoutUrl}">
  Verify Phone Number
</a>

<!-- Or use JavaScript -->
<script>
  // Redirect user to checkout
  window.location.href = '${session.checkoutUrl}';
</script>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Checkout Sessions</h1>
          <p className="text-zinc-600 mt-1">Create OTP verification checkout flows</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.5} className="mr-2" />
          Create Session
        </Button>
      </div>

      {(error || success) && (
        <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {error || success}
        </div>
      )}

      {projects.length === 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-zinc-600 mb-4">You need to create a project first</p>
              <Button onClick={() => window.location.href = '/projects'}>
                Go to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Developer API Documentation */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CodeIcon} size={20} strokeWidth={1.5} className="text-blue-600" />
            <CardTitle className="text-lg">Developer API - Create Checkout URL</CardTitle>
          </div>
          <CardDescription>
            Programmatically create checkout sessions from your backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-zinc-700">Endpoint</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-zinc-900 text-green-400 px-3 py-2 rounded text-sm">
                POST {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create`)}
              >
                <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-zinc-700">Headers</Label>
            <pre className="bg-zinc-900 text-zinc-100 p-3 rounded text-xs mt-1 overflow-x-auto">
{`X-API-Key: your-project-api-key
Content-Type: application/json`}
            </pre>
          </div>

          <div>
            <Label className="text-sm font-semibold text-zinc-700">Request Body</Label>
            <div className="flex items-start gap-2 mt-1">
              <pre className="flex-1 bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "project": "project-id-here",
  "phoneNumber": "+233241234567", // Optional
  "email": "user@example.com",     // Optional
  "successUrl": "https://yourapp.com/success",
  "statusCallback": "https://yourapp.com/webhook",
  "metadata": {
    "orderId": "12345",
    "customerId": "abc"
  }
}`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`{
  "project": "project-id-here",
  "phoneNumber": "+233241234567",
  "email": "user@example.com",
  "successUrl": "https://yourapp.com/success",
  "statusCallback": "https://yourapp.com/webhook",
  "metadata": {
    "orderId": "12345",
    "customerId": "abc"
  }
}`)}
              >
                <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-zinc-700">Response</Label>
            <pre className="bg-zinc-900 text-zinc-100 p-3 rounded text-xs mt-1 overflow-x-auto">
{`{
  "message": "Checkout session created successfully",
  "sessionToken": "uuid-session-token",
  "checkoutUrl": "https://checkout.yourapp.com/checkout/uuid",
  "expiresAt": "2025-12-13T12:00:00.000Z",
  "checkoutType": "direct", // "direct" or "standard"
  "otpSent": true,
  "receiver": "+233241234567"
}`}
            </pre>
          </div>

          <div>
            <Label className="text-sm font-semibold text-zinc-700">Code Example (cURL) - Standard Checkout</Label>
            <div className="flex items-start gap-2 mt-1">
              <pre className="flex-1 bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create \\
  -H "X-API-Key: your-project-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "project-id",
    "successUrl": "https://yourapp.com/success"
  }'`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create \\
  -H "X-API-Key: your-project-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "project-id",
    "successUrl": "https://yourapp.com/success"
  }'`)}
              >
                <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-zinc-700">Code Example (JavaScript) - Direct Checkout</Label>
            <div className="flex items-start gap-2 mt-1">
              <pre className="flex-1 bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
{`// Direct checkout - OTP sent immediately
const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-project-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'project-id',
    phoneNumber: '+233241234567', // Include for direct checkout
    successUrl: 'https://yourapp.com/success',
    metadata: { orderId: '12345' }
  })
});

const data = await response.json();
if (data.otpSent) {
  console.log('OTP sent to', data.receiver);
}
console.log(data.checkoutUrl); // Send URL for verification`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(`const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/checkout/create', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-project-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'project-id',
    successUrl: 'https://yourapp.com/success',
    statusCallback: 'https://yourapp.com/webhook',
    metadata: { orderId: '12345' }
  })
});

const data = await response.json();
console.log(data.checkoutUrl);`)}
              >
                <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Security Note:</strong> Never expose your project API key in client-side code. Always create checkout sessions from your backend server.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {sessions.map((session) => (
          <Card key={session.sessionToken}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{session.projectName}</CardTitle>
                  <CardDescription className="mt-1">
                    Session: {session.sessionToken.substring(0, 8)}...
                  </CardDescription>
                  {session.checkoutType && (
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.checkoutType === 'direct' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.checkoutType === 'direct' ? '⚡ Direct' : '📋 Standard'}
                      </span>
                      {session.otpSent && session.receiver && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          ✓ OTP Sent to {session.receiver.slice(0, 15)}...
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                  session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Checkout URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-zinc-100 px-2 py-1 rounded flex-1 truncate">
                      {session.checkoutUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(session.checkoutUrl)}
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Success URL</p>
                  <code className="text-xs bg-zinc-100 px-2 py-1 rounded block truncate">
                    {session.successUrl}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600">
                <div>
                  Created: {new Date(session.createdAt).toLocaleString()}
                </div>
                <div>
                  Expires: {new Date(session.expiresAt).toLocaleString()}
                </div>
              </div>

              {session.checkoutType === 'direct' && session.receiver && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-800">
                    <strong>Direct Checkout:</strong> OTP {session.otpSent ? 'sent' : 'pending'} to <code className="bg-purple-100 px-1 rounded">{session.receiver}</code>
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSession(session);
                    setShowCodeModal(true);
                  }}
                >
                  <HugeiconsIcon icon={CodeIcon} size={16} strokeWidth={1.5} className="mr-1" />
                  View Integration Code
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(session.checkoutUrl, '_blank')}
                >
                  <HugeiconsIcon icon={CodeIcon} size={16} strokeWidth={1.5} className="mr-1" />
                  Test Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && projects.length > 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-zinc-600 mb-4">No checkout sessions yet</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.5} className="mr-2" />
                Create Your First Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Checkout Session</CardTitle>
              <CardDescription>
                Generate a unique checkout URL for OTP verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkout Type Selector */}
              <div className="space-y-3">
                <Label>Checkout Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutType('standard')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      checkoutType === 'standard'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Standard Checkout</div>
                    <div className="text-xs text-zinc-600">
                      User enters phone/email on checkout page
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutType('direct')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      checkoutType === 'direct'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Direct Checkout</div>
                    <div className="text-xs text-zinc-600">
                      Provide phone/email now, OTP sent immediately
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <select
                  id="project"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                >
                  <option value="">Select a project</option>
                  {projects.filter(p => p.status === 'active').map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} ({project.senderID})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Project API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your project API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
                <p className="text-xs text-zinc-600">
                  The API key you received when creating the project
                </p>
              </div>

              {/* Show phone/email fields only for direct checkout */}
              {checkoutType === 'direct' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+233241234567"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                      <p className="text-xs text-zinc-600">
                        Will receive OTP via SMS
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      <p className="text-xs text-zinc-600">
                        Will receive OTP via email
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <strong>⚠️ Direct Checkout:</strong> Provide at least one contact method. OTP will be sent immediately when checkout is created.
                    </p>
                  </div>
                </>
              )}

              {checkoutType === 'standard' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>📋 Standard Checkout:</strong> The user will enter their phone number or email on the checkout page before receiving the OTP.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="successUrl">Success URL *</Label>
                <Input
                  id="successUrl"
                  placeholder="https://yourapp.com/success"
                  value={formData.successUrl}
                  onChange={(e) => setFormData({ ...formData, successUrl: e.target.value })}
                />
                <p className="text-xs text-zinc-600">
                  Where to redirect users after successful verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusCallback">Status Callback URL (Optional)</Label>
                <Input
                  id="statusCallback"
                  placeholder="https://yourapp.com/webhook"
                  value={formData.statusCallback}
                  onChange={(e) => setFormData({ ...formData, statusCallback: e.target.value })}
                />
                <p className="text-xs text-zinc-600">
                  Receive webhook notifications about session status changes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (Optional JSON)</Label>
                <Textarea
                  id="metadata"
                  placeholder='{"orderId": "12345", "customerId": "abc"}'
                  value={formData.metadata}
                  onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-zinc-600">
                  Custom data to attach to this session (must be valid JSON)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={closeModal} className="flex-1" disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} className="flex-1" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Code Modal */}
      {showCodeModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>Integration Code</CardTitle>
              <CardDescription>
                Use this code to redirect users to the checkout page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Checkout URL</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedSession.checkoutUrl)}
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg text-sm break-all">
                  {selectedSession.checkoutUrl}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>HTML/JavaScript Example</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(getIntegrationCode(selectedSession))}
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {getIntegrationCode(selectedSession)}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> After the user completes verification, they'll be redirected to your success URL with the session token as a query parameter.
                </p>
              </div>

              <Button onClick={closeModal} className="w-full">
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
