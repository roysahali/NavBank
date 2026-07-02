import clsx from 'clsx'

interface SkeletonLineProps {
  className?: string
  width?: string
}

export function SkeletonLine({ className, width }: SkeletonLineProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-md bg-gray-200',
        className
      )}
      style={{ width }}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl border border-gray-100 p-6 shadow-sm', className)}>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative overflow-hidden w-12 h-12 rounded-full bg-gray-200">
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4" width="60%" />
          <SkeletonLine className="h-3" width="40%" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3" width="80%" />
        <SkeletonLine className="h-3" width="65%" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="px-6 py-4 border-b border-gray-50 last:border-0 flex gap-4 items-center"
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonLine
              key={ci}
              className={clsx('flex-1', ci === 0 ? 'h-4' : 'h-3')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Balance card skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-novbank-900 p-8 h-48">
        <div className="absolute inset-0 shimmer-dark" />
        <div className="space-y-3">
          <div className="relative overflow-hidden h-4 w-32 rounded-md bg-white/10">
            <div className="absolute inset-0 shimmer-dark" />
          </div>
          <div className="relative overflow-hidden h-10 w-56 rounded-md bg-white/10">
            <div className="absolute inset-0 shimmer-dark" />
          </div>
        </div>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable />
    </div>
  )
}
