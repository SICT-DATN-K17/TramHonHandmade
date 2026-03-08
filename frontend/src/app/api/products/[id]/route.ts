import { db } from "../../_lib/mockData";
import { NextRequest, NextResponse } from "next/server";

// Hàm hỗ trợ tìm sản phẩm và chỉ mục của nó trong mảng dữ liệu
const findProduct = (id: number) => {
  const productIndex = db.products.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    return { product: null, productIndex: -1 };
  }
  return { product: db.products[productIndex], productIndex };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ" }, { status: 400 });
    }

    const { product } = findProduct(id);

    if (product) {
      const category = db.categories.find(c => c.id === product.category_id);
      const productWithCategory = {
        ...product,
        categoryName: category ? category.name : null,
      };
      return NextResponse.json(productWithCategory);
    } else {
      return NextResponse.json({ message: `Không tìm thấy sản phẩm với ID ${id}` }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch product:`, error);
    return NextResponse.json({ message: "Lỗi khi lấy dữ liệu sản phẩm" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ" }, { status: 400 });
    }

    const { product, productIndex } = findProduct(id);

    if (!product) {
      return NextResponse.json({ message: `Không tìm thấy sản phẩm với ID ${id}` }, { status: 404 });
    }

    const body = await request.json();
    // Cập nhật sản phẩm trong mảng dữ liệu mock
    const updatedProduct = { ...product, ...body };
    db.products[productIndex] = updatedProduct;

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Failed to update product:`, error);
    return NextResponse.json({ message: "Lỗi khi cập nhật sản phẩm" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ" }, { status: 400 });
    }
    
    const { product, productIndex } = findProduct(id);
    
    if (!product) {
      return NextResponse.json({ message: `Không tìm thấy sản phẩm với ID ${id}` }, { status: 404 });
    }

    // Xóa sản phẩm khỏi mảng dữ liệu mock
    db.products.splice(productIndex, 1);

    return new NextResponse(null, { status: 204 }); // 204 No Content: Xóa thành công, không có nội dung trả về
  } catch (error) {
    console.error(`Failed to delete product:`, error);
    return NextResponse.json({ message: "Lỗi khi xóa sản phẩm" }, { status: 500 });
  }
}
