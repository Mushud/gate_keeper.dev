'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FiShield, FiHome, FiFolder, FiShoppingCart, FiBarChart2, FiFileText, FiCreditCard, FiSettings, FiLogOut, FiBook, FiMenu, FiX } from 'react-icons/fi';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('Dashboard layout - loading:', loading, 'user:', user ? 'exists' : 'null');
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      // Small delay to ensure auth check has completed
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
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
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Projects', href: '/projects', icon: FiFolder },
    { name: 'KYC Verification', href: '/kyc', icon: FiShield },
    { name: 'Checkout', href: '/checkout', icon: FiShoppingCart },
    // { name: 'Analytics', href: '/analytics', icon: FiBarChart2 },
    { name: 'Logs', href: '/logs', icon: FiFileText },
    { name: 'Developer', href: '/developer', icon: FiBook },
    { name: 'Billing', href: '/billing', icon: FiCreditCard },
    { name: 'Transactions', href: '/transactions', icon: FiCreditCard },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

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
            {sidebarOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
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
          w-64 bg-white border-r border-zinc-200 flex flex-col
          z-50 lg:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:block p-6 border-b border-zinc-200">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="GateKeeperPro" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className="font-bold text-lg">GateKeeperPro</div>
              <div className="text-xs text-zinc-500">Developer Portal</div>
            </div>
          </Link>
        </div>

        {/* Mobile Top Spacing */}
        <div className="lg:hidden h-20" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <item.icon className="text-lg" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-zinc-500 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut className="text-lg" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        <div className="p-4 lg:p-0">
          {children}
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
