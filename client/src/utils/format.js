export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (time) => time;

export const isPastClass = (yogaClass) => {
  const classDate = new Date(yogaClass.date);
  const [h, m] = yogaClass.endTime.split(':').map(Number);
  classDate.setHours(h, m, 0, 0);
  return classDate < new Date();
};

export const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};
