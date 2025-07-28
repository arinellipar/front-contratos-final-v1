// src/lib/api/users.ts
import { apiClient } from "./client";
import { User } from "@/lib/types/user";
import { PaginatedResponse } from "@/lib/types/contract";

/**
 * User management API service (admin functions)
 */
export const usersApi = {
  /**
   * Get all users with pagination and filtering
   */
  async getAll(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters?: Record<string, any>
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get<PaginatedResponse<User>>(
      `/users?${params.toString()}`
    );
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  /**
   * Update user (admin)
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  /**
   * Delete user (admin)
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },

  /**
   * Lock/unlock user account
   */
  async toggleLock(id: string, locked: boolean): Promise<User> {
    return apiClient.post<User>(`/users/${id}/lock`, { locked });
  },

  /**
   * Assign roles to user
   */
  async assignRoles(id: string, roles: string[]): Promise<User> {
    return apiClient.post<User>(`/users/${id}/roles`, { roles });
  },
};
