import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  classApi,
  dashboardApi,
  userApi,
} from '../apis';
import { useIsMounted } from '../hooks/useIsMounted';
import { readRouteCache, writeRouteCache } from '../hooks/useRouteCache';
import { formatDate } from '../utils/format';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const ClassFormModal = ({ open, onClose, onSave, editingClass, instructors }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const startTime = watch('startTime');
  const today = new Date().toISOString().split('T')[0];

  const parseLocalDate = (dateStr) => {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d);
  };

  const isStartTimeInFutureForToday = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || dateStr !== today) return true;
    const [h, m] = timeStr.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    return start > new Date();
  };

  useEffect(() => {
    if (open) {
      if (editingClass) {
        reset({
          title: editingClass.title,
          description: editingClass.description,
          instructor: editingClass.instructor?._id || editingClass.instructor,
          date: new Date(editingClass.date).toISOString().split('T')[0],
          startTime: editingClass.startTime,
          endTime: editingClass.endTime,
          capacity: editingClass.capacity,
        });
      } else {
        reset({
          title: '',
          description: '',
          instructor: instructors[0]?._id || '',
          date: '',
          startTime: '',
          endTime: '',
          capacity: 10,
        });
      }
    }
  }, [open, editingClass, instructors, reset]);

  if (!open) return null;

  const onSubmit = (data) => {
    const capacity = Number(data.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) return;
    onSave({
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      capacity,
      date: parseLocalDate(data.date).toISOString(),
    });
  };

  const inputClass =
    'w-full rounded-xl border border-sage-200 px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-2xl font-bold text-sage-900">
          {editingClass ? 'Edit Class' : 'Create Class'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Title</label>
            <input
              {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
              className={inputClass}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Description</label>
            <textarea
              {...register('description', { required: 'Description is required', maxLength: { value: 1000, message: 'Max 1000 characters' } })}
              rows={3}
              className={inputClass}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Instructor</label>
            <select
              {...register('instructor', { required: 'Instructor is required' })}
              className={inputClass}
              disabled={instructors.length === 0}
            >
              {instructors.map((i) => (
                <option key={i._id} value={i._id}>{i.name}</option>
              ))}
            </select>
            {instructors.length === 0 && (
              <p className="mt-1 text-xs text-red-500">No instructors available</p>
            )}
            {errors.instructor && <p className="mt-1 text-xs text-red-500">{errors.instructor.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Date</label>
            <input
              type="date"
              min={editingClass ? undefined : today}
              {...register('date', {
                required: 'Date is required',
                validate: (v) =>
                  editingClass || v >= today || 'Date must be today or in the future',
              })}
              className={inputClass}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-sage-700">Start</label>
              <input type="time" {...register('startTime', {
                required: 'Start time is required',
                validate: (v) => {
                  const date = watch('date');
                  if (!date || date !== today) return true;
                  return isStartTimeInFutureForToday(date, v) || 'Start time must be in the future for today';
                },
              })} className={inputClass} />
              {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sage-700">End</label>
              <input
                type="time"
                {...register('endTime', {
                  required: 'End time is required',
                  validate: (v) => !startTime || v > startTime || 'End time must be after start time',
                })}
                className={inputClass}
              />
              {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Capacity</label>
            <input
              type="number"
              min={1}
              max={500}
              {...register('capacity', {
                required: 'Capacity is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Minimum 1' },
                max: { value: 500, message: 'Maximum 500' },
              })}
              className={inputClass}
            />
            {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-sage-600 hover:bg-sage-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={instructors.length === 0}
              className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
            >
              {editingClass ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StaffFormModal = ({ open, onClose, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) {
      reset({ name: '', email: '', phone: '', password: '', role: 'instructor' });
    }
  }, [open, reset]);

  if (!open) return null;

  const inputClass =
    'w-full rounded-xl border border-sage-200 px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200';

  const onSubmit = (data) => {
    onSave({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      role: data.role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-2xl font-bold text-sage-900">Add Staff</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Name</label>
            <input {...register('name', { required: 'Required' })} className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Email</label>
            <input type="email" {...register('email', { required: 'Required' })} className={inputClass} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Phone</label>
            <input {...register('phone', { required: 'Required' })} className={inputClass} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Role</label>
            <select {...register('role', { required: true })} className={inputClass}>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">Temporary password</label>
            <input
              type="password"
              {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className={inputClass}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-sage-600 hover:bg-sage-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ADMIN_CACHE_KEY = 'admin-dashboard';

const AdminDashboard = () => {
  const mounted = useIsMounted();
  const cached = readRouteCache(ADMIN_CACHE_KEY);
  const [stats, setStats] = useState(cached?.stats ?? null);
  const [classes, setClasses] = useState(cached?.classes ?? []);
  const [instructors, setInstructors] = useState(cached?.instructors ?? []);
  const [staff, setStaff] = useState(cached?.staff ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const hasCache = !!readRouteCache(ADMIN_CACHE_KEY);
    if (hasCache) {
      if (mounted.current) setRefreshing(true);
    } else if (mounted.current) {
      setLoading(true);
    }
    try {
      const [statsData, classesData, instructorsData, staffData] = await Promise.all([
        dashboardApi.getStats(),
        classApi.getClasses({ limit: 100, upcoming: 'false' }),
        userApi.getUsers({ role: 'instructor' }),
        userApi.getUsers(),
      ]);
      if (!mounted.current) return;
      const next = {
        stats: statsData,
        classes: classesData.classes,
        instructors: instructorsData.users,
        staff: staffData.users.filter((u) => u.role !== 'admin'),
      };
      setStats(next.stats);
      setClasses(next.classes);
      setInstructors(next.instructors);
      setStaff(next.staff);
      writeRouteCache(ADMIN_CACHE_KEY, next);
    } catch (err) {
      if (mounted.current) toast.error(err.message);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [mounted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data) => {
    try {
      if (editingClass) {
        await classApi.updateClass(editingClass._id, data);
        toast.success('Class updated');
      } else {
        await classApi.createClass(data);
        toast.success('Class created');
      }
      setModalOpen(false);
      setEditingClass(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddStaff = async (data) => {
    try {
      await userApi.createUser(data);
      toast.success(`${data.role} added successfully`);
      setStaffModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await classApi.deleteClass(deleteTarget._id);
      toast.success('Class deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-sage-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sage-500">Studio overview and class management</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingClass(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-700"
        >
          + Create Class
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className={`mt-8 ${refreshing ? 'opacity-60 transition-opacity' : ''}`}>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Classes" value={stats.totalClasses} icon="📚" accent="sage" />
        <StatCard label="Today's Classes" value={stats.todayClasses} icon="📅" accent="terracotta" />
        <StatCard label="Total Bookings" value={stats.totalBookings} icon="🎫" accent="blue" />
        <StatCard label="Available Seats" value={stats.availableSeats} icon="🪑" accent="amber" />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-sage-800">Staff</h2>
          <button
            type="button"
            onClick={() => setStaffModalOpen(true)}
            className="rounded-lg bg-sage-100 px-4 py-2 text-sm font-medium text-sage-700 hover:bg-sage-200"
          >
            + Add Staff
          </button>
        </div>
        {staff.length === 0 ? (
          <EmptyState title="No staff yet" description="Add instructors so you can schedule classes." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sage-100 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-sage-100 bg-sage-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-sage-700">Name</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Email</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Phone</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {staff.map((u) => (
                  <tr key={u._id}>
                    <td className="px-5 py-4 font-medium text-sage-900">{u.name}</td>
                    <td className="px-5 py-4 text-sage-600">{u.email}</td>
                    <td className="px-5 py-4 text-sage-600">{u.phone}</td>
                    <td className="px-5 py-4 capitalize text-sage-600">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-800">
          All Classes
        </h2>
        {classes.length === 0 ? (
          <EmptyState title="No classes yet" description="Create your first class to get started." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sage-100 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-sage-100 bg-sage-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-sage-700">Title</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Instructor</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Date</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Time</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Booked</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Remaining</th>
                  <th className="px-5 py-3 font-semibold text-sage-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {classes.map((c) => (
                  <tr key={c._id} className="hover:bg-sage-50/50">
                    <td className="px-5 py-4 font-medium text-sage-900">{c.title}</td>
                    <td className="px-5 py-4 text-sage-600">{c.instructor?.name}</td>
                    <td className="px-5 py-4 text-sage-600">{formatDate(c.date)}</td>
                    <td className="px-5 py-4 text-sage-600">
                      {c.startTime} – {c.endTime}
                    </td>
                    <td className="px-5 py-4 text-sage-600">{c.bookedCount}</td>
                    <td className="px-5 py-4 text-sage-600">{c.seatsLeft}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClass(c);
                            setModalOpen(true);
                          }}
                          className="rounded-lg bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700 hover:bg-sage-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </div>
      )}

      <ClassFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClass(null);
        }}
        onSave={handleSave}
        editingClass={editingClass}
        instructors={instructors}
      />

      <StaffFormModal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        onSave={handleAddStaff}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default AdminDashboard;
