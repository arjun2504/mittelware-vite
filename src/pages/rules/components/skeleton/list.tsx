import { Skeleton } from "@mantine/core";

interface SkeletonListProps {
  rows?: number;
}


const SkeletonList = (props: SkeletonListProps) => {
  const { rows = 5 } = props;
  // Column widths: Name (30%), Type (15%), LastModified (15%), Created At (15%), Actions (25%)
  return (
    <div className="datatable-skeleton flex flex-col w-full overflow-x-auto">
      {/* Table header with column names */}
      <div
        className="px-2 py-4 font-semibold text-sm rounded-t w-full"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
          backgroundColor: 'var(--mantine-color-default)',
          color: 'var(--mantine-color-text)',
          border: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <span style={{ width: 24, flex: '0 0 24px' }}></span>
        <span style={{ minWidth: 120, flex: '2 1 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Name</span>
        <span style={{ minWidth: 110, flex: '1 1 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Last Modified</span>
        <span style={{ minWidth: 120, flex: '1.5 1 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Actions</span>
      </div>
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`px-2 py-4 border border-t-0 w-full ${rowIndex === rows - 1 ? 'rounded-b' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0,
            borderRadius: rowIndex === rows - 1 ? '0 0 0.5rem 0.5rem' : 0, width: '100%',
            backgroundColor: 'var(--mantine-color-body)',
            borderColor: 'var(--mantine-color-default-border)',
          }}
        >
          {/* Checkbox skeleton */}
          <Skeleton height={20} width={24} radius="sm" />
          {/* Name */}
          <Skeleton height={20} style={{ minWidth: 120, flex: '2 1 0' }} radius="sm" />
          {/* LastModified */}
          <Skeleton height={20} style={{ minWidth: 110, flex: '1 1 0' }} radius="sm" />
          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', minWidth: 120, flex: '1.5 1 0' }}>
            {Array.from({ length: 2 }).map((_, btnIndex) => (
              <Skeleton key={btnIndex} height={28} width={btnIndex === 0 ? 40 : 28} radius="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonList;