import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const { user, logout } = useAuth();

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/tasks?${params}`);
      setTasks(res.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleCreate = async (data: any) => {
    try {
      await api.post('/tasks', data);
      fetchTasks();
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingTask) return;
    try {
      await api.put(`/tasks/${editingTask.id}`, data);
      fetchTasks();
      setEditingTask(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div>
          <span>Welcome, {user?.name || user?.email}</span>
          <Button onClick={() => setShowForm(true)} className="ml-4">Add Task</Button>
          <Button onClick={logout} variant="secondary" className="ml-2">Logout</Button>
        </div>
      </div>
      <div className="mb-4 flex space-x-4">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="text"
          placeholder="Search"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded"
        />
      </div>
      {showForm && <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
      {editingTask && <TaskForm task={editingTask} onSubmit={handleUpdate} onCancel={() => setEditingTask(null)} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={setEditingTask} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}