'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Filter,
  Users,
  CalendarDays,
  GripVertical,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, parseISO, startOfWeek, endOfWeek, startOfMonth, eachDayOfInterval, isSameDay, isWeekend } from 'date-fns';

const DAY_WIDTH = 36;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 240;

const statusColors: Record<string, string> = {
  'todo': 'bg-zinc-400',
  'in-progress': 'bg-blue-500',
  'review': 'bg-purple-500',
  'done': 'bg-green-500',
};

const statusBarStyles: Record<string, string> = {
  'todo': 'border-l-2 border-zinc-600',
  'in-progress': 'border-l-2 border-blue-600',
  'review': 'border-l-2 border-purple-600',
  'done': 'opacity-60',
};

interface GanttChartProps {
  projectId: string;
}

interface Member {
  id: string;
  name: string;
  color: string;
}

export function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [groupByAssignee, setGroupByAssignee] = useState(false);
  const [zoom, setZoom] = useState(1);
  const today = useMemo(() => new Date(), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragState.current = { isDown: true, startX: e.clientX, scrollLeft: scrollRef.current?.scrollLeft || 0, moved: false };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const ds = dragState.current;
    if (!ds.isDown) return;
    e.preventDefault();
    const delta = e.clientX - ds.startX;
    if (Math.abs(delta) > 3) ds.moved = true;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = ds.scrollLeft - delta;
    }
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    dragState.current.isDown = false;
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, membersRes] = await Promise.all([
          fetch(`/api/tasks?projectId=${projectId}`),
          fetch('/api/members')
        ]);
        const tasksData = await tasksRes.json();
        const membersData = await membersRes.json();
        setTasks(tasksData);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching Gantt data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const getMemberColor = useCallback((assigneeId: string) => {
    if (!assigneeId) return '#a1a1aa';
    const member = members.find(m => m.id === assigneeId);
    return member?.color || '#a1a1aa';
  }, [members]);

  const getMemberName = useCallback((assigneeId: string) => {
    if (!assigneeId) return 'Unassigned';
    const member = members.find(m => m.id === assigneeId);
    return member?.name || 'Unknown';
  }, [members]);

  const tasksWithDates = useMemo(() => {
    return tasks.filter(t => t.startDate || t.dueDate).map(t => ({
      ...t,
      start: t.startDate ? parseISO(t.startDate) : (t.createdAt ? parseISO(t.createdAt) : today),
      end: t.dueDate ? parseISO(t.dueDate) : addDays(t.startDate ? parseISO(t.startDate) : today, 7),
    }));
  }, [tasks, today]);

  const dateRange = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const start = startOfMonth(today);
      const end = addDays(start, 30);
      return { start, end, totalDays: 31 };
    }

    let minDate = today;
    let maxDate = addDays(today, 7);

    for (const t of tasksWithDates) {
      if (t.start < minDate) minDate = t.start;
      if (t.end > maxDate) maxDate = t.end;
    }

    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 3);

    const totalDays = differenceInDays(maxDate, minDate) || 1;
    return { start: minDate, end: maxDate, totalDays };
  }, [tasksWithDates, today]);

  const dayWidth = DAY_WIDTH * zoom;

  const filteredTasks = useMemo(() => {
    let result = tasksWithDates;
    if (filterAssignee !== 'all') {
      result = result.filter(t => t.assigneeId === filterAssignee);
    }
    return result;
  }, [tasksWithDates, filterAssignee]);

  const groupedTasks = useMemo(() => {
    if (!groupByAssignee) return null;
    const groups = new Map<string, TaskWithDates[]>();
    for (const t of filteredTasks) {
      const key = t.assigneeId || 'unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return groups;
  }, [filteredTasks, groupByAssignee]);

  const getBarPosition = useCallback((start: Date, end: Date) => {
    const left = differenceInDays(start, dateRange.start) * dayWidth;
    const width = Math.max(differenceInDays(end, start) * dayWidth, dayWidth * 0.5);
    return { left, width };
  }, [dateRange.start, dayWidth]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const weekHeaders = useMemo(() => {
    const weeks: { start: Date; end: Date }[] = [];
    let cursor = startOfWeek(dateRange.start, { weekStartsOn: 1 });
    while (cursor <= dateRange.end) {
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      weeks.push({ start: cursor, end: weekEnd > dateRange.end ? dateRange.end : weekEnd });
      cursor = addDays(weekEnd, 1);
    }
    return weeks;
  }, [dateRange]);

  const monthHeaders = useMemo(() => {
    const months: { date: Date; label: string }[] = [];
    const seen = new Set<string>();
    for (const day of days) {
      const key = `${day.getFullYear()}-${day.getMonth()}`;
      if (!seen.has(key)) {
        seen.add(key);
        months.push({ date: day, label: format(day, 'MMMM yyyy') });
      }
    }
    return months;
  }, [days]);

  const handleEditTask = useCallback((task: Task) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      dependsOn: task.dependsOn,
    });
  }, []);

  const handleTaskUpdated = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const handleSaveTask = async () => {
    if (!editTask || !editForm) return;
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditTask(null);
      setEditForm({});
    }
  };

  const rowCount = groupedTasks
    ? Array.from(groupedTasks.entries()).reduce((acc, [, ts]) => acc + ts.length + 1, 0)
    : filteredTasks.length;

  const taskTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id, t.title);
    return map;
  }, [tasks]);

  const barPositions = useMemo(() => {
    const positions: Record<string, { left: number; width: number; top: number; endX: number }> = {};
    let y = 0;

    if (groupedTasks) {
      for (const [, group] of groupedTasks) {
        y += 32;
        for (const task of group) {
          const bar = getBarPosition(task.start, task.end);
          positions[task.id] = { left: bar.left, width: bar.width, top: y + ROW_HEIGHT / 2, endX: bar.left + bar.width };
          y += ROW_HEIGHT;
        }
      }
    } else {
      for (const task of filteredTasks) {
        const bar = getBarPosition(task.start, task.end);
        positions[task.id] = { left: bar.left, width: bar.width, top: y + ROW_HEIGHT / 2, endX: bar.left + bar.width };
        y += ROW_HEIGHT;
      }
    }

    return positions;
  }, [filteredTasks, groupedTasks, getBarPosition]);

  const depViolations = useMemo(() => {
    const violations = new Map<string, string>();
    for (const t of filteredTasks) {
      if (t.dependsOn) {
        const dep = filteredTasks.find(d => d.id === t.dependsOn);
        if (dep && dep.end > t.start) {
          violations.set(t.id, `Depends on "${dep.title}" (ends ${format(dep.end, 'MMM d')}) but starts ${format(t.start, 'MMM d')}`);
        }
      }
    }
    return violations;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-[400px] bg-zinc-200 rounded-lg" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              Gantt Chart
            </h3>
            <Badge variant="secondary" className="text-xs">
              {filteredTasks.length} tasks
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterAssignee} onValueChange={(value) => setFilterAssignee(value || 'all')}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      {m.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={groupByAssignee ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setGroupByAssignee(!groupByAssignee)}
            >
              <Users className="h-3 w-3 mr-1" />
              Group
            </Button>

            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-8 w-8"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs text-zinc-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-8 w-8"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <Card className="border-zinc-200">
            <div className="p-12 text-center text-zinc-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
              <p className="font-medium">No tasks with dates</p>
              <p className="text-sm mt-1">Add start and due dates to tasks to see them on the Gantt chart.</p>
            </div>
          </Card>
        ) : (
          <Card className="border-zinc-200 overflow-hidden">
            <div
              ref={scrollRef}
              className="overflow-x-auto select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              <div className="min-w-fit" style={{ paddingBottom: '8px' }}>
                <div className="flex" style={{ height: HEADER_HEIGHT }}>
                  <div
                    className="flex-shrink-0 border-r border-b border-zinc-200 bg-zinc-50 px-3 flex items-center font-medium text-xs text-zinc-500 sticky left-0 z-20"
                    style={{ width: LABEL_WIDTH }}
                  >
                    Task / Assignee
                  </div>
                  <div className="flex" style={{ minWidth: days.length * dayWidth }}>
                    {monthHeaders.map((mh, i) => {
                      const daysInMonth = days.filter(d => d.getMonth() === mh.date.getMonth() && d.getFullYear() === mh.date.getFullYear());
                      const width = daysInMonth.length * dayWidth;
                      return (
                        <div
                          key={i}
                          className="flex-shrink-0 border-r border-b border-zinc-200 bg-zinc-50 flex items-center px-2 text-xs font-medium text-zinc-600"
                          style={{ width }}
                        >
                          {mh.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex" style={{ height: 24 }}>
                  <div
                    className="flex-shrink-0 border-r border-b border-zinc-200 bg-zinc-50/50 sticky left-0 z-10"
                    style={{ width: LABEL_WIDTH }}
                  />
                  <div className="flex">
                    {weekHeaders.map((wh, i) => {
                      const daysInWeek = days.filter(d => d >= wh.start && d <= wh.end);
                      const width = daysInWeek.length * dayWidth;
                      return (
                        <div
                          key={i}
                          className="flex-shrink-0 border-r border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-center text-[10px] text-zinc-400"
                          style={{ width }}
                        >
                          W{format(wh.start, 'w')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex" style={{ height: 20 }}>
                  <div
                    className="flex-shrink-0 border-r border-b border-zinc-200 sticky left-0 z-10"
                    style={{ width: LABEL_WIDTH }}
                  />
                  <div className="flex">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-shrink-0 border-r border-b border-zinc-100 flex items-center justify-center text-[10px]",
                          isWeekend(day) ? 'bg-zinc-50 text-zinc-300' : 'text-zinc-400',
                          isSameDay(day, today) ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                        )}
                        style={{ width: dayWidth }}
                      >
                        {format(day, 'd')}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <svg
                    className="absolute inset-0 pointer-events-none z-5"
                    style={{ width: days.length * dayWidth, height: '100%', overflow: 'visible' }}
                  >
                    {filteredTasks.map(t => {
                      if (!t.dependsOn || !barPositions[t.id] || !barPositions[t.dependsOn]) return null;
                      const from = barPositions[t.dependsOn];
                      const to = barPositions[t.id];
                      const fromX = from.endX;
                      const fromY = from.top;
                      const toX = to.left;
                      const toY = to.top;
                      const midX = (fromX + toX) / 2;
                      const hasViolation = depViolations.has(t.id);
                      return (
                        <g key={t.id}>
                          <path
                            d={`M ${fromX},${fromY} C ${midX},${fromY} ${midX},${toY} ${toX},${toY}`}
                            fill="none"
                            stroke={hasViolation ? '#ef4444' : '#a1a1aa'}
                            strokeWidth={hasViolation ? 2 : 1.5}
                            strokeDasharray={hasViolation ? '5,3' : 'none'}
                          />
                          <polygon
                            points={`${toX},${toY} ${toX - 6},${toY - 4} ${toX - 6},${toY + 4}`}
                            fill={hasViolation ? '#ef4444' : '#a1a1aa'}
                          />
                        </g>
                      );
                    })}
                  </svg>
                  {groupedTasks ? (
                    Array.from(groupedTasks.entries()).map(([assigneeId, groupTasks]) => (
                      <div key={assigneeId}>
                        <div
                          className="flex border-b border-zinc-200 bg-zinc-100/50"
                          style={{ height: 32 }}
                        >
                          <div
                            className="flex-shrink-0 border-r border-zinc-200 px-3 flex items-center gap-2 font-medium text-xs text-zinc-700 sticky left-0 z-10 bg-zinc-100/50"
                            style={{ width: LABEL_WIDTH }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: getMemberColor(assigneeId) }}
                            />
                            {getMemberName(assigneeId)}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {groupTasks.length}
                            </Badge>
                          </div>
                          <div className="flex-1" />
                        </div>

                        {groupTasks.map(task => (
                          <GanttRow
                            key={task.id}
                            task={task}
                            dayWidth={dayWidth}
                            labelWidth={LABEL_WIDTH}
                            rowHeight={ROW_HEIGHT}
                            getBarPosition={getBarPosition}
                            getMemberColor={getMemberColor}
                            getMemberName={getMemberName}
                            days={days}
                            today={today}
                            dependsOnTitle={task.dependsOn ? taskTitleMap.get(task.dependsOn) || '' : ''}
                            hasDepViolation={depViolations.has(task.id)}
                            onClick={() => { if (!dragState.current.moved) handleEditTask(task); }}
                            onTaskUpdated={handleTaskUpdated}
                          />
                        ))}
                      </div>
                    ))
                  ) : (
                    filteredTasks.map(task => (
                      <GanttRow
                        key={task.id}
                        task={task}
                        dayWidth={dayWidth}
                        labelWidth={LABEL_WIDTH}
                        rowHeight={ROW_HEIGHT}
                        getBarPosition={getBarPosition}
                        getMemberColor={getMemberColor}
                        getMemberName={getMemberName}
                        days={days}
                        today={today}
                        dependsOnTitle={task.dependsOn ? taskTitleMap.get(task.dependsOn) || '' : ''}
                        hasDepViolation={depViolations.has(task.id)}
                        onClick={() => { if (!dragState.current.moved) handleEditTask(task); }}
                        onTaskUpdated={handleTaskUpdated}
                      />
                    ))
                  )}
                </div>

                {rowCount === 0 && (
                  <div className="p-8 text-center text-zinc-400 text-sm">
                    No tasks match the current filter.
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-400" />
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <div className="w-1 h-3 bg-red-400 rounded" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <div className="w-3 h-0 border-t-2 border-dashed border-red-500" />
              <span className="text-red-500">Dependency error</span>
            </div>
          </div>
          <span className="text-zinc-300">↔ Drag to pan · ⇌ Drag bar to reschedule</span>
        </div>
      </div>

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) { setEditTask(null); setEditForm({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editForm.startDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editForm.dueDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status || 'todo'}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as Task['status'] })}
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
                    value={editForm.priority || 'medium'}
                    onValueChange={(value) => setEditForm({ ...editForm, priority: value as Task['priority'] })}
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
                  value={editForm.assigneeId || ''}
                  onValueChange={(value) => setEditForm({ ...editForm, assigneeId: value || '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Depends On</Label>
                <Select
                  value={editForm.dependsOn || 'none'}
                  onValueChange={(value) => setEditForm({ ...editForm, dependsOn: value === 'none' ? '' : (value || '') })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No dependency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No dependency</SelectItem>
                    {tasks.filter(t => t.id !== editTask?.id).map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTask(null); setEditForm({}); }}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

type TaskWithDates = Task & { start: Date; end: Date };

interface GanttRowProps {
  task: TaskWithDates;
  dayWidth: number;
  labelWidth: number;
  rowHeight: number;
  getBarPosition: (start: Date, end: Date) => { left: number; width: number };
  getMemberColor: (assigneeId: string) => string;
  getMemberName: (assigneeId: string) => string;
  days: Date[];
  today: Date;
  dependsOnTitle: string;
  hasDepViolation: boolean;
  onClick: () => void;
  onTaskUpdated: (task: Task) => void;
}

function GanttRow({
  task,
  dayWidth,
  labelWidth,
  rowHeight,
  getBarPosition,
  getMemberColor,
  getMemberName,
  days,
  today,
  dependsOnTitle,
  hasDepViolation,
  onClick,
  onTaskUpdated,
}: GanttRowProps) {
  const barPos = getBarPosition(task.start, task.end);
  const memberColor = getMemberColor(task.assigneeId);
  const isOverdue = task.dueDate && task.dueDate < format(today, 'yyyy-MM-dd') && task.status !== 'done';
  const [barOffset, setBarOffset] = useState(0);
  const [isDraggingBar, setIsDraggingBar] = useState(false);
  const barDragRef = useRef({
    isDragging: false,
    startX: 0,
    origStartDate: '',
    origDueDate: '',
    offsetX: 0,
    wasDragged: false,
    taskId: '',
  });

  useEffect(() => {
    const bd = barDragRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (!bd.isDragging) return;
      e.preventDefault();
      const deltaX = e.clientX - bd.startX;
      if (Math.abs(deltaX) > 3) bd.wasDragged = true;
      bd.offsetX = deltaX;
      setBarOffset(deltaX);
    };

    const handleMouseUp = async () => {
      if (!bd.isDragging) return;
      bd.isDragging = false;

      if (bd.wasDragged && Math.abs(bd.offsetX) >= dayWidth * 0.5) {
        const daysDelta = Math.round(bd.offsetX / dayWidth);
        if (daysDelta !== 0) {
          const start = bd.origStartDate ? parseISO(bd.origStartDate) : today;
          const end = bd.origDueDate ? parseISO(bd.origDueDate) : addDays(start, 7);
          const newStart = format(addDays(start, daysDelta), 'yyyy-MM-dd');
          const newEnd = format(addDays(end, daysDelta), 'yyyy-MM-dd');
          const res = await fetch(`/api/tasks/${bd.taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate: newStart, dueDate: newEnd }),
          });
          if (res.ok) {
            const updated = await res.json();
            onTaskUpdated(updated);
          }
        }
      }
      setIsDraggingBar(false);
      setBarOffset(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dayWidth, today, onTaskUpdated]);

  const handleBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bd = barDragRef.current;
    bd.isDragging = true;
    bd.startX = e.clientX;
    bd.origStartDate = task.startDate;
    bd.origDueDate = task.dueDate;
    bd.offsetX = 0;
    bd.wasDragged = false;
    bd.taskId = task.id;
    setBarOffset(0);
    setIsDraggingBar(true);
  };

  const handleBarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!barDragRef.current.wasDragged) {
      onClick();
    }
  };

  return (
    <div
      className="flex border-b border-zinc-100 hover:bg-zinc-50/50 group transition-colors cursor-pointer"
      style={{ height: rowHeight }}
      onClick={onClick}
    >
      <div
        className="flex-shrink-0 border-r border-zinc-200 px-3 flex items-center gap-2 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/50 transition-colors"
        style={{ width: labelWidth }}
      >
        <GripVertical className="h-3 w-3 text-zinc-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate leading-tight">{task.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {task.assigneeId ? (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: memberColor }}
                title={getMemberName(task.assigneeId)}
              />
            ) : (
              <div className="w-3 h-3 rounded-full bg-zinc-300 flex-shrink-0" />
            )}
            <span className="text-[11px] text-zinc-400 truncate">
              {getMemberName(task.assigneeId)}
            </span>
            {hasDepViolation && (
              <span className="text-[10px] text-red-500 font-medium ml-1">⚠</span>
            )}
            {isOverdue && (
              <span className="text-[10px] text-red-500 font-medium ml-1">OVERDUE</span>
            )}
          </div>
          {dependsOnTitle && (
            <span className={cn("text-[10px] truncate leading-tight", hasDepViolation ? 'text-red-400' : 'text-zinc-400')}>
              → {dependsOnTitle}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-shrink-0" style={{ width: days.length * dayWidth }}>
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-0 bottom-0 border-r border-zinc-100",
              isWeekend(day) ? 'bg-zinc-50/50' : '',
              isSameDay(day, today) ? 'bg-indigo-50/30' : ''
            )}
            style={{ left: i * dayWidth, width: dayWidth }}
          />
        ))}

        <Tooltip open={isDraggingBar ? false : undefined}>
          <TooltipTrigger>
            <div
              onMouseDown={handleBarMouseDown}
              onClick={handleBarClick}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-7 rounded transition-all hover:shadow-md hover:brightness-110 z-20",
                isDraggingBar ? 'cursor-grabbing shadow-lg brightness-110 ring-2 ring-indigo-400' : 'cursor-grab',
                statusColors[task.status] || 'bg-zinc-400',
                statusBarStyles[task.status] || '',
                isOverdue ? 'ring-1 ring-red-400' : '',
                hasDepViolation ? 'ring-2 ring-red-500 animate-pulse' : ''
              )}
              style={{
                left: barPos.left,
                width: barPos.width,
                transform: barOffset ? `translateX(${barOffset}px)` : undefined,
                backgroundColor: task.status === 'done' ? '#22c55e' : (task.status === 'in-progress' ? '#3b82f6' : (task.status === 'review' ? '#8b5cf6' : memberColor)),
                opacity: task.status === 'done' ? 0.6 : (task.status === 'todo' ? 0.7 : 1),
              }}
            >
              {(task.title && barPos.width > 60) && (
                <span className="px-2 text-[11px] text-white font-medium truncate block leading-7 select-none">
                  {task.title}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">{task.title}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span>{format(task.start, 'MMM d')}</span>
                <span>→</span>
                <span>{format(task.end, 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: memberColor }} />
                <span>{getMemberName(task.assigneeId)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="capitalize">{task.status}</span>
                <span>·</span>
                <span className="capitalize">{task.priority}</span>
              </div>
              {dependsOnTitle && (
                <p className={cn("text-xs", hasDepViolation ? 'text-red-300 font-medium' : 'text-zinc-300')}>
                  → Depends on: {dependsOnTitle}
                </p>
              )}
              {hasDepViolation && (
                <p className="text-xs text-red-300 font-medium">⚠ Starts before dependency finishes</p>
              )}
              {isOverdue && (
                <p className="text-xs text-red-300 font-medium">Overdue</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
