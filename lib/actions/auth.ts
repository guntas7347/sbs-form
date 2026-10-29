"use server";

import { eq } from "drizzle-orm";
import { db } from "../drizzle/drizzle";
import { users } from "../drizzle/schema";
import {
  removeAuthCookie,
  getCurrentUserId,
} from "../auth/jose";

/**
 * Retrieves the currently authenticated user from session cookie.
 * If the user account is suspended/banned, their session cookie is cleared immediately.
 */
export async function getCurrentUser() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = matchedUsers[0] || null;
    if (user?.isBanned) {
      await removeAuthCookie();
      return null;
    }

    return user;
  } catch (error: any) {
    if (error?.digest) {
      throw error;
    }
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Logs the user out by deleting the auth token cookie.
 */
export async function logout() {
  await removeAuthCookie();
  return { success: true };
}
