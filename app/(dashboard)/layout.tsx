"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import {
  Home01Icon,
  Folder01Icon,
  ShieldIcon,
  ShoppingCart01Icon,
  File01Icon,
  BookOpen01Icon,
  CreditCardIcon,
  Settings02Icon,
  Menu01Icon,
  Cancel01Icon,
  Logout01Icon,
  Message01Icon,
  MailSend01Icon,
  ArrowDown01Icon,
  Mail01Icon,
  UserGroupIcon,
  Building06Icon,
  UserIcon,
  Tick01Icon,
  ArrowDataTransferHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasPermission, hasMultipleAccounts, accessibleAccounts, switchAccount, isMember, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "messaging",
    "authentication",
    "Settings",
  ]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  useEffect(() => {
    console.log(
      "Dashboard layout - loading:",
      loading,
      "user:",
      user ? "exists" : "null"
    );
    if (!loading && !user) {
      console.log("No user found, redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Projects", href: "/projects", icon: "folder" },
    {
      name: "Messaging",
      icon: "message",
      group: true,
      items: [
        { name: "SMS", href: "/sms", icon: "message" },
        { name: "Email", href: "/email", icon: "mail" },
        { name: "Campaigns", href: "/campaigns", icon: "mail-send" },
      ],
    },
    {
      name: "Developer Tools",
      icon: "shield",
      group: true,
      items: [
        { name: "One Time Passwords", href: "/developer", icon: "book-open" },
        { name: "OTP Host", href: "/checkout", icon: "shopping-cart" },
      ],
    },
    { name: "KYC Verification", href: "/kyc", icon: "shield" },
    // { name: 'Analytics', href: '/analytics', icon: 'bar-chart' },
    { name: "Logs", href: "/logs", icon: "file-text" },
    { name: "Billing", href: "/billing", icon: "credit-card" },
    { name: "Transactions", href: "/transactions", icon: "credit-card" },
    {
      name: "Settings",
      icon: "settings",
      group: true,
      items: [
        { name: "Account", href: "/settings", icon: "settings" },
        ...(hasPermission("manage_members")
          ? [{ name: "Team", href: "/settings/team", icon: "users" }]
          : []),
      ],
    },
  ];

  const renderIcon = (iconName: string) => {
    const size = 20;
    const strokeWidth = 1.5;

    switch (iconName) {
      case "message":
        return (
          <HugeiconsIcon
            icon={Message01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "mail":
        return (
          <HugeiconsIcon
            icon={Mail01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "mail-send":
        return (
          <HugeiconsIcon
            icon={MailSend01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "home":
        return (
          <HugeiconsIcon
            icon={Home01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "folder":
        return (
          <HugeiconsIcon
            icon={Folder01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "shield":
        return (
          <HugeiconsIcon
            icon={ShieldIcon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "shopping-cart":
        return (
          <HugeiconsIcon
            icon={ShoppingCart01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "file-text":
        return (
          <HugeiconsIcon
            icon={File01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "book-open":
        return (
          <HugeiconsIcon
            icon={BookOpen01Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "credit-card":
        return (
          <HugeiconsIcon
            icon={CreditCardIcon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "settings":
        return (
          <HugeiconsIcon
            icon={Settings02Icon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      case "users":
        return (
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={size}
            strokeWidth={strokeWidth}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="GateKeeperPro"
              className="w-8 h-8 object-contain"
            />
            <div className="font-bold">GateKeeperPro</div>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {sidebarOpen ? (
              <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={1.5} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-64 bg-black border-r border-zinc-700 flex flex-col shadow-2xl
          z-50 lg:z-auto
          transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:block p-6 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="GateKeeperPro"
              className="w-10 h-10 object-contain drop-shadow-lg"
            />
            <div>
              <div className="font-bold text-lg text-white">GateKeeperPro</div>
              <div className="text-xs text-zinc-400">Developer Portal</div>
            </div>
          </Link>
        </div>

        {/* Mobile Top Spacing */}
        <div className="lg:hidden h-20" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item: any) => {
            if (item.group) {
              const isExpanded = expandedGroups.includes(
                item.name.toLowerCase()
              );
              const isGroupActive = item.items?.some(
                (subItem: any) => pathname === subItem.href
              );

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name.toLowerCase())}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isGroupActive
                        ? "bg-zinc-800 text-white border border-zinc-600"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border border-zinc-800"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span className="flex-1 text-left">{item.name}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      strokeWidth={1.5}
                      className={`transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.items?.map((subItem: any) => {
                        const isActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            prefetch={true}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? "bg-zinc-800 text-white border border-zinc-600 shadow-md"
                                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border border-zinc-800"
                            }`}
                          >
                            {renderIcon(subItem.icon)}
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white border border-zinc-600 shadow-md"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border border-zinc-800"
                }`}
              >
                {renderIcon(item.icon)}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-zinc-800">
          {/* Account Balance */}
          <div className="mb-3 px-4 py-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">Account Balance</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-white">
                {user.balance || 0}
              </div>
              <div className="text-sm text-zinc-400">Credits</div>
            </div>
            {user.balance && user.balance < 50 && (
              <div className="text-xs text-yellow-400 mt-1">⚠️ Low balance</div>
            )}
          </div>

          {/* Account Switcher (if multiple accounts) */}
          {hasMultipleAccounts && (
            <div className="relative mb-3">
              <button
                onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={18} strokeWidth={1.5} className="text-white" />
                <div className="flex-1 text-left">
                  <div className="text-xs text-zinc-400">Current Account</div>
                  <div className="text-sm font-medium text-white truncate">{user.name}</div>
                </div>
                <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded capitalize">
                  {isMember ? role : 'Owner'}
                </span>
              </button>
              
              {showAccountSwitcher && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-2 border-b border-zinc-700">
                    <div className="text-xs font-medium text-zinc-400">Switch Account</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {accessibleAccounts.map((account) => {
                      const isCurrentAccount = account.accountId === user._id;
                      return (
                        <button
                          key={account.accountId}
                          onClick={async () => {
                            if (!isCurrentAccount && !switchingAccount) {
                              setSwitchingAccount(true);
                              try {
                                await switchAccount(account.accountId);
                              } finally {
                                setSwitchingAccount(false);
                                setShowAccountSwitcher(false);
                              }
                            }
                          }}
                          disabled={isCurrentAccount || switchingAccount}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left ${isCurrentAccount ? 'bg-zinc-800' : ''}`}
                        >
                          <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center">
                            <HugeiconsIcon 
                              icon={account.isOwner ? Building06Icon : UserIcon} 
                              size={16} 
                              strokeWidth={1.5}
                              className="text-zinc-400"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{account.accountName}</div>
                            <div className="text-xs text-zinc-500 capitalize">{account.isOwner ? 'Owner' : account.role}</div>
                          </div>
                          {isCurrentAccount && (
                            <HugeiconsIcon icon={Tick01Icon} size={16} strokeWidth={2} className="text-green-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2 mb-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-semibold border border-zinc-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-zinc-400 truncate">{user.email}</div>
            </div>
            {isMember && (
              <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded capitalize">
                {role}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-600 hover:text-white transition-all border border-zinc-800 hover:border-red-600"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        <div className="p-4 lg:p-0">
          <Suspense
            fallback={
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
