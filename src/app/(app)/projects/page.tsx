'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Calendar, 
  MoreHorizontal,
  FolderKanban
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

const statusConfig: Record<string, { label: string; color: string; textColor: string; bgColor: string }> = {
  'active': { label: 'Active', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  'completed': { label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  'on-hold': { label: 'On Hold', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' }
};

export default function ProjectsPage() {
  const { canManageProjects } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-zinc-200 rounded-lg" />
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
          <h1 className="text-3xl font-bold text-zinc-900">Projects</h1>
          <p className="text-zinc-500 mt-1">Manage and track all your projects</p>
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-zinc-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">No projects found</h3>
            <p className="text-zinc-500 mt-1">Create a new project to get started</p>
            {canManageProjects() && (
              <Link href="/projects/new" className="mt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border-zinc-200 hover:border-zinc-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-lg font-semibold truncate max-w-[200px]">
                      {project.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link href={`/projects/${project.id}`} className="w-full">View Details</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                  {project.description || 'No description provided'}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-medium text-zinc-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                      <Calendar className="h-4 w-4" />
                      <span>Due {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'No date'}</span>
                    </div>
                    <Badge className={`${statusConfig[project.status]?.bgColor || 'bg-zinc-50'} ${statusConfig[project.status]?.textColor || 'text-zinc-700'} border-0`}>
                      {statusConfig[project.status]?.label || project.status}
                    </Badge>
                  </div>
                </div>

                <Link href={`/projects/${project.id}`} className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    View Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
