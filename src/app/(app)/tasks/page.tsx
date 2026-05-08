'use client';

import { useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

const taskStatusConfig: Record<string, { label: string; icon: typeof Circle; color: string; bgColor: string }> = {
  'todo': { label: 'To Do', icon: Circle, color: 'text-zinc-400', bgColor: 'bg-zinc-100' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  'review': { label: 'Review', icon: AlertCircle, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  'done': { label: 'Done', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100' }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  'low': { label: 'Low', color: 'bg-zinc-100 text-zinc-700' },
  'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-700' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

export default function TasksPage() {
  const { canEditTasks } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    dueDate: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, projectsRes, membersRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/members')
        ]);

        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();
        const membersData = await membersRes.json();

        if (!tasksRes.ok || !projectsRes.ok || !membersRes.ok) {
          setLoading(false);
          return;
        }

        setTasks(tasksData);
        setProjects(projectsData);
        setMembers(membersData.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const tasksByStatus: Record<string, Task[]> = {
    'todo': filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'review': filteredTasks.filter(t => t.status === 'review'),
    'done': filteredTasks.filter(t => t.status === 'done')
  };

  const handleCreateTask = async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });

    if (res.ok) {
      const task = await res.json();
      setTasks([...tasks, task]);
      setNewTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: '',
        dueDate: ''
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: status as Task['status'] } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-zinc-200 rounded-lg" />
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
          <h1 className="text-3xl font-bold text-zinc-900">Tasks</h1>
          <p className="text-zinc-500 mt-1">Manage all your tasks across projects</p>
        </div>
        {canEditTasks() && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setNewTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={projectFilter} onValueChange={(value) => setProjectFilter(value || 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value || 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(taskStatusConfig).map(([status, config]) => (
              <div key={status} className="space-y-3">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bgColor}`}>
                  <config.icon className={`h-5 w-5 ${config.color}`} />
                  <span className="font-semibold text-sm">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto">{(tasksByStatus[status] || []).length}</Badge>
                </div>
                
                <div className="space-y-3 min-h-[200px]">
                  {(tasksByStatus[status] || []).map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done';
                    
                    return (
                      <Card key={task.id} className="border-zinc-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-zinc-900 line-clamp-2">{task.title}</p>
                            {canEditTasks() && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "flex-shrink-0")}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {project && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="text-xs text-zinc-500 truncate">{project.name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={priorityConfig[task.priority]?.color || 'bg-zinc-100 text-zinc-700'} variant="secondary">
                              {priorityConfig[task.priority]?.label || task.priority}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                            <span className="text-xs text-zinc-500">
                              {task.assigneeName || 'Unassigned'}
                            </span>
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-zinc-500'}`}>
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>

                          {canEditTasks() && (
                            <div className="flex gap-1">
                              {Object.entries(taskStatusConfig).map(([s, c]) => (
                                s !== task.status && (
                                  <Button
                                    key={s}
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => handleUpdateTaskStatus(task.id, s)}
                                  >
                                    <c.icon className={`h-3 w-3 ${c.color}`} />
                                  </Button>
                                )
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card className="border-zinc-200">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100">
                {filteredTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done';
                  
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50">
                      {canEditTasks() && (
                        <button onClick={() => handleUpdateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}>
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-300 hover:text-zinc-500" />
                          )}
                        </button>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                          {task.title}
                        </p>
                        {project && (
                          <p className="text-sm text-zinc-500">{project.name}</p>
                        )}
                      </div>

                      <Badge className={priorityConfig[task.priority]?.color || 'bg-zinc-100 text-zinc-700'} variant="secondary">
                        {priorityConfig[task.priority]?.label || task.priority}
                      </Badge>

                      <Badge variant="outline" className={isOverdue ? 'border-red-200 text-red-600' : ''}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
                      </Badge>

                      <span className="text-sm text-zinc-500 w-24">{task.assigneeName || 'Unassigned'}</span>

                      {canEditTasks() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select 
                value={newTask.projectId} 
                onValueChange={(value) => setNewTask({ ...newTask, projectId: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newTask.status} 
                  onValueChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select 
                  value={newTask.assigneeId} 
                  onValueChange={(value) => setNewTask({ ...newTask, assigneeId: value || '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskDialog(false)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleCreateTask}
              disabled={!newTask.title || !newTask.projectId}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
