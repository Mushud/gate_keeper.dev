"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dollar01Icon,
  AlertCircleIcon,
  SmartPhone01Icon,
  MailIcon,
  CheckmarkCircle01Icon,
  ShieldIcon,
  Message01Icon,
  ArrowRightIcon,
  Refresh01Icon,
  Cancel01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleAlertIcon } from "lucide-react";

interface Analytics {
  totalOTPs: number;
  verifiedOTPs: number;
  unverifiedOTPs: number;
  phoneOTPs: number;
  emailOTPs: number;
  todayOTPs: number;
  todayVerified: number;
  recentRecords: any[];
  kyc?: {
    total: number;
    successCount: number;
    notFoundCount: number;
    failedCount: number;
    totalCreditsUsed: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/account/analytics");
      const data = response.data.payload || response.data;

      // Transform backend structure to frontend structure
      const transformedData = {
        totalOTPs: data.statistics?.totalOTPs || 0,
        verifiedOTPs: data.statistics?.verifiedOTPs || 0,
        unverifiedOTPs: data.statistics?.unverifiedOTPs || 0,
        phoneOTPs: data.statistics?.byType?.phone || 0,
        emailOTPs: data.statistics?.byType?.email || 0,
        todayOTPs: data.statistics?.today?.total || 0,
        todayVerified: data.statistics?.today?.verified || 0,
        recentRecords: data.recentRecords || [],
        kyc: data.kyc
          ? {
              total: data.kyc.total || 0,
              successCount: data.kyc.successCount || 0,
              notFoundCount: data.kyc.notFoundCount || 0,
              failedCount: data.kyc.failedCount || 0,
              totalCreditsUsed: data.kyc.totalCreditsUsed || 0,
            }
          : undefined,
      };

      setAnalytics(transformedData);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const successRate = analytics
    ? (analytics.totalOTPs || 0) > 0
      ? Math.round(
          ((analytics.verifiedOTPs || 0) / (analytics.totalOTPs || 1)) * 100
        )
      : 0
    : 0;

  const stats = [
    {
      title: "Account Balance",
      value: `${user?.balance || 0}`,
      subtitle: "Credits",
      icon: Dollar01Icon,
      color: "bg-blue-500",
      trend: user?.balance && user.balance < 50 ? "Low balance" : "Available",
      trendColor:
        user?.balance && user.balance < 50 ? "text-red-600" : "text-green-600",
    },
    {
      title: "Total OTPs",
      value: loading ? "..." : (analytics?.totalOTPs || 0).toLocaleString(),
      subtitle: "All time",
      icon: Message01Icon,
      color: "bg-green-500",
      trend: `${analytics?.todayOTPs || 0} today`,
      trendColor: "text-green-600",
    },
    {
      title: "Success Rate",
      value: loading ? "..." : `${successRate}%`,
      subtitle: `${analytics?.verifiedOTPs || 0} verified`,
      icon: CheckmarkCircle01Icon,
      color: "bg-purple-500",
      trend:
        successRate >= 80
          ? "Excellent"
          : successRate >= 60
          ? "Good"
          : "Needs attention",
      trendColor:
        successRate >= 80
          ? "text-green-600"
          : successRate >= 60
          ? "text-yellow-600"
          : "text-red-600",
    },
    {
      title: "This Month",
      value: loading ? "..." : (analytics?.todayOTPs || 0).toLocaleString(),
      subtitle: "OTPs sent",
      icon: Calendar01Icon,
      color: "bg-orange-500",
      trend: `${analytics?.todayVerified || 0} verified`,
      trendColor: "text-orange-600",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics}>
          <HugeiconsIcon
            icon={Refresh01Icon}
            size={18}
            strokeWidth={1.5}
            className="mr-2"
          />
          Refresh
        </Button>
      </div>

      {/* Low Balance Warning */}
      {user?.balance && user.balance < 50 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={20}
            strokeWidth={1.5}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Low Credit Balance</h3>
            <p className="text-sm text-amber-800 mt-1">
              Your balance is running low. Top up now to avoid service
              interruptions.
            </p>
          </div>
          <Button size="sm" asChild>
            <a href="/billing">Top Up</a>
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </>
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">
                  {stat.title}
                </CardTitle>
                <div
                  className={`w-10 h-10 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}
                >
                  <HugeiconsIcon
                    icon={stat.icon}
                    size={20}
                    strokeWidth={1.5}
                    className={stat.color.replace("bg-", "text-")}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-zinc-500 mt-1">{stat.subtitle}</p>
                <p className={`text-xs ${stat.trendColor} mt-2 font-medium`}>
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* OTP Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={SmartPhone01Icon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-blue-600"
                  />
                  Phone OTPs
                </CardTitle>
                <CardDescription>SMS-based verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(analytics?.phoneOTPs || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics?.totalOTPs
                    ? `${Math.round(
                        ((analytics.phoneOTPs || 0) / analytics.totalOTPs) * 100
                      )}% of total`
                    : "0% of total"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={MailIcon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-purple-600"
                  />
                  Email OTPs
                </CardTitle>
                <CardDescription>Email-based verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {(analytics?.emailOTPs || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics?.totalOTPs
                    ? `${Math.round(
                        ((analytics.emailOTPs || 0) / analytics.totalOTPs) * 100
                      )}% of total`
                    : "0% of total"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={20}
                    strokeWidth={1.5}
                    className="text-green-600"
                  />
                  Verified OTPs
                </CardTitle>
                <CardDescription>Successfully verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {(analytics?.verifiedOTPs || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {(analytics?.unverifiedOTPs || 0).toLocaleString()} unverified
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* KYC Verification Analytics */}
      {loading ? (
        <div className="mb-8">
          <div className="h-7 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </div>
        </div>
      ) : analytics?.kyc && analytics.kyc.total > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <HugeiconsIcon
              icon={ShieldIcon}
              size={24}
              strokeWidth={1.5}
              className="text-blue-600"
            />
            KYC Phone Verifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={ShieldIcon}
                    size={18}
                    strokeWidth={1.5}
                    className="text-blue-600"
                  />
                  Total Verifications
                </CardTitle>
                <CardDescription>All KYC requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(analytics.kyc.total || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics.kyc.totalCreditsUsed || 0} credits used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={18}
                    strokeWidth={1.5}
                    className="text-green-600"
                  />
                  Successful
                </CardTitle>
                <CardDescription>Name found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {(analytics.kyc.successCount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics.kyc.total > 0
                    ? `${Math.round(
                        ((analytics.kyc.successCount || 0) /
                          analytics.kyc.total) *
                          100
                      )}% success rate`
                    : "0% success rate"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    size={18}
                    strokeWidth={1.5}
                    className="text-yellow-600"
                  />
                  Not Found
                </CardTitle>
                <CardDescription>Name not registered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {(analytics.kyc.notFoundCount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics.kyc.total > 0
                    ? `${Math.round(
                        ((analytics.kyc.notFoundCount || 0) /
                          analytics.kyc.total) *
                          100
                      )}% of total`
                    : "0% of total"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={18}
                    strokeWidth={1.5}
                    className="text-red-600"
                  />
                  Failed
                </CardTitle>
                <CardDescription>Verification errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {(analytics.kyc.failedCount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-zinc-600 mt-2">
                  {analytics.kyc.total > 0
                    ? `${Math.round(
                        ((analytics.kyc.failedCount || 0) /
                          analytics.kyc.total) *
                          100
                      )}% error rate`
                    : "0% error rate"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              {!loading && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/logs">
                    View All
                    <HugeiconsIcon
                      icon={ArrowRightIcon}
                      size={16}
                      strokeWidth={1.5}
                      className="ml-2"
                    />
                  </a>
                </Button>
              )}
            </div>
            <CardDescription>Latest OTP verifications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/2 rounded mb-2" />
                        <Skeleton className="h-3 w-1/3 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                ))}
              </div>
            ) : analytics?.recentRecords &&
              analytics.recentRecords.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentRecords
                  .slice(0, 5)
                  .map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {record.type === "phone" ? (
                          <HugeiconsIcon
                            icon={SmartPhone01Icon}
                            size={18}
                            strokeWidth={1.5}
                            className="text-blue-600"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={MailIcon}
                            size={18}
                            strokeWidth={1.5}
                            className="text-purple-600"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {record.receiver?.slice(0, 15)}...
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(record.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          record.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={48}
                  strokeWidth={1.5}
                  className="mx-auto mb-3 text-zinc-300"
                />
                <p>No recent activity</p>
                <p className="text-sm mt-1">
                  Start sending OTPs to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-zinc-200 space-y-2"
                  >
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <a
                  href="/projects"
                  className="block p-4 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Create Project</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        Set up a new OTP project
                      </div>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRightIcon}
                      size={48}
                      strokeWidth={1.5}
                      className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                    />
                  </div>
                </a>
                <a
                  href="/kyc"
                  className="block p-4 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">KYC Verification</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        Verify phone numbers
                      </div>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRightIcon}
                      size={20}
                      strokeWidth={1.5}
                      className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                    />
                  </div>
                </a>
                <a
                  href="/checkout"
                  className="block p-4 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Generate Checkout</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        Create a checkout session
                      </div>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRightIcon}
                      size={20}
                      strokeWidth={1.5}
                      className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                    />
                  </div>
                </a>
                <a
                  href="/developer"
                  className="block p-4 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">API Documentation</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        View integration guides
                      </div>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRightIcon}
                      size={20}
                      strokeWidth={1.5}
                      className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                    />
                  </div>
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
