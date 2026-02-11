"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Add01Icon,
  Edit02Icon,
  Delete01Icon,
  Copy01Icon,
  EyeIcon,
  EyeFreeIcons,
  Refresh01Icon,
  Settings01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CardSkeleton } from "@/components/ui/skeleton";

interface Project {
  _id: string;
  projectID: string;
  name: string;
  senderID: string;
  senderIDApproved?: boolean;
  status: string;
  createdAt: string;
  apiKey?: string;
  services?: string[];
}

interface ProjectSettings {
  sms: {
    customMessage: string;
    enabled: boolean;
  };
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      fromAddress: string;
    };
    enabled: boolean;
  };
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

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState({ name: "", senderID: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<ProjectSettings>({
    sms: {
      customMessage:
        "Your verification code is {code}. It expires in {expiry} minutes.",
      enabled: true,
    },
    email: {
      smtp: {
        host: "",
        port: 587,
        secure: true,
        user: "",
        password: "",
        fromAddress: "",
      },
      enabled: false,
    },
  });

  const toggleApiKeyVisibility = (projectId: string) => {
    setVisibleApiKeys((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

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
      const response = await api.get("/api/projects");
      console.log("Projects API Response:", response.data);
      const projectsData =
        response.data.payload?.projects || response.data.projects || [];
      console.log("Extracted projects:", projectsData);
      setProjects(projectsData);

      // Update cache
      projectsCache = projectsData;
      cacheTimestamp = Date.now();
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.senderID) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const response = await api.post("/api/create_project", {
        name: formData.name,
        senderID: formData.senderID,
        account: user?._id,
      });

      if (response.data.apiKey) {
        setNewApiKey(response.data.apiKey);
      }

      setSuccess("Project created successfully!");
      setFormData({ name: "", senderID: "" });
      // Invalidate cache to fetch fresh data
      projectsCache = null;
      cacheTimestamp = 0;
      fetchProjects();

      // Don't clear the modal or success message - let user copy the API key
      // Clear success message after 3 seconds only if no API key shown
      if (!response.data.apiKey) {
        setTimeout(() => {
          setSuccess("");
          setShowCreateModal(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await api.delete(`/api/project/${projectId}`);
      setSuccess("Project deleted successfully");
      // Invalidate cache to fetch fresh data
      projectsCache = null;
      cacheTimestamp = 0;
      fetchProjects();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete project");
    }
  };

  const handleRegenerateKey = async (projectId: string) => {
    if (!confirm("Are you sure? This will invalidate the current API key."))
      return;

    try {
      const response = await api.post(
        `/api/project/${projectId}/regenerate-key`
      );
      if (response.data.apiKey) {
        setNewApiKey(response.data.apiKey);
        setShowApiKey(projectId);
      }
      setSuccess("API key regenerated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to regenerate API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleOpenSettings = async (project: Project) => {
    setSelectedProject(project);
    setShowSettingsModal(true);

    try {
      const response = await api.get(`/api/project/${project._id}/settings`);
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      setError(error.response?.data?.message || "Failed to load settings");
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedProject) return;

    try {
      setSavingSettings(true);

      // Validate SMS message contains {code}
      if (!settings.sms.customMessage.includes("{code}")) {
        setError("SMS message must contain {code} placeholder");
        return;
      }
      
      // Validate SMS message length (160 characters max)
      if (settings.sms.customMessage.length > 160) {
        setError("SMS message cannot exceed 160 characters");
        return;
      }

      await api.put(`/api/project/${selectedProject._id}/settings`, settings);

      setSuccess("Settings updated successfully");
      setSuccess("");
      setShowSettingsModal(false);
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      setError(error.response?.data?.error || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewApiKey("");
    setFormData({ name: "", senderID: "" });
    setError("");
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setSelectedProject(null);
    setError("");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Projects</h1>
          <p className="text-zinc-600 mt-1">
            Manage your OTP projects and API keys
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HugeiconsIcon
            icon={Add01Icon}
            size={18}
            strokeWidth={1.5}
            className="mr-2"
          />
          Create Project
        </Button>
      </div>

      {(error || success) && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            error
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}
        >
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
        {!loading && projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-zinc-600 mb-4">No projects yet</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <HugeiconsIcon
                icon={Add01Icon}
                size={18}
                strokeWidth={1.5}
                className="mr-2"
              />
              Create Your First Project
            </Button>
          </div>
        )}
        {!loading && projects.length > 0 && (
          <Card className="col-span-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-zinc-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      Project Name
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      Sender ID
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      Services
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      API Key
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-zinc-700">
                      Created
                    </th>
                    <th className="text-right p-4 font-semibold text-sm text-zinc-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project._id}
                      className="border-b last:border-0 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-zinc-900">
                          {project.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {project.projectID || project._id}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium">
                            {project.senderID}
                          </span>
                          <div className="flex items-center gap-1">
                            {project.senderIDApproved ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2} />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Pending Verification
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {project.services && project.services.length > 0 ? (
                            project.services.map((service) => {
                              // Color coding based on service type
                              const getServiceStyle = (svc: string) => {
                                if (svc === "otp")
                                  return "bg-blue-100 text-blue-700";
                                if (svc === "sms")
                                  return "bg-purple-100 text-purple-700";
                                if (svc === "campaign")
                                  return "bg-pink-100 text-pink-700";
                                if (svc === "checkout")
                                  return "bg-orange-100 text-orange-700";
                                if (svc.startsWith("kyc_"))
                                  return "bg-green-100 text-green-700";
                                return "bg-zinc-100 text-zinc-700";
                              };

                              const formatServiceName = (svc: string) => {
                                return svc
                                  .replace("kyc_", "KYC: ")
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ");
                              };

                              return (
                                <span
                                  key={service}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getServiceStyle(
                                    service
                                  )}`}
                                  title={`${service} service enabled`}
                                >
                                  {formatServiceName(service)}
                                </span>
                              );
                            })
                          ) : (
                            <div className="text-xs space-y-1">
                              <div className="text-zinc-500 font-medium">
                                Default Services:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-600">
                                  OTP
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-600">
                                  SMS
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-pink-50 text-pink-600">
                                  Campaign
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-green-50 text-green-600">
                                  KYC: Phone
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-orange-50 text-orange-600">
                                  Checkout
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 max-w-md">
                            {project.apiKey ? (
                              <>
                                <code className="flex-1 text-xs bg-zinc-100 p-2 rounded font-mono truncate">
                                  {visibleApiKeys[project._id]
                                    ? project.apiKey
                                    : "•".repeat(40)}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    toggleApiKeyVisibility(project._id)
                                  }
                                  className="shrink-0"
                                >
                                  <HugeiconsIcon
                                    icon={
                                      visibleApiKeys[project._id]
                                        ? EyeFreeIcons
                                        : EyeIcon
                                    }
                                    size={16}
                                    strokeWidth={1.5}
                                  />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(project.apiKey!)
                                  }
                                  className="shrink-0"
                                >
                                  <HugeiconsIcon
                                    icon={Copy01Icon}
                                    size={16}
                                    strokeWidth={1.5}
                                  />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-zinc-400">
                                No key available
                              </span>
                            )}
                          </div>
                          {showApiKey === project._id && newApiKey && (
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="flex-1 text-xs bg-white p-2 rounded font-mono break-all">
                                  {newApiKey}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(newApiKey)}
                                  className="shrink-0"
                                >
                                  <HugeiconsIcon
                                    icon={Copy01Icon}
                                    size={16}
                                    strokeWidth={1.5}
                                  />
                                </Button>
                              </div>
                              <p className="text-xs text-amber-700 font-medium">
                                ⚠️ Save now!
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            project.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-zinc-600 whitespace-nowrap">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSettings(project)}
                          >
                            <HugeiconsIcon
                              icon={Settings01Icon}
                              size={14}
                              strokeWidth={1.5}
                              className="mr-1"
                            />
                            Settings
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegenerateKey(project._id)}
                          >
                            <HugeiconsIcon
                              icon={Refresh01Icon}
                              size={14}
                              strokeWidth={1.5}
                              className="mr-1"
                            />
                            Regenerate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProject(project._id)}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              size={16}
                              strokeWidth={1.5}
                              className="text-red-600"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {newApiKey ? "Project Created!" : "Create New Project"}
              </CardTitle>
              <CardDescription>
                {newApiKey
                  ? "Save your API key - it will only be shown once"
                  : "Set up a new OTP project"}
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
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderID">Sender ID</Label>
                    <Input
                      id="senderID"
                      placeholder="MyCompany"
                      maxLength={11}
                      value={formData.senderID}
                      onChange={(e) =>
                        setFormData({ ...formData, senderID: e.target.value })
                      }
                    />
                    <p className="text-xs text-zinc-600">
                      This will appear in SMS messages sent to users
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> This Sender ID will be unique across our platform. 
                        Once registered, no one else can use this Sender ID except you.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      className="flex-1"
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      className="flex-1"
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Create Project"}
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
                        <span className="text-xs font-semibold text-zinc-700">
                          API Key
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(newApiKey)}
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            size={16}
                            strokeWidth={1.5}
                          />
                        </Button>
                      </div>
                      <code className="text-xs bg-zinc-50 p-2 rounded block break-all">
                        {newApiKey}
                      </code>
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      ⚠️ Important: Copy this API key now. You won't be able to
                      see it again!
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

      {/* Settings Modal */}
      {showSettingsModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedProject.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    size="sm"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="mr-2"
                      size={16}
                    />
                    {savingSettings ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeSettingsModal}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* SMS Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      SMS OTP Configuration
                    </CardTitle>
                    <CardDescription>
                      Customize how OTP messages are sent via SMS. The{" "}
                      {"{code}"} placeholder is required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smsMessage">Custom SMS Message</Label>
                      <textarea
                        id="smsMessage"
                        placeholder="Your verification code is {code}. It expires in {expiry} minutes."
                        value={settings.sms.customMessage}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sms: {
                              ...settings.sms,
                              customMessage: e.target.value,
                            },
                          })
                        }
                        maxLength={160}
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        Available placeholders: {"{code}"}, {"{expiry}"}. Maximum 160 characters ({settings.sms.customMessage.length}/160)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Settings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          SMTP Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure your SMTP server for sending OTP emails
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://www.google.com/search?q=how+to+get+SMTP+settings+gmail+zoho', '_blank')}
                      >
                        Get SMTP Help
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.example.com"
                          value={settings.email.smtp.host}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: {
                                ...settings.email,
                                smtp: {
                                  ...settings.email.smtp,
                                  host: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          placeholder="587"
                          value={settings.email.smtp.port}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: {
                                ...settings.email,
                                smtp: {
                                  ...settings.email.smtp,
                                  port: parseInt(e.target.value) || 587,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                          id="smtpUser"
                          placeholder="user@example.com"
                          value={settings.email.smtp.user}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: {
                                ...settings.email,
                                smtp: {
                                  ...settings.email.smtp,
                                  user: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          placeholder="••••••••"
                          value={settings.email.smtp.password}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: {
                                ...settings.email,
                                smtp: {
                                  ...settings.email.smtp,
                                  password: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromAddress">From Email Address</Label>
                      <Input
                        id="fromAddress"
                        placeholder="noreply@yourdomain.com (leave empty to use username)"
                        value={settings.email.smtp.fromAddress}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            email: {
                              ...settings.email,
                              smtp: {
                                ...settings.email.smtp,
                                fromAddress: e.target.value,
                              },
                            },
                          })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Optional: Specify a custom "From" address. If left empty, the SMTP username will be used.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={settings.email.smtp.secure}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            email: {
                              ...settings.email,
                              smtp: {
                                ...settings.email.smtp,
                                secure: e.target.checked,
                              },
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor="smtpSecure"
                        className="font-normal cursor-pointer"
                      >
                        Use TLS/SSL
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
