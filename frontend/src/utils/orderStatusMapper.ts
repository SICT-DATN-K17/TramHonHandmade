/**
 * Maps frontend order statuses to backend order statuses and vice versa
 */

export type FrontendOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type BackendOrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Maps frontend status to backend status
 */
export function mapFrontendToBackendStatus(frontendStatus: FrontendOrderStatus): BackendOrderStatus {
  const mapping: Record<FrontendOrderStatus, BackendOrderStatus> = {
    pending: 'PENDING',
    // Temporarily map 'confirmed' to 'PENDING' until database ENUM is updated to include 'CONFIRMED'
    // After running migration 3_add_confirmed_status.sql, change this back to 'CONFIRMED'
    confirmed: 'PENDING', // TODO: Change to 'CONFIRMED' after running database migration
    processing: 'IN_PROGRESS',
    shipped: 'IN_PROGRESS', // Backend uses IN_PROGRESS for shipped orders
    delivered: 'COMPLETED',
    cancelled: 'CANCELLED',
  };
  return mapping[frontendStatus];
}

/**
 * Maps backend status to frontend status
 */
export function mapBackendToFrontendStatus(backendStatus: string): FrontendOrderStatus {
  const normalizedStatus = backendStatus.toUpperCase();
  const mapping: Record<string, FrontendOrderStatus> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'processing', // Backend IN_PROGRESS maps to processing (could be processing or shipped)
    COMPLETED: 'delivered',
    CANCELLED: 'cancelled',
  };
  return mapping[normalizedStatus] || 'pending';
}

