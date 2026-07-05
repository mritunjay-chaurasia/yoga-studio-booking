import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { instructorApi } from '../apis';
import { useAuth } from '../contexts/AuthContext';
import { useIsMounted } from '../hooks/useIsMounted';
import { readRouteCache, writeRouteCache } from '../hooks/useRouteCache';
import { formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ClassScheduleCard = ({ yogaClass }) => (
  <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-display text-lg font-semibold text-sage-900">
          {yogaClass.title}
        </h3>
        <p className="text-sm text-sage-500">
          {formatDate(yogaClass.date)} · {yogaClass.startTime} –{' '}
          {yogaClass.endTime}
        </p>
        <p className="mt-1 text-sm text-sage-600">
          {yogaClass.bookedCount}/{yogaClass.capacity} booked ·{' '}
          {yogaClass.seatsLeft} seats left
        </p>
      </div>
    </div>
  </div>
);

const InstructorDashboard = () => {
  const { user } = useAuth();
  const mounted = useIsMounted();
  const cacheKey = `instructor-dashboard-${user._id}`;
  const cached = readRouteCache(cacheKey);
  const [schedule, setSchedule] = useState(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const hasCache = !!readRouteCache(cacheKey);
      if (hasCache) {
        if (mounted.current) setRefreshing(true);
      } else if (mounted.current) {
        setLoading(true);
      }
      try {
        const data = await instructorApi.getSchedule(user._id);
        if (mounted.current) {
          setSchedule(data);
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
    };
    fetchSchedule();
  }, [user._id, mounted, cacheKey]);

  const renderClassList = (classes, emptyTitle) => {
    if (!classes?.length) {
      return <EmptyState title={emptyTitle} />;
    }
    return (
      <div className="space-y-4">
        {classes.map((c) => (
          <div key={c._id}>
            <button
              type="button"
              onClick={() =>
                setExpandedClass(expandedClass === c._id ? null : c._id)
              }
              className="w-full text-left"
            >
              <ClassScheduleCard yogaClass={c} />
            </button>
            {expandedClass === c._id && (
              <div className="mt-2 rounded-xl bg-sage-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-sage-700">
                  Students ({c.students?.length || 0})
                </h4>
                {c.students?.length ? (
                  <ul className="space-y-2">
                    {c.students.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-sage-800">
                          {s.name}
                        </span>
                        <span className="text-sage-500">{s.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-sage-500">No students booked yet</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-sage-900">
          Instructor Schedule
        </h1>
        <p className="mt-2 text-sage-500">Hello, {user.name}</p>
        <div className="mt-10 flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={refreshing ? 'opacity-60 transition-opacity' : undefined}>
      <h1 className="font-display text-3xl font-bold text-sage-900">
        Instructor Schedule
      </h1>
      <p className="mt-2 text-sage-500">Hello, {user.name}</p>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-800">
          Today&apos;s Classes
        </h2>
        {renderClassList(schedule?.todayClasses, 'No classes today')}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-sage-800">
          Upcoming Classes
        </h2>
        {renderClassList(schedule?.upcomingClasses, 'No upcoming classes')}
      </section>
    </div>
  );
};

export default InstructorDashboard;
