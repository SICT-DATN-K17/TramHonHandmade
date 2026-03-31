'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './CellAction';
import { Product } from '@/types';
import Image from 'next/image';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'image',
    header: 'Hình ảnh',
    cell: ({ row }) => {
      // Xử lý link ảnh an toàn giống như ngoài trang Cửa hàng
      let imageUrl = row.original.image || '/tramhon-logo.png';
      if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
      }

      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-gray-200">
          <Image
            src={imageUrl}
            alt={row.original.name || 'Product Image'}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      );
    },
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
      return <div className="font-medium text-[#D96C39]">{formatted}</div>;
    },
  },
  {
    accessorKey: 'stockQuantity',
    header: 'Tồn kho',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {status}
        </span>
      );
    }
  },
  {
    accessorKey: 'categoryName',
    header: 'Danh mục',
    cell: ({ row }) => {
      return <div>{row.getValue('categoryName') || 'Chưa phân loại'}</div>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];