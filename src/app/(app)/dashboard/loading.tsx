const DashboardLoading = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-64 rounded-2xl border border-surface2 bg-card p-3 shadow-sm">
          <div className="h-full animate-pulse rounded-md bg-surface" />
        </div>
      ))}
    </section>
  );
};

export default DashboardLoading;
