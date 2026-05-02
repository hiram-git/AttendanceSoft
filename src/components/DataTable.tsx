import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'

interface Props<T> {
  data: Array<T>
  columns: Array<ColumnDef<T>>
  globalFilter?: string
  emptyState?: ReactNode
  isLoading?: boolean
}

export function DataTable<T>({
  data,
  columns,
  globalFilter,
  emptyState,
  isLoading,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: globalFilter ?? '',
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sort = header.column.getIsSorted()
                const sortable = header.column.getCanSort()
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                    className={sortable ? 'sortable' : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortable && (
                          <span style={{ opacity: sort ? 1 : 0.4, fontSize: 10 }}>
                            {sort === 'asc' ? '▲' : sort === 'desc' ? '▼' : '↕'}
                          </span>
                        )}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skel-${i}`}>
                {columns.map((_col, j) => (
                  <td key={j}>
                    <span
                      className="skel"
                      style={{ height: 14, width: j === 0 ? '60%' : '40%' }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table-empty">
                {emptyState ?? 'Sin resultados.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
