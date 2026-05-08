'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Project, Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GanttChart } from '@/components/gantt-chart';
import {
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Trash2,
  CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';

const statusConfig = {
  'active': { label: 'Active', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  'completed': { label: 'Completed', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  'on-hold': { label: 'On Hold', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  'cancelled': { label: 'Cancelled', bgColor: 'bg-red-50', textColor: 'text-red-700' }
};

const taskStatusConfig: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  'todo': { label: 'To Do', icon: Circle, color: 'text-zinc-400' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  'review': { label: 'Review', icon: AlertCircle, color: 'text-purple-500' },
  'done': { label: 'Done', icon: CheckCircle2, color: 'text-green-500' }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  'low': { label: 'Low', color: 'bg-zinc-100 text-zinc-700' },
  'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-700' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

const colorOptions = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6'
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { canEditTasks, canDeleteProject } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(false);
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    startDate: '',
    dueDate: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, tasksRes, membersRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/tasks?projectId=${id}`),
          fetch('/api/members')
        ]);

        if (!projectRes.ok) {
          router.push('/projects');
          return;
        }

        const projectData = await projectRes.json();
        const tasksData = await tasksRes.json();
        const membersData = await membersRes.json();

        setProject(projectData);
        setEditForm(projectData);
        setTasks(tasksData);
        setMembers(membersData.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleUpdateProject = async () => {
    if (!editForm) return;

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });

    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
      setEditingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/projects');
    }
  };

  const handleCreateTask = async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTask, projectId: id })
    });

    if (res.ok) {
      const task = await res.json();
      setTasks([...tasks, task]);
      setNewTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: '',
        startDate: '',
        dueDate: ''
      });

      const projectRes = await fetch(`/api/projects/${id}`);
      const projectData = await projectRes.json();
      setProject(projectData);
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

      const projectRes = await fetch(`/api/projects/${id}`);
      const projectData = await projectRes.json();
      setProject(projectData);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok) return;
    setTasks(tasks.filter(t => t.id !== taskId));

    const projectRes = await fetch(`/api/projects/${id}`);
    const projectData = await projectRes.json();
    setProject(projectData);
  };

  const tasksByStatus: Record<string, Task[]> = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'review': tasks.filter(t => t.status === 'review'),
    'done': tasks.filter(t => t.status === 'done')
  };

  if (loading || !project) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-zinc-200 rounded" />
          <div className="h-48 bg-zinc-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-3xl font-bold text-zinc-900">{project.name}</h1>
          </div>
          <p className="text-zinc-500 mt-1">{project.description}</p>
        </div>
        {canDeleteProject() && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setEditingProject(true)}
            >
              Edit Project
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Status</p>
            <Badge className={`mt-1 ${statusConfig[project.status]?.bgColor || 'bg-zinc-50'} ${statusConfig[project.status]?.textColor || 'text-zinc-700'} border-0`}>
              {statusConfig[project.status]?.label || project.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Due Date</p>
            <p className="font-medium mt-1 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'No date'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Tasks</p>
            <p className="font-medium mt-1">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={project.progress} className="flex-1 h-2" />
              <span className="font-medium">{project.progress}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Tasks</h2>
        {canEditTasks() && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setNewTaskDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          {Object.entries(taskStatusConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              {config.label} ({(tasksByStatus[key] || []).length})
            </TabsTrigger>
          ))}
          <TabsTrigger value="gantt" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Gantt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(taskStatusConfig).map(([status, config]) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                </div>
                {(tasksByStatus[status] || []).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    canEdit={canEditTasks()}
                  />
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        {Object.keys(taskStatusConfig).map(status => (
          <TabsContent key={status} value={status} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(tasksByStatus[status] || []).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                  canEdit={canEditTasks()}
                />
              ))}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="gantt" className="mt-4">
          <GanttChart projectId={id} />
        </TabsContent>
      </Tabs>

      <Dialog open={editingProject} onOpenChange={setEditingProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as Project['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        editForm.color === color ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleUpdateProject}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newTaskDialog} onOpenChange={(open) => {
        setNewTaskDialog(open);
        if (!open) {
          setNewTask({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            assigneeId: '',
            startDate: '',
            dueDate: ''
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
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
              <Textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                />
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
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select 
                value={newTask.assigneeId} 
                onValueChange={(value) => setNewTask({ ...newTask, assigneeId: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTaskDialog(false)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleCreateTask}
              disabled={!newTask.title}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({ 
  task, 
  onStatusChange, 
  onDelete,
  canEdit
}: { 
  task: Task; 
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const nextStatus = {
    'todo': 'in-progress',
    'in-progress': 'review',
    'review': 'done',
    'done': 'todo'
  } as const;

  const taskStatusConfig: Record<string, { label: string }> = {
    'todo': { label: 'To Do' },
    'in-progress': { label: 'In Progress' },
    'review': { label: 'Review' },
    'done': { label: 'Done' }
  };

  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done';

  return (
    <Card className="border-zinc-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-zinc-900 line-clamp-2">{task.title}</p>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "flex-shrink-0")}>
                <Trash2 className="h-3 w-3 text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete(task.id)}
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Badge className={priorityConfig[task.priority]?.color || 'bg-zinc-100 text-zinc-700'} variant="secondary">
            {priorityConfig[task.priority]?.label || task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">Overdue</Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <span className="text-xs text-zinc-500">{task.assigneeName || 'Unassigned'}</span>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => onStatusChange(task.id, nextStatus[task.status as keyof typeof nextStatus])}
            >
              {task.status === 'done' ? 'Reopen' : 'Move to ' + taskStatusConfig[nextStatus[task.status as keyof typeof nextStatus]]?.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
