import { formatDate, formatTime } from '../utils/format';

const ClassCard = ({ yogaClass, onBook, showBookButton = true, booked = false }) => {
  const instructorName =
    yogaClass.instructor?.name || yogaClass.instructor || 'TBA';
  const full = yogaClass.seatsLeft === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sage-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="bg-gradient-to-br from-sage-500 to-sage-700 px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-white">
          {yogaClass.title}
        </h3>
        <p className="mt-1 text-sm text-sage-100">with {instructorName}</p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-sage-600">
          {yogaClass.description}
        </p>
        <div className="space-y-2 text-sm text-sage-700">
          <div className="flex items-center gap-2">
            <span className="text-sage-400">📅</span>
            {formatDate(yogaClass.date)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sage-400">🕐</span>
            {formatTime(yogaClass.startTime)} – {formatTime(yogaClass.endTime)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sage-400">🪑</span>
            <span
              className={
                full ? 'font-medium text-red-500' : 'font-medium text-sage-600'
              }
            >
              {full ? 'Full' : `${yogaClass.seatsLeft} seats left`}
            </span>
            <span className="text-sage-400">
              ({yogaClass.bookedCount || 0}/{yogaClass.capacity})
            </span>
          </div>
        </div>
        {showBookButton && onBook && (
          <button
            type="button"
            onClick={() => onBook(yogaClass)}
            disabled={full || booked}
            className="mt-5 w-full rounded-xl bg-terracotta-500 py-2.5 text-sm font-semibold text-white transition hover:bg-terracotta-600 disabled:cursor-not-allowed disabled:bg-sage-200 disabled:text-sage-400"
          >
            {booked ? 'Already Booked' : full ? 'Class Full' : 'Book Class'}
          </button>
        )}
      </div>
    </article>
  );
};

export default ClassCard;
