const EmptyState = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sage-200 bg-white px-6 py-16 text-center">
    {icon && <div className="mb-4 text-4xl text-sage-300">{icon}</div>}
    <h3 className="font-display text-xl font-semibold text-sage-800">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-sm text-sage-500">{description}</p>
    )}
  </div>
);

export default EmptyState;
