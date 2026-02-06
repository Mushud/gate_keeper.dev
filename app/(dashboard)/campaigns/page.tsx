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
  Download01Icon,
  RotateClockwiseIcon
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

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  message: string;
  subject?: string; // For email campaigns
  type?: 'email' | 'sms'; // Campaign type
  receivers: string[];
  status: 'pending' | 'sent' | 'failed' | 'processing';
  totalReceivers: number;
  sentCount: number;
  failedCount: number;
  creditsUsed: number;
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  logs?: string[];
  project?: string | {
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
  const [loadingCampaignId, setLoadingCampaignId] = useState<string | null>(null);
  const [executingCampaignId, setExecutingCampaignId] = useState<string | null>(null);
  const [retryingCampaignId, setRetryingCampaignId] = useState<string | null>(null);
  const [refreshingCampaignId, setRefreshingCampaignId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'bulk' | 'single' | 'email'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Alert modal state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('success');

  // Create campaign state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [receivers, setReceivers] = useState('');
  const [campaignType, setCampaignType] = useState<'sms' | 'email'>('sms');
  
  // Show alert modal
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  // Filter campaigns based on type (simplified since backend now handles bulk/single filtering)
  const filteredCampaigns = campaigns.filter(campaign => {
    if (campaignFilter === 'all') return true;
    if (campaignFilter === 'email') return campaign.type === 'email';
    if (campaignFilter === 'single') return campaign.type === 'sms'; // Backend already filtered
    if (campaignFilter === 'bulk') return campaign.type === 'sms'; // Backend already filtered
    return true;
  });

  // Handle tab change - fetch specific data for each tab
  const handleFilterChange = async (filter: 'all' | 'bulk' | 'single' | 'email') => {
    setCampaignFilter(filter);
    setLoading(true);
    try {
      if (filter === 'all') {
        await fetchCampaigns();
      } else if (filter === 'bulk') {
        // Fetch only bulk SMS campaigns from dedicated endpoint
        const response = await api.get('/api/account/campaigns/bulk');
        console.log('Bulk campaigns response:', response.data);
        const bulkCampaigns = response.data.payload?.campaigns || response.data.campaigns || [];
        setCampaigns(bulkCampaigns.map((c: Campaign) => ({ ...c, type: 'sms' })));
      } else if (filter === 'single') {
        // Fetch only single SMS campaigns from dedicated endpoint
        const response = await api.get('/api/account/campaigns/single');
        console.log('Single campaigns response:', response.data);
        const singleCampaigns = response.data.payload?.campaigns || response.data.campaigns || [];
        setCampaigns(singleCampaigns.map((c: Campaign) => ({ ...c, type: 'sms' })));
      } else if (filter === 'email') {
        // Fetch only email campaigns
        const emailResponse = await api.get('/api/account/email_campaigns');
        console.log('Email campaigns response:', emailResponse.data);
        const emailCampaigns = emailResponse.data.payload?.campaigns || emailResponse.data.campaigns || [];
        setCampaigns(emailCampaigns.map((c: Campaign) => ({ ...c, type: 'email' })));
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Fetch both SMS and email campaigns
      const smsResponse = await api.get('/api/account/campaigns');
      console.log('SMS Response:', smsResponse.data);
      const smsCampaigns = smsResponse.data.payload?.campaigns || smsResponse.data.campaigns || [];
      
      const emailResponse = await api.get('/api/account/email_campaigns');
      console.log('Email Response:', emailResponse.data);
      const emailCampaigns = emailResponse.data.payload?.campaigns || emailResponse.data.campaigns || [];
      
      console.log('SMS campaigns fetched:', smsCampaigns.length);
      console.log('Email campaigns fetched:', emailCampaigns.length);
      
      // Mark campaigns with their type for display
      const allCampaigns = [
        ...smsCampaigns.map((c: Campaign) => ({ ...c, type: 'sms' })),
        ...emailCampaigns.map((c: Campaign) => ({ ...c, type: 'email' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('Total campaigns:', allCampaigns.length);
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCampaign = async (campaignId: string) => {
    setRefreshingCampaignId(campaignId);
    try {
      const campaign = campaigns.find(c => c._id === campaignId);
      if (!campaign) {
        console.error('Campaign not found in state:', campaignId);
        return;
      }

      // Use the account-level single campaign endpoint
      const response = await api.get(`/api/account/campaigns/${campaignId}`);
      const updatedCampaign = response.data.campaign;
      
      if (updatedCampaign) {
        // Preserve the type from the original campaign
        const campaignWithType = { ...updatedCampaign, type: campaign.type || 'sms' };
        
        // Update only this campaign in the state
        setCampaigns(prev => 
          prev.map(c => c._id === campaignId ? campaignWithType : c)
        );
        console.log('Campaign refreshed:', campaignId, 'sent:', updatedCampaign.sentCount, '/', updatedCampaign.totalReceivers);
      }
    } catch (error) {
      console.error(`Failed to fetch campaign ${campaignId}:`, error);
    } finally {
      setRefreshingCampaignId(null);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !name || !message || !receivers) return;
    
    if (campaignType === 'email' && !subject) {
      showAlert('Email subject is required for email campaigns', 'error');
      return;
    }

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
      
      // Split by newlines, commas, or spaces, normalize receivers
      const receiversArray = receivers
        .split(/[\n,\s]+/) // Split by newlines, commas, or spaces
        .map(n => n.trim())
        .filter(n => n)
        .map(n => {
          // For SMS: Normalize phone numbers
          if (campaignType === 'sms') {
            // If 9 digits, prepend 0 (e.g., 548215801 -> 0548215801)
            if (n.length === 9 && /^\d{9}$/.test(n)) {
              n = '0' + n;
            }
            // If starts with 0, replace with 233 (e.g., 0548215801 -> 233548215801)
            if (n.startsWith('0')) {
              return '233' + n.substring(1);
            }
          }
          return n;
        });
      
      const endpoint = campaignType === 'sms' ? '/api/campaigns' : '/api/email_campaigns';
      
      // For campaigns with large receiver lists, use chunking (2500 batch size)
      if (receiversArray.length > 2500) {
        showAlert(`Creating ${campaignType === 'email' ? 'email' : 'SMS'} campaign with ${receiversArray.length.toLocaleString()} recipients. Please wait...`, 'info');
        
        // Create campaign with first chunk (up to 2500)
        const firstChunkSize = 2500;
        const firstChunk = receiversArray.slice(0, firstChunkSize);
        
        const payload = campaignType === 'sms' 
          ? { name, description, message, receivers: firstChunk }
          : { name, description, subject, message, receivers: firstChunk };
        
        const createResponse = await api.post(endpoint, payload, { headers: { key } });
        const campaignId = createResponse.data?.campaign?._id;
        
        if (!campaignId) {
          showAlert('Failed to create campaign', 'error');
          setLoading(false);
          return;
        }
        
        // Add remaining receivers in chunks of 2500
        let uploadedCount = firstChunkSize;
        for (let i = firstChunkSize; i < receiversArray.length; i += firstChunkSize) {
          const chunk = receiversArray.slice(i, i + firstChunkSize);
          const addReceiversEndpoint = campaignType === 'sms' 
            ? `/api/campaigns/${campaignId}/receivers`
            : `/api/email_campaigns/${campaignId}/receivers`;
          
          await api.post(addReceiversEndpoint, 
            { receivers: chunk }, 
            { headers: { key } }
          );
          uploadedCount += chunk.length;
          showAlert(`Uploading: ${uploadedCount.toLocaleString()} of ${receiversArray.length.toLocaleString()} recipients uploaded`, 'info');
        }
        
        setCreateDialogOpen(false);
        setName('');
        setDescription('');
        setMessage('');
        setSubject('');
        setReceivers('');
        setCampaignType('sms');
        fetchCampaigns();
        showAlert(`Campaign created successfully with all ${receiversArray.length.toLocaleString()} recipients!`, 'success');
      } else {
        // Standard flow for small campaigns (under 2500 recipients)
        const payload = campaignType === 'sms' 
          ? { name, description, message, receivers: receiversArray }
          : { name, description, subject, message, receivers: receiversArray };
        
        await api.post(endpoint, payload, { headers: { key } });
        
        setCreateDialogOpen(false);
        setName('');
        setDescription('');
        setMessage('');
        setSubject('');
        setReceivers('');
        setCampaignType('sms');
        fetchCampaigns();
        showAlert('Campaign created successfully!', 'success');
      }
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

    setExecutingCampaignId(campaignId);
    try {
      // Find the campaign to get its project and type
      const campaign: any = campaigns.find(c => c._id === campaignId);
      if (!campaign?.project) {
        showAlert('Campaign project not found.', 'error');
        setExecutingCampaignId(null);
        return;
      }

      // Handle project as both string ID and object
      const projectId = typeof campaign.project === 'string' ? campaign.project : campaign.project._id;
      const project = projects.find(p => p._id === projectId);
      if (!project?.apiKey && !project?.projectID) {
        showAlert('Project key not found. Please try refreshing the page.', 'error');
        setExecutingCampaignId(null);
        return;
      }
      
      // Use apiKey if available, otherwise use projectID
      const key = project.apiKey || project.projectID;
      
      const endpoint = campaign.type === 'email' 
        ? `/api/email_campaigns/${campaignId}/execute`
        : `/api/campaigns/${campaignId}/execute`;
      
      await api.post(endpoint, {}, { headers: { key } });
      
      showAlert('Campaign execution started! The campaign will update automatically.', 'success');
      
      // Refresh only this campaign
      setTimeout(() => {
        fetchSingleCampaign(campaignId);
      }, 500);
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to execute campaign', 'error');
    } finally {
      setExecutingCampaignId(null);
    }
  };

  const retryCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) return;

    const remainingCount = campaign.totalReceivers - campaign.sentCount;
    if (!confirm(`This will retry sending to the ${remainingCount} remaining recipients. Continue?`)) {
      return;
    }

    setRetryingCampaignId(campaignId);
    try {
      const response = await api.post(`/api/account/campaigns/${campaignId}/retry`);
      
      showAlert(
        `Retry started! Sending to ${response.data.remainingToSend} remaining recipients.`, 
        'success'
      );
      
      // Update the campaign locally to mark it as actively processing (hide retry button)
      setCampaigns(prev => 
        prev.map(c => c._id === campaignId 
          ? { ...c, status: 'processing' as const, updatedAt: new Date().toISOString() } 
          : c
        )
      );
      
      // Refresh just this campaign after a short delay to get updated status
      setTimeout(() => {
        fetchSingleCampaign(campaignId);
      }, 1000);
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to retry campaign', 'error');
    } finally {
      setRetryingCampaignId(null);
    }
  };

  const viewCampaignDetails = async (campaignId: string) => {
    setLoadingCampaignId(campaignId);
    try {
      // Find the campaign to get its project
      const campaign = campaigns.find(c => c._id === campaignId);
      if (!campaign?.project) {
        showAlert('Campaign project not found.', 'error');
        setLoadingCampaignId(null);
        return;
      }

      // Handle project as both string ID and object
      const projectId = typeof campaign.project === 'string' ? campaign.project : campaign.project._id;
      const project = projects.find(p => p._id === projectId);
      if (!project?.apiKey && !project?.projectID) {
        showAlert('Project key not found. Please try refreshing the page.', 'error');
        setLoadingCampaignId(null);
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
      setLoadingCampaignId(null);
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
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const workbook = XLSX.read(data, { type: isCsv ? 'string' : 'binary' });
        
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
        }).filter((num: any) => num) // Remove empty values
          .map((num: any) => {
            // Normalize phone numbers for SMS campaigns
            if (campaignType === 'sms') {
              let n = String(num).trim();
              // If 9 digits, prepend 0
              if (n.length === 9 && /^\d{9}$/.test(n)) {
                n = '0' + n;
              }
              // If starts with 0, replace with 233
              if (n.startsWith('0')) {
                return '233' + n.substring(1);
              }
              return n;
            }
            return String(num).trim();
          });
        
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
          showAlert('All phone numbers from the file already exist in the list.', 'error');
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
          : `Added ${newNumbers.length} phone numbers from file`;
        showAlert(message, 'success');
      } catch (error) {
        console.error('Error reading file:', error);
        showAlert('Failed to read file. Please make sure it\'s a valid Excel or CSV file with phone numbers.', 'error');
      }
    };
    
    // Use appropriate reader method based on file type
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
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
                  <Label>Campaign Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="campaignType"
                        value="sms"
                        checked={campaignType === 'sms'}
                        onChange={(e) => setCampaignType(e.target.value as 'sms' | 'email')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="campaignType"
                        value="email"
                        checked={campaignType === 'email'}
                        onChange={(e) => setCampaignType(e.target.value as 'sms' | 'email')}
                        className="h-4 w-4"
                        disabled={!projects.some(p => p.settings?.email?.smtp?.host)}
                      />
                      <span className="text-sm">Email</span>
                    </label>
                  </div>
                  {campaignType === 'email' && !projects.some(p => p.settings?.email?.smtp?.host) && (
                    <p className="text-xs text-amber-600">
                      Email campaigns require custom SMTP configuration. Please configure SMTP settings in a project first.
                    </p>
                  )}
                </div>

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
                    {projects
                      .filter(project => {
                        if (campaignType === 'email') {
                          return project.settings?.email?.smtp?.host;
                        }
                        return true;
                      })
                      .map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name} - {project.senderID}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {campaignType === 'email' 
                      ? 'Only projects with custom SMTP configuration are shown'
                      : 'Choose which project to send this campaign from'}
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

                {campaignType === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Special Holiday Offers - Don't Miss Out!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">{campaignType === 'email' ? 'Email Body' : 'SMS Message'}</Label>
                  <Textarea
                    id="message"
                    placeholder={campaignType === 'email' 
                      ? "Dear [name],\n\nWe have special offers just for you! Click the link below to explore:\nhttps://example.com/offers"
                      : "Hi [name], we have special offers just for you!"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={campaignType === 'email' ? 8 : 5}
                    maxLength={1600}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use [name] placeholder to personalize messages. {message.length} / 1600 characters
                    {campaignType === 'sms' && message.length > 0 && (
                      <span className="ml-2 font-medium text-blue-600">
                        • {Math.ceil(message.length / 160)} credit{Math.ceil(message.length / 160) > 1 ? 's' : ''} per SMS
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="receivers">{campaignType === 'email' ? 'Email Recipients' : 'Phone Recipients'}</Label>
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
                        Upload File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Textarea
                    id="receivers"
                    placeholder={campaignType === 'email'
                      ? "user@example.com&#10;john.doe@company.com&#10;jane@email.com"
                      : "0548215801 0241234567 233201234567&#10;0551234567, 0241112233"}
                    value={receivers}
                    onChange={(e) => setReceivers(e.target.value)}
                    onBlur={(e) => {
                      // Normalize phone numbers on blur (when user leaves the field)
                      if (campaignType === 'sms') {
                        const normalized = e.target.value
                          .split(/[\n,\s]+/)
                          .map(n => n.trim())
                          .filter(n => n)
                          .map(n => {
                            // If 9 digits, prepend 0
                            if (n.length === 9 && /^\d{9}$/.test(n)) {
                              n = '0' + n;
                            }
                            // If starts with 0, replace with 233
                            if (n.startsWith('0')) {
                              return '233' + n.substring(1);
                            }
                            return n;
                          })
                          .join('\n');
                        setReceivers(normalized);
                      }
                    }}
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {campaignType === 'email'
                      ? 'Enter email addresses separated by spaces, commas, or new lines. Maximum: 11,000 recipients per campaign.'
                      : 'Enter phone numbers separated by spaces, commas, or new lines. 9-digit numbers will be prefixed with 0, then converted to 233 format. Maximum: 11,000 recipients per campaign.'}
                  </p>
                  <p className="text-xs font-medium">
                    {receivers.split(/[\n,\s]+/).filter(n => n.trim()).length} recipients
                    {campaignType === 'sms' && message.length > 0 && receivers.trim() && (
                      <span className="ml-2 text-blue-600">
                        • Total: {(Math.ceil(message.length / 160) * receivers.split(/[\n,\s]+/).filter(n => n.trim()).length).toLocaleString()} credits needed
                      </span>
                    )}
                    {campaignType === 'email' && receivers.trim() && (
                      <span className="ml-2 text-blue-600">
                        • Total: {receivers.split(/[\n,\s]+/).filter(n => n.trim()).length} credits needed
                      </span>
                    )}

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
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </Button>
                <Button
                  variant={campaignFilter === 'bulk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('bulk')}
                >
                  Bulk SMS
                </Button>
                <Button
                  variant={campaignFilter === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('single')}
                >
                  Single SMS
                </Button>
                <Button
                  variant={campaignFilter === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('email')}
                >
                  Email
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{campaign.name}</span>
                            <Badge variant={campaign.type === 'email' ? 'default' : 'secondary'} className="text-xs">
                              {campaign.type === 'email' ? 'Email' : 'SMS'}
                            </Badge>
                          </div>
                          {campaign.description && (
                            <div className="text-xs text-muted-foreground mt-1">{campaign.description}</div>
                          )}
                          {campaign.type === 'email' && campaign.subject && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Subject:</span> {campaign.subject}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {campaign.project ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {typeof campaign.project === 'string' ? 'Project' : campaign.project.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {typeof campaign.project === 'string' ? campaign.project : campaign.project.senderID}
                            </div>
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
                            disabled={loadingCampaignId === campaign._id}
                          >
                            {loadingCampaignId === campaign._id ? (
                              <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                            ) : (
                              <HugeiconsIcon icon={ViewIcon} className="h-4 w-4" />
                            )}
                          </Button>
                          {campaign.status === 'processing' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSingleCampaign(campaign._id)}
                                title="Refresh campaign status"
                                disabled={refreshingCampaignId === campaign._id}
                              >
                                {refreshingCampaignId === campaign._id ? (
                                  <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                                ) : (
                                  <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4" />
                                )}
                              </Button>
                              {/* Only show retry button if campaign hasn't been updated in the last minute (stuck) */}
                              {(() => {
                                const lastUpdate = campaign.updatedAt ? new Date(campaign.updatedAt) : new Date(campaign.createdAt);
                                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
                                const isStuck = lastUpdate < oneMinuteAgo;
                                return isStuck ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => retryCampaign(campaign._id)}
                                    title={`Retry remaining ${campaign.totalReceivers - campaign.sentCount} recipients`}
                                    disabled={retryingCampaignId === campaign._id}
                                    className="bg-orange-500 hover:bg-orange-600"
                                  >
                                    {retryingCampaignId === campaign._id ? (
                                      <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <HugeiconsIcon icon={RotateClockwiseIcon} className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : null;
                              })()}
                            </>
                          )}
                          {campaign.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => executeCampaign(campaign._id)}
                              title="Send campaign"
                              disabled={executingCampaignId === campaign._id}
                            >
                              {executingCampaignId === campaign._id ? (
                                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                              ) : (
                                <HugeiconsIcon icon={SentIcon} className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {campaign.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeCampaign(campaign._id)}
                              title="Resend campaign"
                              disabled={executingCampaignId === campaign._id}
                            >
                              {executingCampaignId === campaign._id ? (
                                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                              ) : (
                                <HugeiconsIcon icon={SentIcon} className="h-4 w-4" />
                              )}
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
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={selectedCampaign.type === 'email' ? 'default' : 'secondary'} className="text-xs">
                  {selectedCampaign.type === 'email' ? '📧 Email Campaign' : '💬 SMS Campaign'}
                </Badge>
              </div>

              {selectedCampaign.type === 'email' && selectedCampaign.subject && (
                <div>
                  <h3 className="font-semibold mb-2">Subject:</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedCampaign.subject}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">{selectedCampaign.type === 'email' ? 'Email Body:' : 'Message:'}</h3>
                <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{selectedCampaign.message}</p>
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
            <DialogTitle className={alertType === 'success' ? 'text-green-600' : alertType === 'error' ? 'text-red-600' : 'text-blue-600'}>
              {alertType === 'success' ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5" />
                  Success
                </div>
              ) : alertType === 'error' ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
                  Error
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Loading03Icon} className="h-5 w-5 animate-spin" />
                  Processing
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{alertMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setAlertOpen(false)}>
              {alertType === 'info' ? 'Continue' : 'OK'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
