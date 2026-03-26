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
    // Skip items without product_id
    if (!orderItem.product_id) {
      continue;
    }

    const product = products.find((p) => p.id === orderItem.product_id);

    if (!product) {
      throw new InventoryError(
        `Product with ID ${orderItem.product_id} not found`,
        orderItem.product_id
      );
    }

    // Validate stock quantity is sufficient
    if (product.stock_quantity < orderItem.quantity) {
      throw new InventoryError(
        `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${orderItem.quantity}`,
        product.id,
        product.name
      );
    }

    // Ensure stock will not become negative (double-check)
    const newStockQuantity = product.stock_quantity - orderItem.quantity;
    if (newStockQuantity < 0) {
      throw new InventoryError(
        `Stock quantity cannot be negative for product "${product.name}"`,
        product.id,
        product.name
      );
    }
  }
}

/**
 * Core inventory update logic that works with any products array
 * This is the shared logic used by both server-side and client-side implementations
 * 
 * @param products - Products array to update (will be modified in place)
 * @param orderItems - Array of order items containing product_id and quantity
 * @returns Updated products array
 * @throws InventoryError if validation fails
 */
function updateInventoryCore(products: ProductsArray, orderItems: OrderItem[]): ProductsArray {
  // Validate input
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new InventoryError('Order items array is required and cannot be empty');
  }

  // Filter out items without product_id
  const validOrderItems = orderItems.filter((item) => item.product_id !== null && item.product_id !== undefined);
  
  if (validOrderItems.length === 0) {
    throw new InventoryError('No valid order items with product_id found');
  }

  if (products.length === 0) {
    throw new InventoryError('No products found');
  }

  // Validate stock availability BEFORE making any changes (atomic validation)
  validateStockAvailability(products, validOrderItems);

  // Create a map of product updates for efficient processing
  const productUpdates = new Map<number, { quantity: number }>();

  // Aggregate quantities per product (in case same product appears multiple times)
  for (const orderItem of validOrderItems) {
    if (!orderItem.product_id) continue;

    const existing = productUpdates.get(orderItem.product_id) || { quantity: 0 };
    productUpdates.set(orderItem.product_id, {
      quantity: existing.quantity + orderItem.quantity,
    });
  }

  // Apply updates to products
  const updatedProducts = products.map((product) => {
    const update = productUpdates.get(product.id);

    if (!update) {
      // Product not in order, return unchanged
      return product;
    }

    // Calculate new values
    const newStockQuantity = product.stock_quantity - update.quantity;
    const newQuantitySold = product.quantity_sold + update.quantity;

    // Final validation: ensure stock is never negative
    if (newStockQuantity < 0) {
      throw new InventoryError(
        `Stock quantity would become negative for product "${product.name}"`,
        product.id,
        product.name
      );
    }

    // Build updated product
    const updatedProduct: Product = {
      ...product,
      stock_quantity: newStockQuantity,
      quantity_sold: newQuantitySold,
      updated_at: new Date().toISOString(),
    };

    return updatedProduct;
  });

  return updatedProducts;
}

/**
 * Updates product inventory after a successful order (CLIENT-SIDE version using localStorage)
 * 
 * Business Rules:
 * - Increases quantitySold by orderItem.quantity
 * - Decreases stockQuantity by orderItem.quantity
 * - Validates stock availability before making changes
 * - Marks products as out of stock if stockQuantity === 0 after update
 * - Implements atomic behavior: if ANY product fails validation, rollback all changes
 * 
 * @param orderItems - Array of order items containing product_id and quantity
 * @throws InventoryError if validation fails or update cannot be completed
 */
export function updateInventoryAfterOrder(orderItems: OrderItem[]): void {
  try {
    // Read current products from localStorage
    const products = getProductsFromStorage();

    if (products.length === 0) {
      throw new InventoryError('No products found in storage. Please initialize products first.');
    }

    // Create a backup for rollback capability
    const productsBackup = JSON.parse(JSON.stringify(products)) as Product[];

    // Use core update logic
    const updatedProducts = updateInventoryCore(products, orderItems);

    // Save updated products to localStorage (atomic operation)
    // If this fails, the backup ensures we can rollback
    try {
      saveProductsToStorage(updatedProducts);
    } catch (saveError) {
      // Rollback: restore backup
      saveProductsToStorage(productsBackup);
      throw new InventoryError(
        `Failed to save updated products: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
      );
    }

    // Log successful update (optional, for debugging)
    console.log(
      `Inventory updated successfully for ${orderItems.length} order item(s)`
    );
  } catch (error) {
    // Re-throw InventoryError as-is
    if (error instanceof InventoryError) {
      throw error;
    }

    // Wrap other errors
    throw new InventoryError(
      `Unexpected error during inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates product inventory after a successful order (SERVER-SIDE version using db.products)
 * This version works with the in-memory database used by the API
 * 
 * @param productsArray - Reference to the products array (e.g., db.products)
 * @param orderItems - Array of order items containing product_id and quantity
 * @throws InventoryError if validation fails
 */
export function updateInventoryAfterOrderServer(
  productsArray: ProductsArray,
  orderItems: OrderItem[]
): void {
  try {
    // Use core update logic - this modifies the array in place
    const updatedProducts = updateInventoryCore([...productsArray], orderItems);
    
    // Update the original array with the new values
    // Find and update each product in the original array
    for (const updatedProduct of updatedProducts) {
      const index = productsArray.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        productsArray[index] = updatedProduct;
      }
    }

    // Also sync to localStorage if available (for client-side consistency)
    if (typeof window !== 'undefined') {
      try {
        saveProductsToStorage(updatedProducts);
      } catch (localStorageError) {
        // Log but don't fail - localStorage sync is optional
        console.warn('Failed to sync to localStorage:', localStorageError);
      }
    }

    // Log successful update
    console.log(
      `Server inventory updated successfully for ${orderItems.length} order item(s)`
    );
  } catch (error) {
    // Re-throw InventoryError as-is
    if (error instanceof InventoryError) {
      throw error;
    }

    // Wrap other errors
    throw new InventoryError(
      `Unexpected error during server inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Initializes localStorage with products from the provided array
 * This should be called on the client side to sync products from the server
 * 
 * @param products - Array of products to initialize localStorage with
 */
export function initializeProductsStorage(products: Product[]): void {
  try {
    if (typeof window === 'undefined') {
      return; // Skip on server
    }

    // Only initialize if localStorage is empty
    const existing = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!existing) {
      saveProductsToStorage(products);
      console.log(`Initialized localStorage with ${products.length} products`);
    }
  } catch (error) {
    console.error('Failed to initialize products storage:', error);
  }
}

/**
 * Helper function to check if a product is out of stock
 * @param product - Product to check
 * @returns true if product is out of stock, false otherwise
 */
export function isProductOutOfStock(product: Product): boolean {
  return product.stock_quantity === 0;
}

/**
 * Helper function to get stock status text for a product
 * @param product - Product to check
 * @returns "Out of Stock" if stock is 0, otherwise "In Stock"
 */
export function getStockStatusText(product: Product): 'In Stock' | 'Out of Stock' {
  return product.stock_quantity === 0 ? 'Out of Stock' : 'In Stock';
}

/**
 * Helper function to check if Add to Cart should be disabled
 * @param product - Product to check
 * @returns true if Add to Cart should be disabled (out of stock), false otherwise
 */
export function shouldDisableAddToCart(product: Product): boolean {
  return product.stock_quantity === 0;
}

