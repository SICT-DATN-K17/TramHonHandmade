
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './CellAction';
import { Product } from '@/types';
import Image from 'next/image';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'image',
    header: 'Hình ảnh',
    cell: ({ row }) => (
      <div className="relative h-10 w-10">
        <Image
          src={row.original.image || '/tramhon-logo.png'} // Fallback image
          alt={row.original.name}
          fill
          className="rounded-md object-cover"
        />
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Tên sản phẩm',
  },
  {
    accessorKey: 'price',
    header: 'Giá',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'stock_quantity',
    header: 'Tồn kho',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
  },
  {
    accessorKey: 'category_id',
    header: 'Danh mục',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
