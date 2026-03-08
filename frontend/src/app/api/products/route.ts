import { db } from "../_lib/mockData";
import { NextRequest, NextResponse } from "next/server";

// Định nghĩa kiểu dữ liệu cho một sản phẩm để code an toàn hơn
type Product = typeof db.products[0];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let filteredProducts = [...db.products];

    const categoryId = searchParams.get("categoryId");
    if (categoryId) {
      filteredProducts = filteredProducts.filter((p: Product) => 
        p.category_id === parseInt(categoryId)
      );
    }

    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      filteredProducts = filteredProducts.filter((p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Enrich products with category names before sorting and pagination
    let productsWithCategories = filteredProducts.map(product => {
      const category = db.categories.find(c => c.id === product.category_id);
      return {
        ...product,
        categoryName: category ? category.name : 'N/A', // Add category name
      };
    });

    const sortBy = searchParams.get('sort') || 'featured';
    productsWithCategories.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-desc':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'featured':
        default:
          return (b.quantity_sold || 0) - (a.quantity_sold || 0);
      }
    });

    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "20");

    if (size === 0) {
      return NextResponse.json({
        content: productsWithCategories,
        totalElements: productsWithCategories.length,
        totalPages: 1,
        currentPage: 0,
        size: productsWithCategories.length,
      }, { status: 200 });
    }

    const start = page * size;
    const end = start + size;
    const paginatedProducts = productsWithCategories.slice(start, end);

    const response = {
      content: paginatedProducts,
      totalElements: productsWithCategories.length,
      totalPages: Math.ceil(productsWithCategories.length / size),
      currentPage: page,
      size: size,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Giả lập tạo ID mới (Lấy ID lớn nhất hiện tại + 1)
    const newId = db.products.length > 0 ? Math.max(...db.products.map((p) => Number(p.id))) + 1 : 1;

    // Tìm categoryName dựa trên categoryId gửi lên
    const category = db.categories.find(c => c.id === Number(body.categoryId));

    const newProduct = {
      ...body,
      id: newId,
      artisan_id: 1, // Assuming a default artisan_id
      name: body.name || "Sản phẩm mới",
      price: Number(body.price),
      image: body.image || "https://placehold.co/600x400?text=No+Image",
      quantity_sold: 0,
      stock_quantity: Number(body.stock_quantity),
      category_id: Number(body.category_id),
      status: body.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Thêm vào đầu danh sách giả lập
    db.products.unshift(newProduct as Product);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
