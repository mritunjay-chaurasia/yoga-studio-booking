import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bookingApi } from '../apis';
import { useAuth } from '../contexts/AuthContext';
import { useIsMounted } from '../hooks/useIsMounted';
import { readRouteCache, writeRouteCache } from '../hooks/useRouteCache';
import { formatDate, isPastClass } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const BookingRow = ({ booking, onCancel }) => {
  const yogaClass = booking.yogaClass;
  const past = isPastClass(yogaClass);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-sage-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-display text-lg font-semibold text-sage-900">
          {yogaClass.title}
        </h3>
        <p className="text-sm text-sage-500">
          with {yogaClass.instructor?.name}
        </p>
        <p className="mt-2 text-sm text-sage-600">
          {formatDate(yogaClass.date)} · {yogaClass.startTime} –{' '}
          {yogaClass.endTime}
        </p>
      </div>
      {!past && (
        <button
          type="button"
          onClick={() => onCancel(booking)}
          className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Cancel Booking
        </button>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const mounted = useIsMounted();
  const cacheKey = `student-dashboard-${user._id}`;
  const cached = readRouteCache(cacheKey);
  const [bookings, setBookings] = useState(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    const hasCache = !!readRouteCache(cacheKey);
    if (hasCache) {
      if (mounted.current) setRefreshing(true);
    } else if (mounted.current) {
      setLoading(true);
    }
    try {
      const { bookings: data } = await bookingApi.getStudentBookings(user._id);
      if (mounted.current) {
        setBookings(data);
        writeRouteCache(cacheKey, data);
      }
    } catch (err) {
      if (mounted.current) toast.error(err.message);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user._id, mounted, cacheKey]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const upcoming = bookings.filter((b) => !isPastClass(b.yogaClass));
  const past = bookings.filter((b) => isPastClass(b.yogaClass));

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingApi.cancelBooking(cancelTarget._id);
      toast.success('Booking cancelled');
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-sage-900">
        My Bookings
      </h1>
      <p className="mt-2 text-sage-500">Welcome back, {user.name}</p>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className={`mt-10 ${refreshing ? 'opacity-60 transition-opacity' : ''}`}>
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-800">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming bookings"
            description="Browse classes on the home page to book your next session."
          />
        ) : (
          <div className="space-y-4">
            {upcoming.map((b) => (
              <BookingRow key={b._id} booking={b} onCancel={setCancelTarget} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-800">
          Past
        </h2>
        {past.length === 0 ? (
          <EmptyState title="No past bookings" />
        ) : (
          <div className="space-y-4">
            {past.map((b) => (
              <BookingRow key={b._id} booking={b} />
            ))}
          </div>
        )}
      </section>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for "${cancelTarget?.yogaClass?.title}"?`}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={cancelling}
      />
    </div>
  );
};

export default StudentDashboard;
