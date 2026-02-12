'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { membersApi, projectsApi, Member } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  UserAdd01Icon, 
  Delete01Icon, 
  Edit01Icon, 
  UserGroupIcon,
  Mail01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Folder01Icon
} from '@hugeicons/core-free-icons';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  _id: string;
  name: string;
  projectID: string;
  status: string;
}

export default function TeamSettingsPage() {
  const { role, hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', phone: '', role: 'viewer' });
  const [inviting, setInviting] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editData, setEditData] = useState({ role: '', status: '', phone: '' });
  const [updating, setUpdating] = useState(false);

  // Assign projects modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningMember, setAssigningMember] = useState<Member | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Check permission
  useEffect(() => {
    if (!hasPermission('manage_members')) {
      setError('You do not have permission to manage team members.');
      setLoading(false);
      return;
    }
    loadData();
  }, [hasPermission]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersRes, projectsRes] = await Promise.all([
        membersApi.list(),
        projectsApi.list()
      ]);
      setMembers(membersRes.data.members || []);
      setProjects((projectsRes.data as any).projects || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email) {
      setError('Email is required');
      return;
    }
    if (!inviteData.phone) {
      setError('Phone number is required');
      return;
    }

    try {
      setInviting(true);
      setError('');
      await membersApi.invite(inviteData);
      setSuccess('Invitation sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowInviteModal(false);
      setInviteData({ email: '', name: '', phone: '', role: 'viewer' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setUpdating(true);
      setError('');
      await membersApi.updateMember(editingMember.memberId, editData);
      setSuccess('Member updated successfully!');
      setShowEditModal(false);
      setEditingMember(null);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update member');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setError('');
      await membersApi.removeMember(memberId);
      setSuccess('Member removed successfully!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleAssignProjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningMember) return;

    try {
      setAssigning(true);
      setError('');
      await membersApi.assignProjects(assigningMember.memberId, selectedProjects);
      setSuccess('Projects assigned successfully!');
      setShowAssignModal(false);
      setAssigningMember(null);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign projects');
    } finally {
      setAssigning(false);
    }
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setEditData({ role: member.role, status: member.status, phone: member.phone || '' });
    setShowEditModal(true);
  };

  const openAssignModal = (member: Member) => {
    setAssigningMember(member);
    setSelectedProjects(member.assignedProjects?.map(p => (p as any)._id || p) || []);
    setShowAssignModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'developer': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disabled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasPermission('manage_members')) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} />
              <p>You do not have permission to manage team members.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-10 w-36 rounded" />
        </div>

        {/* Members card skeleton */}
        <div className="border border-zinc-200 rounded-lg">
          <div className="p-6 border-b border-zinc-200 space-y-2">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 px-4 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Team Members</h1>
          <p className="text-zinc-600 mt-1">Manage users who have access to your account</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="gap-2">
          <HugeiconsIcon icon={UserAdd01Icon} size={18} />
          Invite Member
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
            Team Members ({members.length})
          </CardTitle>
          <CardDescription>
            Invite team members and assign them roles to collaborate on your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <HugeiconsIcon icon={UserGroupIcon} size={48} className="mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm mt-1">Invite members to collaborate on your projects</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-3 px-4 font-medium text-zinc-600">Member</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-600">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-600">Projects</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.memberId} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-zinc-900">{member.name || 'Pending'}</div>
                          <div className="text-sm text-zinc-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {member.role === 'developer' && (
                          <button
                            onClick={() => openAssignModal(member)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={Folder01Icon} size={14} />
                            {member.assignedProjects?.length || 0} projects
                          </button>
                        )}
                        {member.role !== 'developer' && (
                          <span className="text-sm text-zinc-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {member.status !== 'pending' && (
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                              title="Edit member"
                            >
                              <HugeiconsIcon icon={Edit01Icon} size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.memberId)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove member"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Admin</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Full access to all features</li>
                <li>• Manage team members</li>
                <li>• Create and delete projects</li>
                <li>• Access billing & payments</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Developer</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create new projects</li>
                <li>• Manage assigned projects</li>
                <li>• View billing (can make payments)</li>
                <li>• Cannot manage team members</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Viewer</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• View all projects (read-only)</li>
                <li>• View analytics & logs</li>
                <li>• View billing information</li>
                <li>• Cannot create or modify</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-zinc-700">
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input
                  id="invite-name"
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  placeholder="Kofi Manu"
                />
              </div>
              <div>
                <Label htmlFor="invite-phone">Phone Number *</Label>
                <Input
                  id="invite-phone"
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                  placeholder="+233201234567"
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting} className="flex-1">
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Member</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-zinc-700">
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingMember.email} disabled className="bg-zinc-50" />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="+233201234567"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <select
                  id="edit-role"
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={updating} className="flex-1">
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Projects Modal */}
      {showAssignModal && assigningMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign Projects</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-zinc-500 hover:text-zinc-700">
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Select projects that <strong>{assigningMember.name || assigningMember.email}</strong> can access:
            </p>
            <form onSubmit={handleAssignProjects} className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2 border border-zinc-200 rounded-lg p-3">
                {projects.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No projects available</p>
                ) : (
                  projects.map((project) => (
                    <label
                      key={project._id}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project._id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project._id));
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-300"
                      />
                      <div>
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-zinc-500">{project.status}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={assigning} className="flex-1">
                  {assigning ? 'Saving...' : 'Save Assignments'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
