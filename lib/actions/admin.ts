"use server";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "../drizzle/drizzle";
import { users, forms, formSubmissions, type Form } from "../drizzle/schema";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export interface AdminUserItem {
  id: string;
  username: string | null;
  name: string;
  email: string;
  fatherName: string | null;
  degree: string | null;
  specialization: string | null;
  mobile: string | null;
  role: string;
  isBanned: boolean;
  photo: string | null;
  formsCount: number;
  submissionsCount: number;
}

export interface AdminFormItem extends Form {
  creator: {
    id: string;
    username: string | null;
    name: string;
    email: string;
    degree: string | null;
    specialization: string | null;
    role: string;
    photo: string | null;
  } | null;
  submissionCount: number;
}

/**
 * Ensures the currently logged in user is an active administrator.
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }
  if (user.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required.");
  }
  if (user.isBanned) {
    throw new Error("Forbidden: This administrator account has been suspended.");
  }
  return user;
}

/**
 * Fetch all registered users for admin dashboard with counts of their forms and submissions.
 */
export async function getAllUsers(): Promise<{
  success: boolean;
  users?: AdminUserItem[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const allUsers = await db.select().from(users).orderBy(users.name);

    // Compute form and submission counts for each user
    const usersWithCounts: AdminUserItem[] = await Promise.all(
      allUsers.map(async (u) => {
        const [formsCountRes] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(forms)
          .where(eq(forms.createdBy, u.id));

        const [subsCountRes] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(formSubmissions)
          .where(eq(formSubmissions.submittedBy, u.id));

        return {
          id: u.id,
          username: u.username || null,
          name: u.name,
          email: u.email,
          fatherName: u.fatherName || null,
          degree: u.degree || null,
          specialization: u.specialization || null,
          mobile: u.mobile || null,
          role: u.role || "student",
          isBanned: Boolean(u.isBanned),
          photo: u.photo,
          formsCount: formsCountRes?.count || 0,
          submissionsCount: subsCountRes?.count || 0,
        };
      })
    );

    return { success: true, users: usersWithCounts };
  } catch (error: any) {
    console.error("Error in getAllUsers:", error);
    return { success: false, error: error?.message || "Failed to load users" };
  }
}

/**
 * Ban or unban a user. Admins cannot ban their own account.
 */
export async function toggleBanUser(
  targetUserId: string,
  isBanned: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();

    if (admin.id === targetUserId) {
      return { success: false, error: "You cannot ban your own administrator account." };
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    await db
      .update(users)
      .set({ isBanned })
      .where(eq(users.id, targetUserId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in toggleBanUser:", error);
    return { success: false, error: error?.message || "Failed to update user ban status." };
  }
}

/**
 * Fetch all forms across all users for admin review.
 */
export async function getAllFormsForAdmin(
  page: number = 1,
  pageSize: number = 100
): Promise<{
  success: boolean;
  forms?: AdminFormItem[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}> {
  try {
    await requireAdmin();

    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const [totalCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(forms);

    const totalCount = totalCountResult?.count || 0;
    const totalPages = Math.ceil(totalCount / validPageSize) || 1;

    const rawForms = await db
      .select({
        form: forms,
        creatorId: users.id,
        creatorUsername: users.username,
        creatorName: users.name,
        creatorEmail: users.email,
        creatorDegree: users.degree,
        creatorSpec: users.specialization,
        creatorRole: users.role,
        creatorPhoto: users.photo,
      })
      .from(forms)
      .leftJoin(users, eq(forms.createdBy, users.id))
      .orderBy(desc(forms.updatedAt))
      .limit(validPageSize)
      .offset(offset);

    const formsWithCounts: AdminFormItem[] = await Promise.all(
      rawForms.map(async (row) => {
        const [countRes] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(formSubmissions)
          .where(eq(formSubmissions.formId, row.form.id));

        return {
          ...row.form,
          creator: row.creatorId
            ? {
                id: row.creatorId,
                username: row.creatorUsername || null,
                name: row.creatorName || "Unknown",
                email: row.creatorEmail || "",
                degree: row.creatorDegree || null,
                specialization: row.creatorSpec || null,
                role: row.creatorRole || "student",
                photo: row.creatorPhoto || null,
              }
            : null,
          submissionCount: countRes?.count || 0,
        };
      })
    );

    return {
      success: true,
      forms: formsWithCounts,
      totalCount,
      page: validPage,
      totalPages,
    };
  } catch (error: any) {
    console.error("Error in getAllFormsForAdmin:", error);
    return { success: false, error: error?.message || "Failed to load forms." };
  }
}
