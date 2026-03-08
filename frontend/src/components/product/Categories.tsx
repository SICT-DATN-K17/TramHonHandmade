'use client';

import {useState, useEffect} from 'react';
import Link from "next/link";
import {axiosClient} from "@/lib/axios";
import {EnrichedCategory, mapToEnrichedCategory} from "@/utils/CategoryMapper";
import { RawCategoryResponse } from '@/types/apiTypes';

const categoryIcons: { [key: string]: string } = {
    "Đồng hồ": "🕰️",
    "Hoa vĩnh cửu": "🌹",
    "Quà tặng": "🎁",
    "Thiệp handmade": "💌",
    "Phụ kiện & nguyên liệu": "🧵",
    "Vải decor": "🧣",
    "Ví & passport": "💼",
    "Limited": "🌟",
};

export default function Categories() {
    const [categories, setCategories] = useState<EnrichedCategory[]>([]);

    useEffect(() => {

        const fetchCategories = async () => {
            try {
                const response = await axiosClient.get<RawCategoryResponse[]>('/category');
                const enrichedData = response.data.map(mapToEnrichedCategory);
                const categoriesData = enrichedData.slice(0, 4);

                console.log(">>> Categories data (Enriched):", categoriesData);
                setCategories(categoriesData);

            } catch (error) {
                console.error("Failed to fetch categories:", error);
                setCategories([]);
            }
        }

        fetchCategories().catch(console.error);

    }, []);

    return (
        <section className="mt-16 py-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 text-[#3F2E23]">Danh mục nổi bật</h2>
                <div className="h-1 w-20 rounded-full bg-[#D96C39]"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/shop/products?categoryId=${category.id}`}
                        className="group relative block"
                    >
                        {/* Background hover effect */}
                        <div className="absolute inset-0 rounded-2xl transform group-hover:scale-105 transition-transform duration-300 -z-10 bg-[#D96C39]/10"></div>

                        {/* Card Content */}
                        <div className="rounded-2xl shadow-sm p-6 flex flex-col items-center text-center transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-2 bg-[#F7F1E8]">

                            {/* Icon Circle */}
                            <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 bg-[#F4C27A]/60">
                                {categoryIcons[category.name] || '🎁'}
                            </div>

                            <h3 className="text-lg font-semibold group-hover:font-bold transition-all duration-300 text-[#3F2E23]">
                                {category.name}
                            </h3>

                            <div className="text-sm mt-2 text-[#6B4F3E]">
                                Đã bán: <span className="font-semibold text-[#D96C39]">{category.soldCount ?? 0}</span>
                            </div>

                            {/* Decorative Line */}
                            <div className="h-0.5 w-0 rounded-full mt-3 group-hover:w-12 transition-all duration-300 bg-[#D96C39]"></div>

                            {/* Arrow */}
                            <div className="mt-3 transition-colors duration-300 transform group-hover:translate-x-1 text-[#D96C39]">
                                →
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}