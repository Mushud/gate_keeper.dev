'use client';

import { useState, useEffect, useId } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Message01Icon, UserMultiple02Icon, Refresh01Icon, CheckmarkCircle01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';

interface Project {
  _id: string;
  projectID: string;
  name: string;
  senderID: string;
  status: string;
  apiKey: string;
}

function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

const Grid = ({ pattern, size }: { pattern?: number[][]; size?: number }) => {
  const p = pattern ?? [
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
  ];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] from-zinc-100/30 to-zinc-300/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full mix-blend-overlay stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

export default function SMSPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Single SMS state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  // Bulk SMS state
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data.projects || []);
      if (response.data.projects?.length > 0) {
        setSelectedProject(response.data.projects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const sendSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !phoneNumber || !message) return;

    setLoading(true);
    setResult(null);

    try {
      const project = projects.find(p => p._id === selectedProject);
      if (!project?.apiKey) {
        setResult({ success: false, error: 'API key not found. Please regenerate the API key for this project.' });
        setLoading(false);
        return;
      }
      
      const response = await api.post(
        '/api/send_sms',
        { phoneNumber, message },
        { headers: { 'X-API-Key': project.apiKey } }
      );
      
      setResult({ success: true, data: response.data });
      setPhoneNumber('');
      setMessage('');
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to send SMS' 
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !phoneNumbers || !bulkMessage) return;

    setLoading(true);
    setResult(null);

    try {
      const project = projects.find(p => p._id === selectedProject);
      if (!project?.apiKey) {
        setResult({ success: false, error: 'API key not found. Please regenerate the API key for this project.' });
        setLoading(false);
        return;
      }
      
      const numbersArray = phoneNumbers.split('\n').map(n => n.trim()).filter(n => n);
      
      const response = await api.post(
        '/api/send_bulk_sms',
        { phoneNumbers: numbersArray, message: bulkMessage },
        { headers: { 'X-API-Key': project.apiKey } }
      );
      
      setResult({ success: true, data: response.data });
      setPhoneNumbers('');
      setBulkMessage('');
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to send bulk SMS' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCredits = (text: string) => {
    return Math.ceil(text.length / 160);
  };

  return (
    <div className="relative min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <Grid />
      
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Send SMS</h1>
          <p className="text-muted-foreground mt-2">
            Send SMS messages to your users instantly
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - SMS Sending Interface */}
          <div className="space-y-6">
            {/* Project Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Project</CardTitle>
                <CardDescription>Choose which project to send SMS from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} {project.senderID && `(${project.senderID})`}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchProjects}
                  >
                    <HugeiconsIcon icon={Refresh01Icon} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result Display */}
            {result && (
              <Card className={`${result.success ? 'border-green-500' : 'border-red-500'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HugeiconsIcon 
                      icon={result.success ? CheckmarkCircle01Icon : Cancel01Icon}
                      className={result.success ? 'text-green-500' : 'text-red-500'}
                    />
                    {result.success ? 'SMS Sent Successfully' : 'Failed to Send SMS'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {result.data.message}
                      </p>
                      {result.data.sentCount !== undefined && (
                        <div className="flex gap-4 text-sm">
                          <Badge variant="default">Sent: {result.data.sentCount}</Badge>
                          <Badge variant="destructive">Failed: {result.data.failedCount}</Badge>
                          <Badge variant="secondary">Credits Used: {result.data.creditsUsed}</Badge>
                        </div>
                      )}
                      {result.data.campaignId && (
                        <p className="text-xs text-muted-foreground">
                          Campaign ID: {result.data.campaignId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">{result.error}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SMS Tabs */}
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <HugeiconsIcon icon={Message01Icon} className="h-4 w-4" />
                  Single SMS
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <HugeiconsIcon icon={UserMultiple02Icon} className="h-4 w-4" />
                  Bulk SMS
                </TabsTrigger>
              </TabsList>

              {/* Single SMS Tab */}
              <TabsContent value="single">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Single SMS</CardTitle>
                    <CardDescription>Send SMS to a single phone number</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={sendSingleSMS} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="233241234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter phone number with country code (e.g., 233241234567)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Enter your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={5}
                          maxLength={1600}
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{message.length} / 1600 characters</span>
                          <span>{calculateCredits(message)} credit{calculateCredits(message) !== 1 ? 's' : ''} required</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !selectedProject}
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send SMS'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bulk SMS Tab */}
              <TabsContent value="bulk">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Bulk SMS</CardTitle>
                    <CardDescription>Send SMS to multiple recipients at once</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={sendBulkSMS} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumbers">Phone Numbers</Label>
                        <Textarea
                          id="phoneNumbers"
                          placeholder="233241234567&#10;233201234567&#10;233551234567"
                          value={phoneNumbers}
                          onChange={(e) => setPhoneNumbers(e.target.value)}
                          rows={8}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one phone number per line (max 1000 numbers)
                        </p>
                        <p className="text-xs font-medium">
                          {phoneNumbers.split('\n').filter(n => n.trim()).length} numbers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulkMessage">Message</Label>
                        <Textarea
                          id="bulkMessage"
                          placeholder="Enter your message..."
                          value={bulkMessage}
                          onChange={(e) => setBulkMessage(e.target.value)}
                          rows={5}
                          maxLength={1600}
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{bulkMessage.length} / 1600 characters</span>
                          <span>
                            {calculateCredits(bulkMessage) * phoneNumbers.split('\n').filter(n => n.trim()).length} total credits required
                          </span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !selectedProject}
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Bulk SMS'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - API Documentation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Integrate SMS sending into your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Send Single SMS */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Send Single SMS</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send SMS to a single phone number. Costs 1 credit per 160 characters.
                  </p>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_sms

Headers:
  X-API-Key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "phoneNumber": "233241234567",
  "message": "Your message here"
}`}
                    </pre>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-foreground mb-2">Response:</p>
                    <pre className="text-xs text-muted-foreground">
{`{
  "success": true,
  "message": "SMS sent successfully",
  "creditsUsed": 1
}`}
                    </pre>
                  </div>
                </div>

                {/* Send Bulk SMS */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">Send Bulk SMS</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send SMS to multiple recipients at once (max 1000 numbers).
                  </p>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_bulk_sms

Headers:
  X-API-Key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "phoneNumbers": [
    "233241234567",
    "233201234567",
    "233551234567"
  ],
  "message": "Your message here"
}`}
                    </pre>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-foreground mb-2">Response:</p>
                    <pre className="text-xs text-muted-foreground">
{`{
  "success": true,
  "message": "Bulk SMS sent",
  "sentCount": 3,
  "failedCount": 0,
  "creditsUsed": 3
}`}
                    </pre>
                  </div>
                </div>

                {/* Credit Calculation */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">Credit Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">1 credit</Badge>
                      <span className="text-muted-foreground">Up to 160 characters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">2 credits</Badge>
                      <span className="text-muted-foreground">161-320 characters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">3 credits</Badge>
                      <span className="text-muted-foreground">321-480 characters</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formula: Math.ceil(messageLength / 160)
                    </p>
                  </div>
                </div>

                {/* Error Codes */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">Error Codes</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">401</code>
                      <div>
                        <p className="font-medium">Invalid API Key</p>
                        <p className="text-muted-foreground text-xs">Check your API key header</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">402</code>
                      <div>
                        <p className="font-medium">Insufficient Credits</p>
                        <p className="text-muted-foreground text-xs">Top up your balance</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">400</code>
                      <div>
                        <p className="font-medium">Invalid Request</p>
                        <p className="text-muted-foreground text-xs">Check phone number format and message</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Examples */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">cURL Example</h3>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_sms \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "233241234567",
    "message": "Hello from GateKeeperPro!"
  }'`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
