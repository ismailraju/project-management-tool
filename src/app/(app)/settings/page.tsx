'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, canManageSettings } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your account and organization settings</p>
      </div>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: user?.color }}
            >
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-medium text-zinc-900">{user?.name}</p>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input defaultValue={user?.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user?.email} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{user?.tenantName}</p>
              <p className="text-sm text-zinc-500">Organization name</p>
            </div>
            <Badge variant="secondary">{user?.tenantPlan?.charAt(0).toUpperCase()}{user?.tenantPlan?.slice(1)} Plan</Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Your Role</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}</Badge>
              <span className="text-sm text-zinc-500">
                {user?.role === 'owner' && 'Full access to all features'}
                {user?.role === 'admin' && 'Can manage team and projects'}
                {user?.role === 'manager' && 'Can manage projects and tasks'}
                {user?.role === 'member' && 'Can view and edit assigned tasks'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {canManageSettings() && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PermissionRow 
                label="Manage Users" 
                description="Add, remove, and manage team members"
                allowed={user?.role === 'owner' || user?.role === 'admin'}
              />
              <PermissionRow 
                label="Manage Projects" 
                description="Create, edit, and delete projects"
                allowed={user?.role !== 'member'}
              />
              <PermissionRow 
                label="Manage Tasks" 
                description="Create, edit, and delete tasks"
                allowed={true}
              />
              <PermissionRow 
                label="Manage Organization" 
                description="Update organization settings and billing"
                allowed={user?.role === 'owner'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Version</Badge>
            <span className="text-sm text-zinc-600">1.0.0</span>
          </div>
          <Separator />
          <p className="text-sm text-zinc-500">
            ProjectFlow is a modern project management portal built with Next.js, 
            Tailwind CSS, and shadcn/ui. It uses JSON files for data storage, 
            making it simple to deploy and use without a complex database setup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionRow({ label, description, allowed }: { label: string; description: string; allowed: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <Badge variant={allowed ? "default" : "secondary"} className={allowed ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
        {allowed ? 'Allowed' : 'Not Allowed'}
      </Badge>
    </div>
  );
}
