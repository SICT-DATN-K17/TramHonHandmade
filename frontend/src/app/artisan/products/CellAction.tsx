'use client';

import { Product } from '@/types';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface CellActionProps {
  data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('Product ID copied to clipboard');
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 w-8 p-0 flex items-center justify-center rounded-full hover:bg-[#FFF8F0]"
        style={{ color: '#6B4F3E' }}
      >
        <span className="sr-only">Mở menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md shadow-lg py-1"
          style={{ backgroundColor: '#FFF8F0', border: '1px solid #E8D5B5' }}
        >
          <div className="px-4 py-2 text-xs font-semibold" style={{ color: '#6B4F3E' }}>
            Hành động
          </div>
          <button
            onClick={() => onCopy(data.id.toString())}
            className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[#FCE9D8]"
            style={{ color: '#3F2E23' }}
          >
            Sao chép ID
          </button>
          <button
            onClick={() => { /* Logic for updating product */ setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[#FCE9D8]"
            style={{ color: '#3F2E23' }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Cập nhật
          </button>
          <button
            onClick={() => { /* Logic for deleting, was setOpen(true) for a modal */ setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[#FCE9D8] text-red-600 hover:text-red-700"
          >
            <Trash className="mr-2 h-4 w-4" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};