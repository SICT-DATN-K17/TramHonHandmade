'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

// Button styles for pagination, matching the client-side theme
const paginationButtonStyles: React.CSSProperties = {
  backgroundColor: '#F7F1E8',
  color: '#3F2E23',
  borderColor: '#D96C39',
  borderWidth: '1px',
};

const paginationButtonDisabledStyles: React.CSSProperties = {
  ...paginationButtonStyles,
  opacity: 0.5,
  cursor: 'not-allowed',
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md" style={{border: '1px solid #E8D5B5'}}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center space-x-2 py-4">
        <button
          className="px-4 py-2 text-sm rounded-md font-medium shadow-sm transition-transform transform hover:scale-105"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={!table.getCanPreviousPage() ? paginationButtonDisabledStyles : paginationButtonStyles}
        >
          Trang trước
        </button>
        
        {Array.from({ length: table.getPageCount() }).map((_, i) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageCount = table.getPageCount();
          const show = pageCount <= 7 || Math.abs(i - pageIndex) <= 2 || i === 0 || i === pageCount - 1;
          if (!show) {
            const leftGap = i === 1 && pageIndex > 3;
            const rightGap = i === pageCount - 2 && pageIndex < pageCount - 4;
            if (leftGap || rightGap) {
              return <span key={`gap-${i}`} className="px-2 font-medium" style={{ color: '#D96C39' }}>…</span>;
            }
            return null;
          }
          return (
            <button
              key={i}
              onClick={() => table.setPageIndex(i)}
              className="px-4 py-2 text-sm rounded-md font-medium shadow-sm transition-transform transform hover:scale-105"
              style={{
                ...paginationButtonStyles,
                backgroundColor: i === pageIndex ? '#D96C39' : '#F7F1E8',
                color: i === pageIndex ? 'white' : '#3F2E23',
              }}
            >
              {i + 1}
            </button>
          );
        })}

        <button
          className="px-4 py-2 text-sm rounded-md font-medium shadow-sm transition-transform transform hover:scale-105"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={!table.getCanNextPage() ? paginationButtonDisabledStyles : paginationButtonStyles}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}