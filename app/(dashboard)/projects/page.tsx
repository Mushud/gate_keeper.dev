'use client';

import { useState, useEffect, useId } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Add01Icon, Edit02Icon, Delete01Icon, Copy01Icon, EyeIcon, EyeFreeIcons, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { CardSkeleton } from '@/components/ui/skeleton';

interface Project {
  _id: string;
  name: string;
  senderID: string;
  status: string;
  createdAt: string;
}

// Simple in-memory cache for projects
let projectsCache: Project[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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

const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
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

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', senderID: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  useEffect(() => {
    // Only fetch if we don't have cached data or cache is stale
    if (!projectsCache || Date.now() - cacheTimestamp > CACHE_DURATION) {
      fetchProjects();
    } else {
      // Use cached data, no loading spinner
      setProjects(projectsCache);
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      console.log('Projects API Response:', response.data);
      const projectsData = response.data.payload?.projects || response.data.projects || [];
      console.log('Extracted projects:', projectsData);
      setProjects(projectsData);
      
      // Update cache
      projectsCache = projectsData;
      cacheTimestamp = Date.now();
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.senderID) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const response = await api.post('/api/create_project', {
        name: formData.name,
        senderID: formData.senderID,
        account: user?._id,
      });
      
      if (response.data.apiKey) {
        setNewApiKey(response.data.apiKey);
      }
      
      setSuccess('Project created successfully!');
      setFormData({ name: '', senderID: '' });
      // Invalidate cache to fetch fresh data
      projectsCache = null;
      cacheTimestamp = 0;
      fetchProjects();
      
      // Don't clear the modal or success message - let user copy the API key
      // Clear success message after 3 seconds only if no API key shown
      if (!response.data.apiKey) {
        setTimeout(() => {
          setSuccess('');
          setShowCreateModal(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/api/project/${projectId}`);
      setSuccess('Project deleted successfully');
      // Invalidate cache to fetch fresh data
      projectsCache = null;
      cacheTimestamp = 0;
      fetchProjects();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleRegenerateKey = async (projectId: string) => {
    if (!confirm('Are you sure? This will invalidate the current API key.')) return;

    try {
      const response = await api.post(`/api/project/${projectId}/regenerate-key`);
      if (response.data.apiKey) {
        setNewApiKey(response.data.apiKey);
        setShowApiKey(projectId);
      }
      setSuccess('API key regenerated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewApiKey('');
    setFormData({ name: '', senderID: '' });
    setError('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Projects</h1>
          <p className="text-zinc-600 mt-1">Manage your OTP projects and API keys</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.5} className="mr-2" />
          Create Project
        </Button>
      </div>

      {(error || success) && (
        <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : null}
        {!loading && projects.map((project) => (
          <Card key={project._id} className="relative overflow-hidden">
            <Grid />
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Sender ID: {project.senderID}
                  </CardDescription>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {project.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="text-sm text-zinc-600">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>

              {showApiKey === project._id && newApiKey && (
                <div className="bg-zinc-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-700">API Key</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
                    </Button>
                  </div>
                  <code className="text-xs bg-white p-2 rounded block break-all">
                    {newApiKey}
                  </code>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Save this key now - it won't be shown again!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRegenerateKey(project._id)}
                  className="flex-1"
                >
                  <HugeiconsIcon icon={Refresh01Icon} size={14} strokeWidth={1.5} className="mr-1" />
                  Regenerate Key
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteProject(project._id)}
                >
                  <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={1.5} className="text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-zinc-600 mb-4">No projects yet</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.5} className="mr-2" />
              Create Your First Project
            </Button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {newApiKey ? 'Project Created!' : 'Create New Project'}
              </CardTitle>
              <CardDescription>
                {newApiKey ? 'Save your API key - it will only be shown once' : 'Set up a new OTP project'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!newApiKey ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="My App"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderID">Sender ID</Label>
                    <Input
                      id="senderID"
                      placeholder="MyCompany"
                      maxLength={11}
                      value={formData.senderID}
                      onChange={(e) => setFormData({ ...formData, senderID: e.target.value })}
                    />
                    <p className="text-xs text-zinc-600">
                      This will appear in SMS messages sent to users
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={closeModal} className="flex-1" disabled={creating}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject} className="flex-1" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Project'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-3">
                      ✓ Project created successfully!
                    </p>
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-700">API Key</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(newApiKey)}
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} />
                        </Button>
                      </div>
                      <code className="text-xs bg-zinc-50 p-2 rounded block break-all">
                        {newApiKey}
                      </code>
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      ⚠️ Important: Copy this API key now. You won't be able to see it again!
                    </p>
                  </div>

                  <Button onClick={closeModal} className="w-full">
                    Done
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
