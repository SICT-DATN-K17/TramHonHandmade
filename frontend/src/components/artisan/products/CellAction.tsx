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
// import { fetchApi } from '@/services/api'; // DELETE: Bỏ fetchApi
import useAxiosAuth from '@/hooks/useAxiosAuth'; // ADD: Import useAxiosAuth

interface CellActionProps {
    data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();

    // 1. Khởi tạo hook axiosAuth
    const axiosAuth = useAxiosAuth();

    const [loading, setLoading] = useState(false);

    const onEdit = () => {
        router.push(`/artisan/products/${data.id}`);
    };

    const onDelete = async () => {
        try {
            setLoading(true);

            // 2. Sử dụng axiosAuth.delete thay cho fetchApi
            await axiosAuth.delete(`/products/${data.id}/`);

            // Trigger custom event to refresh products list
            window.dispatchEvent(new Event('products-refresh'));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete product', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};