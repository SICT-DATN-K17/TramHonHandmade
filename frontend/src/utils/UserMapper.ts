import { User } from '@/types';
import { RawUserResponse } from '@/types/apiTypes';

export const mapToUser = (raw: RawUserResponse): User => {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role as User['role'],
        bio: raw.bio || null,
        createdAt: raw.created_at,
    };
};