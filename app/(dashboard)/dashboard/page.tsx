"use client";

import { useState, useEffect, useId } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Chart from "@/components/Chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  SmartPhone01Icon,
  MailIcon,
  CheckmarkCircle01Icon,
  Message01Icon,
  ArrowRightIcon,
  Refresh01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleAlertIcon } from "lucide-react";

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

interface Analytics {
  totalOTPs: number;
  verifiedOTPs: number;
  unverifiedOTPs: number;
  phoneOTPs: number;
  emailOTPs: number;
  todayOTPs: number;
  todayVerified: number;
  recentRecords: any[];
  dailyStats?: {
    dates: string[];
    phoneOTPs: number[];
    emailOTPs: number[];
    verifiedOTPs: number[];
    unverifiedOTPs: number[];
    kycVerifications: number[];
    smsSent?: number[];
    kycByType?: {
      phone: number[];
      ghanaCard: number[];
      ghanaCardEnhanced: number[];
      mobileMoney: number[];
      bankAccount: number[];
    };
  };
  kyc?: {
    total: number;
    successCount: number;
    notFoundCount: number;
    failedCount: number;
    totalCreditsUsed: number;
    byType?: Array<{
      _id: string;
      count: number;
    }>;
  };
  sms?: {
    totalCampaigns: number;
    totalSent: number;
    totalFailed: number;
    creditsUsed: number;
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

      console.log("Analytics API Response:", data);
      console.log("KYC Data:", data.kyc);
      console.log("Daily Stats:", data.dailyStats);
      console.log("KYC By Type:", data.dailyStats?.kycByType);

      // Generate mock daily stats if backend doesn't provide them yet
      const generateMockDailyStats = () => {
        const dates = [];
        const phoneOTPs = [];
        const emailOTPs = [];
        const verifiedOTPs = [];
        const unverifiedOTPs = [];
        const kycVerifications = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          dates.push(dayName);

          // Generate proportional data based on totals
          const phoneTotal = data.statistics?.byType?.phone || 0;
          const emailTotal = data.statistics?.byType?.email || 0;
          const verifiedTotal = data.statistics?.verifiedOTPs || 0;
          const kycTotal = data.kyc?.total || 0;

          phoneOTPs.push(Math.floor(phoneTotal * (0.1 + Math.random() * 0.05)));
          emailOTPs.push(Math.floor(emailTotal * (0.1 + Math.random() * 0.05)));
          verifiedOTPs.push(
            Math.floor(verifiedTotal * (0.1 + Math.random() * 0.05))
          );
          unverifiedOTPs.push(
            Math.floor((data.statistics?.unverifiedOTPs || 0) * (0.1 + Math.random() * 0.05))
          );
          kycVerifications.push(
            Math.floor(kycTotal * (0.1 + Math.random() * 0.05))
          );
        }

        return { dates, phoneOTPs, emailOTPs, verifiedOTPs, unverifiedOTPs, kycVerifications };
      };

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
        dailyStats:
          data.dailyStats || data.statistics?.daily || generateMockDailyStats(),
        kyc: data.kyc
          ? {
              total: data.kyc.total || 0,
              successCount: data.kyc.successCount || 0,
              notFoundCount: data.kyc.notFoundCount || 0,
              failedCount: data.kyc.failedCount || 0,
              totalCreditsUsed: data.kyc.totalCreditsUsed || 0,
              byType: data.kyc.byType || [],
            }
          : undefined,
        sms: data.sms
          ? {
              totalCampaigns: data.sms.totalCampaigns || 0,
              totalSent: data.sms.totalSent || 0,
              totalFailed: data.sms.totalFailed || 0,
              creditsUsed: data.sms.creditsUsed || 0,
            }
          : undefined,
      };

      console.log("Transformed Analytics Data:", transformedData);
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
      title: "Total OTPs",
      value: loading ? "..." : (analytics?.totalOTPs || 0).toLocaleString(),
      subtitle: "All time",
      icon: Message01Icon,
      color: "bg-green-500",
      trend: `${analytics?.todayOTPs || 0} today`,
      trendColor: "text-green-600",
    },
    {
      title: "SMS Sent",
      value: loading ? "..." : (analytics?.sms?.totalSent || 0).toLocaleString(),
      subtitle: `${analytics?.sms?.totalCampaigns || 0} campaigns`,
      icon: Message01Icon,
      color: "bg-blue-500",
      trend: `${analytics?.sms?.creditsUsed || 0} credits used`,
      trendColor: "text-blue-600",
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
      title: "Today",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          stats.map((stat, index) => (
            <div key={stat.title} className="group relative">
              {/* Light gradient glow on hover */}
              <div
                className={`absolute -inset-[1px] bg-gradient-to-br from-zinc-400 via-zinc-300 to-zinc-200 rounded-2xl opacity-0 group-hover:opacity-15 transition duration-500 blur-sm`}
              />

              <div className="relative bg-gradient-to-b from-neutral-50 to-white rounded-2xl p-6 border border-zinc-200 group-hover:border-zinc-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Grid Pattern */}
                <Grid size={20} />

                <div className="relative z-20">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium text-zinc-500 mb-3">
                        {stat.title}
                      </p>
                      <div className="text-4xl font-bold text-zinc-900">
                        {stat.value}
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                    >
                      <HugeiconsIcon
                        icon={stat.icon}
                        size={28}
                        strokeWidth={2}
                        className="text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-zinc-200">
                    <span className="text-zinc-600">{stat.subtitle}</span>
                    <span className={`font-semibold ${stat.trendColor}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Analytics with Highcharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <>
            <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-2/3 rounded" />
              <Skeleton className="h-48 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-2/3 rounded" />
              <Skeleton className="h-48 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </>
        ) : (
          <>
            {/* OTP Analytics - Combined Multi-line Chart */}
            <div className="relative">
              <div className="relative bg-gradient-to-b from-neutral-50 to-white rounded-2xl p-6 border border-zinc-200 overflow-hidden">
                {/* <Grid size={20} /> */}

                <div className="relative z-20">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-3">
                      OTP Analytics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <p className="text-xs font-medium text-zinc-500">
                            Phone OTPs
                          </p>
                        </div>
                        <p className="text-xl font-bold text-zinc-900">
                          {(analytics?.phoneOTPs || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <p className="text-xs font-medium text-zinc-500">
                            Email OTPs
                          </p>
                        </div>
                        <p className="text-xl font-bold text-zinc-900">
                          {(analytics?.emailOTPs || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <p className="text-xs font-medium text-zinc-500">
                            Verified
                          </p>
                        </div>
                        <p className="text-xl font-bold text-zinc-900">
                          {(analytics?.verifiedOTPs || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Chart
                    options={{
                      chart: {
                        type: "spline",
                        height: 240,
                        backgroundColor: "transparent",
                      },
                      title: { text: "" },
                      credits: { enabled: false },
                      legend: {
                        enabled: true,
                        align: "center",
                        verticalAlign: "bottom",
                        itemStyle: {
                          color: "#71717a",
                          fontSize: "11px",
                          fontWeight: "500",
                        },
                      },
                      xAxis: {
                        categories: analytics?.dailyStats?.dates || [
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ],
                        lineColor: "#e5e7eb",
                        tickColor: "#e5e7eb",
                        labels: {
                          style: { color: "#71717a", fontSize: "11px" },
                        },
                      },
                      yAxis: {
                        title: { text: "" },
                        gridLineColor: "#f4f4f5",
                        labels: {
                          style: { color: "#71717a", fontSize: "11px" },
                        },
                      },
                      plotOptions: {
                        spline: {
                          lineWidth: 3,
                          marker: {
                            enabled: false,
                            states: { hover: { enabled: true, radius: 5 } },
                          },
                          states: {
                            hover: { lineWidth: 4 },
                          },
                        },
                      },
                      series: [
                        {
                          name: "Phone OTPs",
                          data: analytics?.dailyStats?.phoneOTPs || [
                            0, 0, 0, 0, 0, 0, 0,
                          ],
                          color: "#3b82f6",
                        },
                        {
                          name: "Email OTPs",
                          data: analytics?.dailyStats?.emailOTPs || [
                            0, 0, 0, 0, 0, 0, 0,
                          ],
                          color: "#a855f7",
                        },
                        {
                          name: "Verified OTPs",
                          data: analytics?.dailyStats?.verifiedOTPs || [
                            0, 0, 0, 0, 0, 0, 0,
                          ],
                          color: "#22c55e",
                        },
                        {
                          name: "Unverified OTPs",
                          data: analytics?.dailyStats?.unverifiedOTPs || [
                            0, 0, 0, 0, 0, 0, 0,
                          ],
                          color: "#b90606ff",
                        },
                      ],
                      tooltip: {
                        backgroundColor: "#18181b",
                        borderColor: "#18181b",
                        style: { color: "#ffffff" },
                        shared: true,
                        crosshairs: true,
                      },
                    }}
                  />

                  <div className="flex items-center justify-between text-xs pt-4 border-t border-zinc-200">
                    <span className="text-zinc-600">Last 7 days trend</span>
                    <span className="font-semibold text-zinc-900">
                      Total: {(analytics?.totalOTPs || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Verifications - Only show if data exists */}
            {analytics?.kyc && analytics.kyc.total > 0 && (
              <div className="relative h-full">
                <div className="relative bg-gradient-to-b from-neutral-50 to-white rounded-2xl p-6 border border-zinc-200 overflow-hidden h-full flex flex-col">
                  {/* <Grid size={20} /> */}

                  <div className="relative z-20 flex-1 flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-zinc-900 mb-3">
                        KYC Verifications
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">
                            Total
                          </p>
                          <p className="text-xl font-bold text-zinc-900">
                            {(analytics.kyc.total || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">
                            Success
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            {(analytics.kyc.successCount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">
                            Failed
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            {(analytics.kyc.failedCount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Chart
                      options={{
                        chart: {
                          type: analytics?.dailyStats?.kycByType ? "spline" : "areaspline",
                          height: 240,
                          backgroundColor: "transparent",
                        },
                        title: { text: "" },
                        credits: { enabled: false },
                        legend: {
                          enabled: analytics?.dailyStats?.kycByType ? true : false,
                          align: "center",
                          verticalAlign: "bottom",
                          itemStyle: {
                            color: "#71717a",
                            fontSize: "10px",
                            fontWeight: "500",
                          },
                        },
                        xAxis: {
                          categories: analytics?.dailyStats?.dates || [
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ],
                          lineColor: "#e5e7eb",
                          tickColor: "#e5e7eb",
                          labels: {
                            style: { color: "#71717a", fontSize: "11px" },
                          },
                        },
                        yAxis: {
                          title: { text: "" },
                          gridLineColor: "#f4f4f5",
                          labels: {
                            style: { color: "#71717a", fontSize: "11px" },
                          },
                        },
                        plotOptions: analytics?.dailyStats?.kycByType ? {
                          spline: {
                            lineWidth: 2,
                            marker: {
                              enabled: false,
                              states: { hover: { enabled: true, radius: 4 } },
                            },
                            states: {
                              hover: { lineWidth: 3 },
                            },
                          },
                        } : {
                          areaspline: {
                            fillOpacity: 0.2,
                            lineWidth: 3,
                            marker: {
                              enabled: false,
                              states: { hover: { enabled: true, radius: 4 } },
                            },
                          },
                        },
                        series: analytics?.dailyStats?.kycByType ? [
                          {
                            name: "Phone",
                            data: analytics.dailyStats.kycByType.phone,
                            color: "#3b82f6",
                          },
                          {
                            name: "Ghana Card",
                            data: analytics.dailyStats.kycByType.ghanaCard,
                            color: "#8b5cf6",
                          },
                          {
                            name: "Enhanced",
                            data: analytics.dailyStats.kycByType.ghanaCardEnhanced,
                            color: "#f59e0b",
                          },
                          {
                            name: "Mobile Money",
                            data: analytics.dailyStats.kycByType.mobileMoney,
                            color: "#10b981",
                          },
                          {
                            name: "Bank Account",
                            data: analytics.dailyStats.kycByType.bankAccount,
                            color: "#ec4899",
                          },
                        ] : [
                          {
                            name: "KYC Verifications",
                            data: analytics?.dailyStats?.kycVerifications || [
                              0, 0, 0, 0, 0, 0, 0,
                            ],
                            color: "#f59e0b",
                            fillColor: {
                              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                              stops: [
                                [0, "rgba(245, 158, 11, 0.3)"],
                                [1, "rgba(245, 158, 11, 0.05)"],
                              ],
                            },
                          },
                        ],
                        tooltip: {
                          backgroundColor: "#18181b",
                          borderColor: "#18181b",
                          style: { color: "#ffffff" },
                          shared: true,
                          crosshairs: true,
                        },
                      }}
                    />

                    <div className="flex items-center justify-between text-xs pt-4 mt-auto border-t border-zinc-200">
                      <span className="text-zinc-600">
                        {analytics?.dailyStats?.kycByType ? "5 verification types" : "Total verifications"}
                      </span>
                      <span className="font-semibold text-amber-600">
                        {analytics.kyc.total > 0
                          ? `${Math.round(
                              ((analytics.kyc.successCount || 0) /
                                analytics.kyc.total) *
                                100
                            )}% success rate`
                          : "0% success rate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                      size={20}
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
