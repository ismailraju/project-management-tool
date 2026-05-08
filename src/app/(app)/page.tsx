'use client';

import { useEffect, useState } from 'react';
import { Project, Task, TeamMember } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  TrendingUp,
  Users,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
  overdueTasks: number;
}

const priorityColors: Record<string, string> = {
  'low': 'bg-zinc-400',
  'medium': 'bg-blue-500',
  'high': 'bg-orange-500',
  'urgent': 'bg-red-500'
};

const taskStatusColors: Record<string, string> = {
  'todo': 'bg-zinc-500',
  'in-progress': 'bg-blue-500',
  'review': 'bg-purple-500',
  'done': 'bg-green-500'
};

export default function DashboardPage() {
  const { user, canManageProjects } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    overdueTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, tasksRes, membersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/tasks'),
          fetch('/api/members')
        ]);
        
        const projectsData = await projectsRes.json();
        const tasksData = await tasksRes.json();
        const membersData = await membersRes.json();
        
        if (!projectsRes.ok || !tasksRes.ok || !membersRes.ok) {
          setLoading(false);
          return;
        }
        
        setProjects(projectsData);
        setTasks(tasksData);
        setMembers(membersData);
        
        const today = new Date().toISOString().split('T')[0];
        const overdue = tasksData.filter((t: Task) => 
          t.status !== 'done' && t.dueDate && t.dueDate < today
        ).length;
        
        setStats({
          totalProjects: projectsData.length,
          activeProjects: projectsData.filter((p: Project) => p.status === 'active').length,
          totalTasks: tasksData.length,
          completedTasks: tasksData.filter((t: Task) => t.status === 'done').length,
          teamMembers: membersData.length,
          overdueTasks: overdue
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const recentTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back, {user?.name}! Here&apos;s your project overview.</p>
        </div>
        {canManageProjects() && (
          <Link href="/projects/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FolderKanban className="h-5 w-5 text-indigo-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-zinc-900">{stats.totalProjects}</p>
              <p className="text-sm text-zinc-500">Total Projects</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.activeProjects} active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-zinc-900">{stats.completedTasks}</p>
              <p className="text-sm text-zinc-500">Completed Tasks</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-zinc-500">
              <Clock className="h-3 w-3" />
              <span>{stats.totalTasks - stats.completedTasks} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-zinc-900">{stats.overdueTasks}</p>
              <p className="text-sm text-zinc-500">Overdue Tasks</p>
            </div>
            <Progress 
              value={(stats.overdueTasks / Math.max(stats.totalTasks, 1)) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-zinc-900">{stats.teamMembers}</p>
              <p className="text-sm text-zinc-500">Team Members</p>
            </div>
            <div className="mt-3 flex -space-x-2">
              {members.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-zinc-300 flex items-center justify-center text-xs font-medium text-zinc-700">
                  +{members.length - 4}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Active Projects</CardTitle>
            <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.filter(p => p.status === 'active').slice(0, 4).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{project.name}</p>
                    <p className="text-sm text-zinc-500 truncate">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900">{project.progress}%</p>
                    <Progress value={project.progress} className="w-16 h-1 mt-1" />
                  </div>
                </div>
              </Link>
            ))}
            {projects.filter(p => p.status === 'active').length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">No active projects</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task) => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${taskStatusColors[task.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{task.title}</p>
                    <p className="text-sm text-zinc-500 truncate">{project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.dueDate}</Badge>
                  </div>
                </div>
              );
            })}
            {recentTasks.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">No pending tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
