import { NextResponse } from 'next/server';
import { db, type Order, type OrderItem } from '../_lib/mockData';
import type { ShippingAddress, PaymentMethod } from '@/types';
import { updateInventoryAfterOrderServer } from '@/lib/inventory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, paymentMethod, subtotal, shippingFee, total } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Giỏ hàng trống' }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ message: 'Vui lòng cung cấp thông tin giao hàng' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ message: 'Vui lòng chọn phương thức thanh toán' }, { status: 400 });
    }

    // Validate shipping address fields
    const requiredFields: (keyof ShippingAddress)[] = ['fullName', 'phone', 'email', 'address'];
    for (const field of requiredFields) {
      if (!shippingAddress[field] || !shippingAddress[field].trim()) {
        return NextResponse.json({ message: `Vui lòng điền đầy đủ thông tin ${field}` }, { status: 400 });
      }
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
      return NextResponse.json({ message: 'Số điện thoại không hợp lệ' }, { status: 400 });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      return NextResponse.json({ message: 'Email không hợp lệ' }, { status: 400 });
    }

    // Check product availability
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json({ message: `Sản phẩm ${item.name} không tồn tại` }, { status: 404 });
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { message: `Sản phẩm ${item.name} không đủ số lượng trong kho` },
          { status: 400 }
        );
      }
    }

    // Generate order number
    const orderId = Date.now();

    // Create order
    const order: Order = {
      id: orderId,
      customer_id: 1, // Assuming a default customer_id
      artisan_id: 1, // Assuming a default artisan_id
      chat_id: null,
      total_price: Number(total) || 0,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
    };

    // Save order
    db.orders.push(order);

    // Create and save order items
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const orderItem: OrderItem = {
        id: Date.now() + item.product_id,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_order: item.price,
      };
      db.orderItems.push(orderItem);
      orderItems.push(orderItem);
    }

    // Update product inventory after successful order
    // This updates stock_quantity and quantity_sold for all products in the order
    try {
      updateInventoryAfterOrderServer(db.products, orderItems);
    } catch (inventoryError) {
      // If inventory update fails, we should rollback the order
      // Remove the order and order items we just added
      const orderIndex = db.orders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        db.orders.remove(orderIndex);
      }
      db.orderItems = db.orderItems.filter(item => item.order_id !== orderId);
      
      const errorMessage = inventoryError instanceof Error ? inventoryError.message : 'Lỗi cập nhật kho hàng';
      return NextResponse.json(
        { message: errorMessage },
        { status: 400 }
      );
    }

    // In a real application, you would also:
    // 1. Create payment transaction
    // 2. Send confirmation email

    return NextResponse.json(
      {
        message: 'Đặt hàng thành công',
        orderId: order.id,
        orderNumber: `ART-${order.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json({ message: 'Lỗi không xác định từ server.' }, { status: 500 });
  }
}

// Get orders (for future use - order history)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const order = db.orders.find((o) => o.id === Number(orderId));
      if (!order) {
        return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      // Lấy các mục hàng (order items) liên quan đến đơn hàng
      const orderItems = db.orderItems.filter(item => item.order_id === order.id);
      
      // Lấy chi tiết sản phẩm cho từng mục hàng
      const detailedItems = orderItems.map(item => {
        const product = db.products.find(p => p.id === item.product_id);
        return {
          productId: item.product_id,
          productName: product?.name || 'Sản phẩm không xác định',
          quantity: item.quantity,
          price: item.price_order,
          image: product?.image || '',
        };
      });

      // Lấy dữ liệu thực tế từ order đã lưu
      const fullOrderDetails = {
        id: order.id,
        orderNumber: `ART-${order.id}`,
        createdAt: order.created_at,
        status: order.status.toLowerCase(),
        total: order.total_price,
        items: detailedItems,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
      };

      return NextResponse.json(fullOrderDetails);
    }

    if (userId) {
      // Logic này vẫn giữ nguyên, nhưng trong ứng dụng thực tế cũng cần trả về chi tiết
      const userOrders = db.orders.filter((o) => o.customer_id === Number(userId));
      return NextResponse.json(userOrders);
    }

    // Trả về tất cả đơn hàng (chỉ dành cho admin)
    return NextResponse.json(db.orders);
  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json({ message: 'Lỗi không xác định từ server.' }, { status: 500 });
  }
}

