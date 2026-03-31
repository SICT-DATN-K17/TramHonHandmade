'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';
import Image from 'next/image';
import { CellAction } from './CellAction';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'image',
    header: 'Ảnh',
    cell: ({ row }) => {
      let imageUrl = row.original.image || '/tramhon-logo.png';
      if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
      }

      return (
        <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200">
          <Image
            src={imageUrl}
            alt={row.original.name || 'Ảnh sản phẩm'}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Tên sản phẩm',
    cell: ({ row }) => <span className="font-semibold line-clamp-2">{row.original.name}</span>
  },
  {
    accessorKey: 'price',
    header: 'Giá (VNĐ)',
    cell: ({ row }) => {
      const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Number(row.original.price));
      return <div className="text-[#D96C39] font-bold">{formattedPrice}</div>;
    },
  },
  {
    accessorKey: 'stockQuantity',
    header: 'Tồn kho',
    cell: ({ row }) => <span className="font-medium text-gray-700">{row.original.stockQuantity}</span>
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const isActive = row.original.status === 'ACTIVE';
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          {isActive ? 'Hoạt động' : 'Bị ẩn'}
        </span>
      );
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-right pr-4">Hành động</div>,
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];