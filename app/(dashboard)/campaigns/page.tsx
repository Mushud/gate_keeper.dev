'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as XLSX from 'xlsx';
import { 
  Add01Icon, 
  Refresh01Icon, 
  ViewIcon, 
  SentIcon,
  Delete01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  Upload01Icon,
  Download01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Project {
  _id: string;
  projectID: string;
  name: string;
  senderID: string;
  status: string;
  apiKey: string;
}

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  message: string;
  receivers: string[];
  status: 'pending' | 'sent' | 'failed' | 'processing';
  totalReceivers: number;
  sentCount: number;
  failedCount: number;
  creditsUsed: number;
  createdAt: string;
  sentAt?: string;
  logs?: string[];
  project?: {
    _id: string;
    name: string;
    senderID: string;
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

export default function CampaignsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'bulk' | 'single'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Alert modal state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // Create campaign state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [receivers, setReceivers] = useState('');
  
  // Show alert modal
  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  // Filter campaigns based on type
  const filteredCampaigns = campaigns.filter(campaign => {
    if (campaignFilter === 'all') return true;
    if (campaignFilter === 'single') return campaign.name.startsWith('Single SMS -');
    if (campaignFilter === 'bulk') return !campaign.name.startsWith('Single SMS -');
    return true;
  });

  useEffect(() => {
    fetchProjects();
    fetchCampaigns(); // Fetch all campaigns on mount
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      console.log('Projects response:', response.data);
      const projectsData = response.data.payload?.projects || response.data.projects || [];
      console.log('Extracted projects:', projectsData);
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]._id);
        console.log('Auto-selected project:', projectsData[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      console.log('Fetching all campaigns for account');
      const response = await api.get('/api/account/campaigns');
      console.log('Campaigns response:', response.data);
      const campaignsData = response.data.payload?.campaigns || response.data.campaigns || [];
      console.log('Extracted campaigns:', campaignsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !name || !message || !receivers) return;

    setLoading(true);
    try {
      const project = projects.find(p => p._id === selectedProject);
      if (!project?.apiKey && !project?.projectID) {
        showAlert('Project key not found. Please try refreshing the page.', 'error');
        setLoading(false);
        return;
      }
      
      // Use apiKey if available, otherwise use projectID
      const key = project.apiKey || project.projectID;
      
      // Split by newlines, commas, or spaces, normalize phone numbers
      const receiversArray = receivers
        .split(/[\n,\s]+/) // Split by newlines, commas, or spaces
        .map(n => n.trim())
        .filter(n => n)
        .map(n => {
          // If number starts with 0, replace with 233
          if (n.startsWith('0')) {
            return '233' + n.substring(1);
          }
          return n;
        });
      
      await api.post(
        '/api/campaigns',
        { 
          name, 
          description, 
          message, 
          receivers: receiversArray 
        },
        { headers: { key } }
      );
      
      setCreateDialogOpen(false);
      setName('');
      setDescription('');
      setMessage('');
      setReceivers('');
      fetchCampaigns();
      showAlert('Campaign created successfully!', 'success');
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to create campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to execute this campaign? This will send SMS to all recipients.')) {
      return;
    }

    try {
      // Find the campaign to get its project
      const campaign = campaigns.find(c => c._id === campaignId);
      if (!campaign?.project?._id) {
        showAlert('Campaign project not found.', 'error');
        return;
      }

      const project = projects.find(p => p._id === campaign.project?._id);
      if (!project?.apiKey && !project?.projectID) {
        showAlert('Project key not found. Please try refreshing the page.', 'error');
        return;
      }
      
      // Use apiKey if available, otherwise use projectID
      const key = project.apiKey || project.projectID;
      
      await api.post(
        `/api/campaigns/${campaignId}/execute`,
        {},
        { headers: { key } }
      );
      
      showAlert('Campaign execution started! The campaign status will update as messages are sent.', 'success');
      
      // Immediately refresh the campaigns list
      fetchCampaigns();
      
      // Start polling for updates
      startPolling();
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to execute campaign', 'error');
    }
  };

  // Poll for campaign updates every 3 seconds when there are processing campaigns
  const startPolling = () => {
    const pollInterval = setInterval(() => {
      const hasProcessingCampaigns = campaigns.some(c => c.status === 'processing');
      if (hasProcessingCampaigns) {
        fetchCampaigns();
      } else {
        clearInterval(pollInterval);
      }
    }, 3000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  // Auto-start polling if there are processing campaigns on mount
  useEffect(() => {
    if (campaigns.some(c => c.status === 'processing')) {
      startPolling();
    }
  }, [campaigns]);

  const viewCampaignDetails = async (campaignId: string) => {
    setLoading(true);
    try {
      // Find the campaign to get its project
      const campaign = campaigns.find(c => c._id === campaignId);
      if (!campaign?.project?._id) {
        showAlert('Campaign project not found.', 'error');
        setLoading(false);
        return;
      }

      const project = projects.find(p => p._id === campaign.project?._id);
      if (!project?.apiKey && !project?.projectID) {
        showAlert('Project key not found. Please try refreshing the page.', 'error');
        setLoading(false);
        return;
      }
      
      // Use apiKey if available, otherwise use projectID
      const key = project.apiKey || project.projectID;
      
      const response = await api.get(`/api/campaigns/${campaignId}`, {
        headers: { key }
      });
      setSelectedCampaign(response.data.campaign);
      setViewDialogOpen(true);
    } catch (error) {
      showAlert('Failed to fetch campaign details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      sent: 'default',
      failed: 'destructive',
      processing: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-green-500" />;
      case 'failed':
        return <HugeiconsIcon icon={Cancel01Icon} className="text-red-500" />;
      case 'processing':
        return <HugeiconsIcon icon={Loading03Icon} className="text-blue-500 animate-spin" />;
      default:
        return <HugeiconsIcon icon={Calendar01Icon} className="text-gray-500" />;
    }
  };

  const downloadSampleExcel = () => {
    // Create sample data
    const sampleData = [
      { PhoneNumber: '233241234567', Name: 'John Doe' },
      { PhoneNumber: '233201234567', Name: 'Jane Smith' },
      { PhoneNumber: '233551234567', Name: 'Bob Johnson' },
      { PhoneNumber: '233261234567', Name: 'Alice Brown' },
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recipients');
    
    // Generate and download
    XLSX.writeFile(wb, 'campaign_recipients_sample.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract phone numbers (look for common column names)
        const phoneNumbers = jsonData.map((row: any) => {
          // Try different possible column names
          return row.PhoneNumber || row.phoneNumber || row.Phone || row.phone || 
                 row.Number || row.number || row.Mobile || row.mobile || 
                 Object.values(row)[0]; // Fallback to first column
        }).filter((num: any) => num); // Remove empty values
        
        // Get existing numbers
        const existingReceivers = receivers.trim();
        const existingNumbers = existingReceivers 
          ? existingReceivers.split(/[\n,\s]+/).map(n => n.trim()).filter(n => n)
          : [];
        
        // Create a Set for fast lookup and remove duplicates
        const existingSet = new Set(existingNumbers);
        
        // Filter out numbers that already exist
        const newNumbers = phoneNumbers.filter((num: any) => !existingSet.has(String(num)));
        
        if (newNumbers.length === 0) {
          showAlert('All phone numbers from the Excel file already exist in the list.', 'error');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        
        // Append only new numbers to existing textarea content
        const newContent = existingReceivers 
          ? existingReceivers + '\n' + newNumbers.join('\n')
          : newNumbers.join('\n');
        setReceivers(newContent);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        const skipped = phoneNumbers.length - newNumbers.length;
        const message = skipped > 0 
          ? `Added ${newNumbers.length} new phone numbers (${skipped} duplicates skipped)`
          : `Added ${newNumbers.length} phone numbers from Excel file`;
        showAlert(message, 'success');
      } catch (error) {
        console.error('Error reading Excel file:', error);
        showAlert('Failed to read Excel file. Please make sure it\'s a valid Excel file with phone numbers.', 'error');
      }
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <div className="relative min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <Grid />
      
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMS Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage SMS campaigns for bulk messaging
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Create a new SMS campaign to send messages to multiple recipients
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createCampaign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="Holiday Promotion 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <select
                    id="project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} - {project.senderID}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Choose which project to send this campaign from
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Special holiday offers for our customers"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Hi [name], we have special offers just for you!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={1600}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use [name] placeholder to personalize messages. {message.length} / 1600 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="receivers">Recipients</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleExcel}
                      >
                        <HugeiconsIcon icon={Download01Icon} className="mr-2 h-4 w-4" />
                        Sample Excel
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <HugeiconsIcon icon={Upload01Icon} className="mr-2 h-4 w-4" />
                        Upload Excel
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Textarea
                    id="receivers"
                    placeholder="0548215801 0241234567 233201234567&#10;0551234567, 0241112233"
                    value={receivers}
                    onChange={(e) => setReceivers(e.target.value)}
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter phone numbers separated by spaces, commas, or new lines. Numbers starting with 0 will be converted to 233 format.
                  </p>
                  <p className="text-xs font-medium">
                    {receivers.split(/[\n,\s]+/).filter(n => n.trim()).length} recipients
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription className="mt-1">
                  {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={campaignFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={campaignFilter === 'bulk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('bulk')}
                >
                  Bulk SMS
                </Button>
                <Button
                  variant={campaignFilter === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('single')}
                >
                  Single SMS
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">Campaign</th>
                    <th className="text-left p-4 font-medium text-sm">Project</th>
                    <th className="text-center p-4 font-medium text-sm">Status</th>
                    <th className="text-center p-4 font-medium text-sm">Recipients</th>
                    <th className="text-center p-4 font-medium text-sm">Sent</th>
                    <th className="text-center p-4 font-medium text-sm">Failed</th>
                    <th className="text-center p-4 font-medium text-sm">Credits</th>
                    <th className="text-left p-4 font-medium text-sm">Created</th>
                    <th className="text-center p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <HugeiconsIcon icon={Loading03Icon} className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center">
                        <p className="text-muted-foreground">No campaigns found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          {campaign.description && (
                            <div className="text-xs text-muted-foreground mt-1">{campaign.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {campaign.project ? (
                          <div className="text-sm">
                            <div className="font-medium">{campaign.project.name}</div>
                            <div className="text-xs text-muted-foreground">{campaign.project.senderID}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(campaign.status)}
                          {campaign.status === 'processing' && (
                            <div className="text-xs text-muted-foreground">
                              {Math.round((campaign.sentCount + campaign.failedCount) / campaign.totalReceivers * 100)}% complete
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium">{campaign.totalReceivers}</td>
                      <td className="p-4 text-center">
                        <span className="font-medium text-green-600">{campaign.sentCount}</span>
                        {campaign.status === 'processing' && campaign.totalReceivers > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {Math.round(campaign.sentCount / campaign.totalReceivers * 100)}%
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium text-red-600">{campaign.failedCount}</span>
                        {campaign.status === 'processing' && campaign.failedCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {Math.round(campaign.failedCount / campaign.totalReceivers * 100)}%
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center font-medium">{campaign.creditsUsed}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewCampaignDetails(campaign._id)}
                          >
                            <HugeiconsIcon icon={ViewIcon} className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => executeCampaign(campaign._id)}
                            >
                              <HugeiconsIcon icon={SentIcon} className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Campaign Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>{selectedCampaign?.description}</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Message:</h3>
                <p className="text-sm bg-muted p-3 rounded">{selectedCampaign.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedCampaign.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Recipients</p>
                  <p className="font-medium">{selectedCampaign.totalReceivers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent Count</p>
                  <p className="font-medium text-green-600">{selectedCampaign.sentCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed Count</p>
                  <p className="font-medium text-red-600">{selectedCampaign.failedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{selectedCampaign.creditsUsed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-xs">
                    {new Date(selectedCampaign.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedCampaign.logs && selectedCampaign.logs.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Delivery Logs:</h3>
                  <div className="bg-muted p-3 rounded max-h-60 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {selectedCampaign.logs.join('\n')}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Modal */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={alertType === 'success' ? 'text-green-600' : 'text-red-600'}>
              {alertType === 'success' ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5" />
                  Success
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
                  Error
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{alertMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setAlertOpen(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
