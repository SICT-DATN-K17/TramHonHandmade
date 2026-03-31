'use client';

import { Product } from '@/types';
import { Edit, MoreHorizontal, Trash, Copy, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import toast from 'react-hot-toast';

interface CellActionProps {
  data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const axiosAuth = useAxiosAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setIsCopied(true);
    toast.success('Đã sao chép ID sản phẩm');
    setTimeout(() => setIsCopied(false), 2000);
    setIsOpen(false);
  };

  const onEdit = () => {
    router.push(`/artisan/products/${data.id}`);
    setIsOpen(false);
  };

  const onDelete = async () => {
    setIsOpen(false);
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${data.name}" không?`)) return;

    try {
      setIsDeleting(true);
      await axiosAuth.delete(`/products/${data.id}/`);
      toast.success('Xóa sản phẩm thành công');
      window.dispatchEvent(new Event('products-refresh'));
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      toast.error('Xóa sản phẩm thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="relative text-right pr-4" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isDeleting}
        className="h-8 w-8 p-0 flex items-center justify-center rounded-full hover:bg-[#E8D5B5] transition-colors ml-auto disabled:opacity-50"
        style={{ color: '#6B4F3E' }}
      >
        <span className="sr-only">Mở menu</span>
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-4 z-50 mt-1 w-48 origin-top-right rounded-md shadow-xl py-1 transform opacity-100 scale-100 transition-all"
          style={{ backgroundColor: '#FFF8F0', border: '1px solid #E8D5B5' }}
        >
          <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider" style={{ color: '#6B4F3E' }}>
            Hành động
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(data.id.toString()); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center hover:bg-[#FCE9D8] transition-colors"
            style={{ color: '#3F2E23' }}
          >
            {isCopied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4 text-gray-500" />}
            {isCopied ? 'Đã sao chép' : 'Sao chép ID'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center hover:bg-[#FCE9D8] transition-colors"
            style={{ color: '#3F2E23' }}
          >
            <Edit className="mr-2 h-4 w-4 text-blue-600" />
            Cập nhật
          </button>
          <div className="border-t my-1" style={{ borderColor: '#E8D5B5' }}></div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash className="mr-2 h-4 w-4" />
            Xóa sản phẩm
          </button>
        </div>
      )}
    </div>
  );
};