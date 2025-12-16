'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Home01Icon, Folder01Icon, ShieldIcon, ShoppingCart01Icon, File01Icon, BookOpen01Icon, CreditCardIcon, Settings02Icon, Menu01Icon, Cancel01Icon, Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

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
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Projects', href: '/projects', icon: 'folder' },
    { name: 'KYC Verification', href: '/kyc', icon: 'shield' },
    { name: 'Checkout', href: '/checkout', icon: 'shopping-cart' },
    // { name: 'Analytics', href: '/analytics', icon: 'bar-chart' },
    { name: 'Logs', href: '/logs', icon: 'file-text' },
    { name: 'Developer', href: '/developer', icon: 'book-open' },
    { name: 'Billing', href: '/billing', icon: 'credit-card' },
    { name: 'Transactions', href: '/transactions', icon: 'credit-card' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  const renderIcon = (iconName: string) => {
    const size = 20;
    const strokeWidth = 1.5;
    
    switch(iconName) {
      case 'home': return <HugeiconsIcon icon={Home01Icon} size={size} strokeWidth={strokeWidth} />;
      case 'folder': return <HugeiconsIcon icon={Folder01Icon} size={size} strokeWidth={strokeWidth} />;
      case 'shield': return <HugeiconsIcon icon={ShieldIcon} size={size} strokeWidth={strokeWidth} />;
      case 'shopping-cart': return <HugeiconsIcon icon={ShoppingCart01Icon} size={size} strokeWidth={strokeWidth} />;
      case 'file-text': return <HugeiconsIcon icon={File01Icon} size={size} strokeWidth={strokeWidth} />;
      case 'book-open': return <HugeiconsIcon icon={BookOpen01Icon} size={size} strokeWidth={strokeWidth} />;
      case 'credit-card': return <HugeiconsIcon icon={CreditCardIcon} size={size} strokeWidth={strokeWidth} />;
      case 'settings': return <HugeiconsIcon icon={Settings02Icon} size={size} strokeWidth={strokeWidth} />;
      default: return null;
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
            {sidebarOpen ? <HugeiconsIcon icon={Cancel01Icon} size={24} strokeWidth={1.5} /> : <HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={1.5} />}
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
          w-64 bg-green-700 border-r border-white border-opacity-20 flex flex-col shadow-xl
          z-50 lg:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:block p-6 border-b border-white border-opacity-30">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="GateKeeperPro" 
              className="w-10 h-10 object-contain drop-shadow-lg"
            />
            <div>
              <div className="font-bold text-lg text-white">GateKeeperPro</div>
              <div className="text-xs text-green-100">Developer Portal</div>
            </div>
          </Link>
        </div>

        {/* Mobile Top Spacing */}
        <div className="lg:hidden h-20" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-40 shadow-md'
                    : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:border border-white border-opacity-0 hover:border-opacity-20'
                }`}
              >
                {renderIcon(item.icon)}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white border-opacity-30">
          <div className="flex items-center gap-3 px-4 py-2 mb-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
            <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-sm font-semibold border border-white border-opacity-30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-green-100 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-red-500 hover:bg-opacity-80 transition-all border border-white border-opacity-20 hover:border-white hover:border-opacity-40"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
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
