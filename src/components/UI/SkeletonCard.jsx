import React from 'react';

// Shared shimmer base
const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
);

// ----- SkeletonCard -----
// Matches the StatCard dimensions used throughout the app
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 space-y-3">
        {/* label */}
        <Shimmer className="h-2.5 w-20 rounded-full" />
        {/* value */}
        <Shimmer className="h-7 w-36 rounded-lg" />
        {/* sub-label */}
        <Shimmer className="h-2 w-24 rounded-full" />
      </div>
      {/* icon placeholder */}
      <Shimmer className="h-14 w-14 rounded-2xl shrink-0 ml-4" />
    </div>
  </div>
);

// ----- SkeletonList -----
// Mimics a list of expense/income rows
export const SkeletonList = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4">
        {/* category icon circle */}
        <Shimmer className="h-10 w-10 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Shimmer className="h-3 w-1/3 rounded-full" />
          <Shimmer className="h-2.5 w-1/5 rounded-full" />
        </div>
        {/* amount */}
        <Shimmer className="h-4 w-16 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
);

// ----- SkeletonChart -----
// Placeholder for recharts chart area
export const SkeletonChart = ({ height = 220 }) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6"
    style={{ minHeight: height + 48 }}
  >
    {/* chart title area */}
    <div className="flex items-center justify-between mb-6">
      <Shimmer className="h-4 w-32 rounded-full" />
      <Shimmer className="h-4 w-20 rounded-full" />
    </div>

    {/* bars / chart body */}
    <div
      className="flex items-end gap-3 animate-pulse"
      style={{ height }}
    >
      {[65, 85, 50, 90, 70, 40, 80].map((pct, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t-lg"
          style={{ height: `${pct}%` }}
        />
      ))}
    </div>

    {/* x-axis labels */}
    <div className="flex gap-3 mt-3">
      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((_, i) => (
        <Shimmer key={i} className="flex-1 h-2 rounded-full" />
      ))}
    </div>
  </div>
);

export default SkeletonCard;
