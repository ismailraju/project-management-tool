'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/members', label: 'Team', icon: Users, roles: ['owner', 'admin'] },
];

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member'
};

const planColors: Record<string, string> = {
  free: 'bg-zinc-100 text-zinc-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700'
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, canManageUsers } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-zinc-950 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ProjectFlow
            </h1>
          </div>
        )}
        {collapsed && <Building2 className="h-6 w-6 text-indigo-400 mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-indigo-600 text-white" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div className="px-3 py-2">
          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-zinc-400 truncate">{user.tenantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={planColors[user.tenantPlan] || 'bg-zinc-100 text-zinc-700'} variant="secondary">
                {user.tenantPlan}
              </Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {roleLabels[user.role]}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-zinc-800">
        {canManageUsers() && (
          <Link
            href="/team"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1",
              pathname === '/team'
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Manage Team</span>}
          </Link>
        )}
        
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1",
            pathname === '/settings'
              ? "bg-indigo-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Settings</span>}
        </Link>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-zinc-400 hover:bg-zinc-800 hover:text-white"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
