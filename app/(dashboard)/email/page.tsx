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
import { Mail01Icon, UserMultiple02Icon, Refresh01Icon, CheckmarkCircle01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';

interface Project {
  _id: string;
  projectID: string;
  name: string;
  senderID: string;
  status: string;
  apiKey: string;
  settings?: {
    email?: {
      smtp?: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        fromAddress?: string;
      };
    };
  };
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

export default function EmailPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Single Email state
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isHtml, setIsHtml] = useState(false);

  // Bulk Email state
  const [emails, setEmails] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkIsHtml, setBulkIsHtml] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
    //   console.log('Projects response:', response.data);
      const allProjects = response.data.payload?.projects || response.data.projects || [];
    //   console.log('All projects:', allProjects);
      // Filter projects with custom SMTP configuration
      const emailProjects = allProjects.filter((p: Project) => p.settings?.email?.smtp?.host);
    //   console.log('Email projects with SMTP:', emailProjects);
      setProjects(emailProjects);
      if (emailProjects.length > 0) {
        setSelectedProject(emailProjects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const sendSingleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !email || !subject || !message) return;

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
        '/api/send_email',
        { email, subject, message, isHtml },
        { headers: { 'X-API-Key': project.apiKey } }
      );
      
      setResult({ success: true, data: response.data });
      setEmail('');
      setSubject('');
      setMessage('');
      setIsHtml(false);
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to send email' 
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !emails || !bulkSubject || !bulkMessage) return;

    setLoading(true);
    setResult(null);

    try {
      const project = projects.find(p => p._id === selectedProject);
      if (!project?.apiKey) {
        setResult({ success: false, error: 'API key not found. Please regenerate the API key for this project.' });
        setLoading(false);
        return;
      }
      
      const emailsArray = emails.split('\n').map(e => e.trim()).filter(e => e);
      
      const response = await api.post(
        '/api/send_bulk_email',
        { emails: emailsArray, subject: bulkSubject, message: bulkMessage, isHtml: bulkIsHtml },
        { headers: { 'X-API-Key': project.apiKey } }
      );
      
      setResult({ success: true, data: response.data });
      setEmails('');
      setBulkSubject('');
      setBulkMessage('');
      setBulkIsHtml(false);
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to send bulk email' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <Grid />
      
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Send Email</h1>
          <p className="text-muted-foreground mt-2">
            Send emails to your users using custom SMTP
          </p>
        </div>

        {projects.length === 0 && (
          <Card className="mb-6 border-amber-500">
            <CardHeader>
              <CardTitle className="text-amber-600">Custom SMTP Required</CardTitle>
              <CardDescription>
                Email sending requires custom SMTP configuration. Please configure SMTP settings in your project settings first.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Email Sending Interface */}
          <div className="space-y-6">
            {/* Project Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Project</CardTitle>
                <CardDescription>Choose which project to send email from (SMTP configured projects only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    disabled={projects.length === 0}
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
                    {result.success ? 'Email Sent Successfully' : 'Failed to Send Email'}
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
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">{result.error}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Email Tabs */}
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" />
                  Single Email
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <HugeiconsIcon icon={UserMultiple02Icon} className="h-4 w-4" />
                  Bulk Email
                </TabsTrigger>
              </TabsList>

              {/* Single Email Tab */}
              <TabsContent value="single">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Single Email</CardTitle>
                    <CardDescription>Send email to a single recipient</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={sendSingleEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter recipient's email address
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Enter email subject..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Enter your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={8}
                          maxLength={10000}
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{message.length} / 10,000 characters</span>
                          <span>1 credit required</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isHtml"
                          checked={isHtml}
                          onChange={(e) => setIsHtml(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isHtml" className="text-sm font-normal cursor-pointer">
                          Send as HTML (message contains HTML markup)
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !selectedProject || projects.length === 0}
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Email'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bulk Email Tab */}
              <TabsContent value="bulk">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Bulk Email</CardTitle>
                    <CardDescription>Send email to multiple recipients at once</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={sendBulkEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="emails">Email Addresses</Label>
                        <Textarea
                          id="emails"
                          placeholder="user@example.com&#10;john@company.com&#10;jane@email.com"
                          value={emails}
                          onChange={(e) => setEmails(e.target.value)}
                          rows={8}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one email address per line (max 1000 emails)
                        </p>
                        <p className="text-xs font-medium">
                          {emails.split('\n').filter(e => e.trim()).length} emails
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulkSubject">Subject</Label>
                        <Input
                          id="bulkSubject"
                          placeholder="Enter email subject..."
                          value={bulkSubject}
                          onChange={(e) => setBulkSubject(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulkMessage">Message</Label>
                        <Textarea
                          id="bulkMessage"
                          placeholder="Enter your message..."
                          value={bulkMessage}
                          onChange={(e) => setBulkMessage(e.target.value)}
                          rows={8}
                          maxLength={10000}
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{bulkMessage.length} / 10,000 characters</span>
                          <span>
                            {emails.split('\n').filter(e => e.trim()).length} total credits required
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bulkIsHtml"
                          checked={bulkIsHtml}
                          onChange={(e) => setBulkIsHtml(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="bulkIsHtml" className="text-sm font-normal cursor-pointer">
                          Send as HTML (message contains HTML markup)
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !selectedProject || projects.length === 0}
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Bulk Email'}
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
                <CardDescription>Integrate email sending into your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Send Single Email */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Send Single Email</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send email to a single recipient. Costs 1 credit per email.
                  </p>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_email

Headers:
  X-API-Key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "subject": "Your subject here",
  "message": "Your message here",
  "isHtml": false
}`}
                    </pre>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-foreground mb-2">Response:</p>
                    <pre className="text-xs text-muted-foreground">
{`{
  "success": true,
  "message": "Email sent successfully",
  "creditsUsed": 1
}`}
                    </pre>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Note:</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">isHtml: true</code> to send HTML formatted emails. When false or omitted, sends as plain text.
                    </p>
                  </div>
                </div>

                {/* Send Bulk Email */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">Send Bulk Email</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send email to multiple recipients at once (max 1000 emails).
                  </p>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_bulk_email

Headers:
  X-API-Key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "emails": [
    "user@example.com",
    "john@company.com",
    "jane@email.com"
  ],
  "subject": "Your subject here",
  "message": "Your message here",
  "isHtml": false
}`}
                    </pre>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-foreground mb-2">Response:</p>
                    <pre className="text-xs text-muted-foreground">
{`{
  "success": true,
  "message": "Bulk email sent",
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
                      <span className="text-muted-foreground">Per email sent</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Each email costs 1 credit regardless of message length.
                    </p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">Requirements</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">SMTP</Badge>
                      <span className="text-muted-foreground">Custom SMTP configuration required in project settings</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">Credits</Badge>
                      <span className="text-muted-foreground">Sufficient credits in your account</span>
                    </div>
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
                        <p className="text-muted-foreground text-xs">Check email format, subject, and message</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">500</code>
                      <div>
                        <p className="font-medium">SMTP Configuration Required</p>
                        <p className="text-muted-foreground text-xs">Configure SMTP settings in project</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Examples */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold mb-3">cURL Example</h3>
                  <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-zinc-100">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api.gatekeeperpro.live'}/api/send_email \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "subject": "Hello from GateKeeperPro",
    "message": "This is a test email!",
    "isHtml": false
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
