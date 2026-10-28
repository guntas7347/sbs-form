"use server";

import { eq } from "drizzle-orm";
import { db } from "../drizzle/drizzle";
import { users } from "../drizzle/schema";
import {
  createToken,
  storeAuthCookie,
  removeAuthCookie,
  getCurrentUserId,
} from "../auth/jose";

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export async function loginOrRegister(formData: {
  name: string;
  email: string;
}): Promise<AuthResponse> {
  const name = formData?.name?.trim() || "";
  const email = formData?.email?.trim().toLowerCase() || "";

  if (!email) {
    return { success: false, error: "Please enter your email" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  try {
    // Check if user already exists on basis of email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existingUsers[0];

    // If user does not exist, create new user
    if (!user) {
      if (!name) {
        return {
          success: false,
          error: "Please enter your name to create your account",
        };
      }

      const inserted = await db
        .insert(users)
        .values({
          name,
          email,
        })
        .returning();

      user = inserted[0];
    }

    if (!user) {
      return { success: false, error: "Unable to process account" };
    }

    // Generate JWT and store cookie via lib/auth/jose.ts
    const token = await createToken(user.id);
    await storeAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error("Auth action error:", error);
    return {
      success: false,
      error: error?.message || "Failed to authenticate. Please try again.",
    };
  }
}

// Aliases for flexible usage
export async function login(formData: { name: string; email: string }) {
  return loginOrRegister(formData);
}

export async function register(formData: { name: string; email: string }) {
  return loginOrRegister(formData);
}

export async function getCurrentUser() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return matchedUsers[0] || null;
  } catch (error: any) {
    if (error?.digest) {
      throw error;
    }
    console.error("Get current user error:", error);
    return null;
  }
}


export async function logout() {
  await removeAuthCookie();
  return { success: true };
}

