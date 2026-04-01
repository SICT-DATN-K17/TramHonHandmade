import type { OrderItem } from '@/types';
import type { Product } from '@/types';

/**
 * LocalStorage key for storing products
 */
const PRODUCTS_STORAGE_KEY = 'artivio_products';

/**
 * Type for products array that can be modified
 */
type ProductsArray = Product[];

/**
 * Extended Product type with out of stock status
 */
type ProductWithStockStatus = Product & {
  isOutOfStock?: boolean;
  stockStatus?: 'In Stock' | 'Out of Stock';
};

/**
 * Custom error class for inventory validation failures
 */
class InventoryError extends Error {
  constructor(message: string, public productId?: number, public productName?: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

/**
 * Reads all products from localStorage
 * @returns Array of products or empty array if none exist
 */
function getProductsFromStorage(): Product[] {
  try {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available in server environment');
    }

    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read products from localStorage:', error);
    throw new Error('Failed to read products from localStorage');
  }
}

/**
 * Saves products array to localStorage
 * @param products - Array of products to save
 */
function saveProductsToStorage(products: Product[]): void {
  try {
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available in server environment');
    }

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products to localStorage:', error);
    throw new Error('Failed to save products to localStorage');
  }
}

/**
 * Validates that all order items have sufficient stock
 * @param products - Current products array
 * @param orderItems - Order items to validate
 * @throws InventoryError if any product fails validation
 */
function validateStockAvailability(
  products: Product[],
  orderItems: OrderItem[]
): void {
  for (const orderItem of orderItems) {
    if (!orderItem.productId) {
      continue;
    }

    const product = products.find((p) => p.id === orderItem.productId);

    if (!product) {
      throw new InventoryError(
        `Product with ID ${orderItem.productId} not found`,
        orderItem.productId
      );
    }

    if (product.stockQuantity < orderItem.quantity) {
      throw new InventoryError(
        `Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${orderItem.quantity}`,
        product.id,
        product.name
      );
    }

    const newStockQuantity = product.stockQuantity - orderItem.quantity;
    if (newStockQuantity < 0) {
      throw new InventoryError(
        `Stock quantity cannot be negative for product "${product.name}"`,
        product.id,
        product.name
      );
    }
  }
}

function updateInventoryCore(products: ProductsArray, orderItems: OrderItem[]): ProductsArray {
  // Validate input
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new InventoryError('Order items array is required and cannot be empty');
  }

  const validOrderItems = orderItems.filter((item) => item.productId !== null && item.productId !== undefined);
  
  if (validOrderItems.length === 0) {
    throw new InventoryError('No valid order items with productId found');
  }

  if (products.length === 0) {
    throw new InventoryError('No products found');
  }

  validateStockAvailability(products, validOrderItems);

  const productUpdates = new Map<number, { quantity: number }>();

  for (const orderItem of validOrderItems) {
    if (!orderItem.productId) continue;

    const existing = productUpdates.get(orderItem.productId) || { quantity: 0 };
    productUpdates.set(orderItem.productId, {
      quantity: existing.quantity + orderItem.quantity,
    });
  }

  const updatedProducts = products.map((product) => {
    const update = productUpdates.get(product.id);

    if (!update) {
      return product;
    }

    const newStockQuantity = product.stockQuantity - update.quantity;
    const newQuantitySold = product.quantitySold + update.quantity;

    if (newStockQuantity < 0) {
      throw new InventoryError(
        `Stock quantity would become negative for product "${product.name}"`,
        product.id,
        product.name
      );
    }

    const updatedProduct: Product = {
      ...product,
      stockQuantity: newStockQuantity,
      quantitySold: newQuantitySold,
      updatedAt: new Date().toISOString(),
    };

    return updatedProduct;
  });

  return updatedProducts;
}

export function updateInventoryAfterOrder(orderItems: OrderItem[]): void {
  try {
    const products = getProductsFromStorage();

    if (products.length === 0) {
      throw new InventoryError('No products found in storage. Please initialize products first.');
    }

    const productsBackup = JSON.parse(JSON.stringify(products)) as Product[];
    const updatedProducts = updateInventoryCore(products, orderItems);

    try {
      saveProductsToStorage(updatedProducts);
    } catch (saveError) {
      saveProductsToStorage(productsBackup);
      throw new InventoryError(
        `Failed to save updated products: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
      );
    }

    console.log(
      `Inventory updated successfully for ${orderItems.length} order item(s)`
    );
  } catch (error) {
    if (error instanceof InventoryError) {
      throw error;
    }

    throw new InventoryError(
      `Unexpected error during inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function updateInventoryAfterOrderServer(
  productsArray: ProductsArray,
  orderItems: OrderItem[]
): void {
  try {
    const updatedProducts = updateInventoryCore([...productsArray], orderItems);
    
    for (const updatedProduct of updatedProducts) {
      const index = productsArray.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        productsArray[index] = updatedProduct;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        saveProductsToStorage(updatedProducts);
      } catch (localStorageError) {
        console.warn('Failed to sync to localStorage:', localStorageError);
      }
    }

    console.log(
      `Server inventory updated successfully for ${orderItems.length} order item(s)`
    );
  } catch (error) {
    if (error instanceof InventoryError) {
      throw error;
    }

    throw new InventoryError(
      `Unexpected error during server inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function initializeProductsStorage(products: Product[]): void {
  try {
    if (typeof window === 'undefined') {
      return; 
    }

    const existing = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!existing) {
      saveProductsToStorage(products);
      console.log(`Initialized localStorage with ${products.length} products`);
    }
  } catch (error) {
    console.error('Failed to initialize products storage:', error);
  }
}

export function isProductOutOfStock(product: Product): boolean {
  // 👉 FIX: stockQuantity
  return product.stockQuantity <= 0;
}

export function getStockStatusText(product: Product): 'In Stock' | 'Out of Stock' {
  // 👉 FIX: stockQuantity
  return product.stockQuantity <= 0 ? 'Out of Stock' : 'In Stock';
}

export function shouldDisableAddToCart(product: Product): boolean {
  // 👉 FIX: stockQuantity
  return product.stockQuantity <= 0;
}