'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  color: string;
}

interface Task {
  id: string;
  assigneeId: string;
  status: string;
  dueDate: string;
}

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member'
};

export default function MembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersRes, tasksRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/tasks')
        ]);

        if (!membersRes.ok || !tasksRes.ok) {
          setLoading(false);
          return;
        }

        setMembers(await membersRes.json());
        setTasks(await tasksRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assigneeId === memberId);
    return {
      total: memberTasks.length,
      completed: memberTasks.filter(t => t.status === 'done').length,
      inProgress: memberTasks.filter(t => t.status === 'in-progress').length,
      overdue: memberTasks.filter(t => 
        t.status !== 'done' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]
      ).length
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-zinc-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Team</h1>
        <p className="text-zinc-500 mt-1">Your team members and their workload</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map((member) => {
          const stats = getMemberStats(member.id);
          return (
            <Card key={member.id} className="border-zinc-200 hover:border-zinc-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{member.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-600">{stats.completed} completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-zinc-600">{stats.inProgress} in progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-zinc-600">{stats.overdue} overdue</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Total Tasks</span>
                    <Badge variant="secondary">{stats.total}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
