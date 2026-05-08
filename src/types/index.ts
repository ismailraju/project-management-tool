export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'owner' | 'admin' | 'manager' | 'member';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  maxUsers: number;
  maxProjects: number;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
  color: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  progress: number;
  color: string;
  createdBy: string;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assigneeName: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  dueDate: string;
  dependsOn: string;
  createdBy: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  color: string;
}

export interface Session {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantName: string;
  exp: number;
}

export interface Database {
  tenants: Tenant[];
  users: User[];
  projects: Project[];
  tasks: Task[];
  members: TeamMember[];
}
