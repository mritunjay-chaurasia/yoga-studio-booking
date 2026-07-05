const StatCard = ({ label, value, icon, accent = 'sage' }) => {
  const accents = {
    sage: 'from-sage-500 to-sage-700',
    terracotta: 'from-terracotta-400 to-terracotta-600',
    blue: 'from-blue-400 to-blue-600',
    amber: 'from-amber-400 to-amber-600',
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className={`bg-gradient-to-br ${accents[accent]} px-5 py-3`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="p-5">
        <p className="text-sm font-medium text-sage-500">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold text-sage-900">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
