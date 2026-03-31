export type FrontendOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type BackendOrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export function mapFrontendToBackendStatus(frontendStatus: FrontendOrderStatus): BackendOrderStatus {
  const mapping: Record<FrontendOrderStatus, BackendOrderStatus> = {
    pending: 'PENDING',
    confirmed: 'PENDING', 
    processing: 'IN_PROGRESS',
    shipped: 'IN_PROGRESS', 
    delivered: 'COMPLETED',
    cancelled: 'CANCELLED',
  };
  return mapping[frontendStatus];
}

export function mapBackendToFrontendStatus(backendStatus: string): FrontendOrderStatus {
  const normalizedStatus = backendStatus.toUpperCase();
  const mapping: Record<string, FrontendOrderStatus> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'processing',
    COMPLETED: 'delivered',
    CANCELLED: 'cancelled',
  };
  return mapping[normalizedStatus] || 'pending';
}