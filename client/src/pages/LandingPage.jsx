import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { classApi, bookingApi } from '../apis';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMounted } from '../hooks/useIsMounted';
import ClassCard from '../components/ClassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mounted = useIsMounted();
  const [classes, setClasses] = useState([]);
  const [bookedClassIds, setBookedClassIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [instructorFilter, setInstructorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [instructors, setInstructors] = useState([]);

  const fetchClasses = useCallback(async () => {
    if (mounted.current) setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch.slice(0, 100);
      if (instructorFilter) params.instructor = instructorFilter;
      if (dateFilter) params.date = dateFilter;
      const { classes: data } = await classApi.getClasses(params);
      if (!mounted.current) return;
      setClasses(data);

      const uniqueInstructors = [];
      const seen = new Set();
      data.forEach((c) => {
        const inst = c.instructor;
        if (inst?._id && !seen.has(inst._id)) {
          seen.add(inst._id);
          uniqueInstructors.push(inst);
        }
      });
      setInstructors(uniqueInstructors);
    } catch (err) {
      if (mounted.current) toast.error(err.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [debouncedSearch, instructorFilter, dateFilter, mounted]);

  const fetchStudentBookings = useCallback(async () => {
    if (user?.role !== 'student') return;
    try {
      const { bookings } = await bookingApi.getStudentBookings(user._id);
      if (!mounted.current) return;
      const ids = new Set(bookings.map((b) => b.yogaClass._id));
      setBookedClassIds(ids);
    } catch {
      /* ignore */
    }
  }, [user, mounted]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudentBookings();
  }, [fetchStudentBookings]);

  const handleBook = async (yogaClass) => {
    if (!user) {
      toast.info('Please login to book a class');
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      toast.error('Only students can book classes');
      return;
    }
    try {
      await bookingApi.createBooking({ yogaClass: yogaClass._id });
      toast.success('Class booked successfully!');
      if (mounted.current) {
        setBookedClassIds((prev) => new Set([...prev, yogaClass._id]));
      }
      fetchClasses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <section className="mb-10 rounded-3xl bg-gradient-to-br from-sage-600 to-sage-800 px-8 py-12 text-white">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Find Your Flow
        </h1>
        <p className="mt-4 max-w-xl text-lg text-sage-100">
          Browse upcoming yoga classes, see real-time seat availability, and book
          your spot in seconds.
        </p>
      </section>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search classes..."
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
        />
        <select
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
          className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none"
        >
          <option value="">All Instructors</option>
          {instructors.map((i) => (
            <option key={i._id} value={i._id}>
              {i.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon="🧘"
          title="No upcoming classes"
          description="Check back soon for new sessions."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard
              key={c._id}
              yogaClass={c}
              onBook={handleBook}
              booked={bookedClassIds.has(c._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPage;
