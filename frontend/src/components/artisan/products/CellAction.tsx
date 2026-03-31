'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types';
import { useRouter } from 'next/navigation';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import toast from 'react-hot-toast';

interface CellActionProps {
    data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
    const axiosAuth = useAxiosAuth();
    const [loading, setLoading] = useState(false);

    const onEdit = () => {
        router.push(`/artisan/products/${data.id}`);
    };

    const onDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        
        try {
            setLoading(true);
            await axiosAuth.delete(`/products/${data.id}/`);
            toast.success('Xóa sản phẩm thành công');
            window.dispatchEvent(new Event('products-refresh'));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error('Xóa sản phẩm thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                    <span className="sr-only">Mở menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600 focus:text-red-700">
                    <Trash className="mr-2 h-4 w-4" />
                    Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};