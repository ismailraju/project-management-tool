'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Mail, Shield, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  color: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

interface TeamInfo {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    maxUsers: number;
    maxProjects: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
  };
  inviteCode: string;
}

const planColors: Record<string, string> = {
  free: 'bg-zinc-100 text-zinc-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700'
};

export default function TeamPage() {
  const { user, canManageUsers } = useAuth();
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canManageUsers()) return;
    fetchTeam();
  }, [canManageUsers]);

  async function fetchTeam() {
    try {
      const [infoRes, membersRes] = await Promise.all([
        fetch('/api/team/info'),
        fetch('/api/team')
      ]);
      
      const infoData = await infoRes.json();
      const membersData = await membersRes.json();
      
      setTeamInfo(infoData);
      setMembers(membersData);
    } catch {
      console.error('Error fetching team:');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember() {
    setError('');
    
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add member');
        return;
      }

      setAddDialogOpen(false);
      setNewMember({ name: '', email: '', password: '', role: 'member' });
      await fetchTeam();
    } catch {
      setError('Failed to add member');
    }
  }

  async function handleDeleteMember(id: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        await fetchTeam();
      }
    } catch {
      console.error('Error deleting member:');
    }
  }

  async function handleUpdateRole(id: string, role: string) {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, role })
      });

      if (res.ok) {
        const data = await res.json();
        setMembers(members.map(m => m.id === id ? { ...m, role: data.role } : m));
      }
    } catch {
      console.error('Error updating role:');
    }
  }

  if (!canManageUsers()) {
    return (
      <div className="p-8">
        <Card className="border-zinc-200 max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="h-16 w-16 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Access Denied</h3>
            <p className="text-zinc-500 mt-1 text-center">
              Only administrators can manage team members.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Team Management</h1>
          <p className="text-zinc-500 mt-1">Manage your organization members</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {teamInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{teamInfo.stats.activeUsers} / {teamInfo.tenant.maxUsers}</p>
                  <p className="text-sm text-zinc-500">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <Badge className={planColors[teamInfo.tenant.plan]} variant="secondary">
                    {teamInfo.tenant.plan}
                  </Badge>
                  <p className="text-sm text-zinc-500 mt-1">{teamInfo.tenant.plan.charAt(0).toUpperCase() + teamInfo.tenant.plan.slice(1)} Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-mono font-bold text-zinc-900">{teamInfo.inviteCode}</p>
                  <p className="text-sm text-zinc-500">Invite Code</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage roles and access for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-lg">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{member.name}</p>
                    {member.id === user?.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-400">
                    {member.lastLoginAt 
                      ? `Last login: ${format(new Date(member.lastLoginAt), 'MMM d, yyyy')}`
                      : 'Never logged in'
                    }
                  </p>
                </div>
                <Select 
                  value={member.role} 
                  onValueChange={(value) => handleUpdateRole(member.id, value || 'member')}
                  disabled={member.role === 'owner' || member.id === user?.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role === 'owner' && (
                      <SelectItem value="owner">Owner</SelectItem>
                    )}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                {member.role !== 'owner' && member.id !== user?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newMember.password}
                onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
              />
            </div>
            {user?.role === 'owner' && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={newMember.role} 
                  onValueChange={(value) => setNewMember({ ...newMember, role: value || 'member' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleAddMember}
              disabled={!newMember.name || !newMember.email || !newMember.password}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
