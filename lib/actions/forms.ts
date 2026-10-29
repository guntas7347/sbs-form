"use server";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "../drizzle/drizzle";
import {
  forms,
  formSubmissions,
  users,
  type Form,
  type PostSubmissionSettings,
} from "../drizzle/schema";
import { getCurrentUser } from "./auth";
import { nanoid } from "nanoid";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

export interface FormCreatorInfo {
  id: string;
  name: string;
  email: string;
  username: string | null;
  degree: string | null;
  specialization: string | null;
  mobile: string | null;
  role: string | null;
  photo: string | null;
}

export interface FormResponse {
  success: boolean;
  error?: string;
  form?: Form;
  creator?: FormCreatorInfo | null;
  isOwner?: boolean;
  isPublished?: boolean;
  requiresAuth?: boolean;
  isDraft?: boolean;
  isExpired?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export async function createForm(initialData?: {
  id?: string;
  title?: string;
  description?: string;
  deadline?: Date;
  postSubmission?: PostSubmissionSettings;
}): Promise<FormResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please log in to use the form builder." };
  }

  try {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const [newForm] = await db
      .insert(forms)
      .values({
        id: nanoid(),
        title: initialData?.title || "Untitled Form",
        description: initialData?.description || "",
        createdBy: user.id,
        fields: [],
        status: "draft",
        isPublic: false,
        deadline: initialData?.deadline || oneYearFromNow,
        postSubmission: initialData?.postSubmission || {
          message: "Thank you! Your response has been recorded.",
          links: [],
          imageUrl: "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      form: newForm,
      creator: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || null,
        degree: user.degree || null,
        specialization: user.specialization || null,
        mobile: user.mobile || null,
        role: user.role || null,
        photo: user.photo || null,
      },
      isOwner: true,
      isPublished: false,
      currentUser: user,
    };
  } catch (error: any) {
    console.error("Error creating form:", error);
    return {
      success: false,
      error: error?.message || "Failed to create form.",
    };
  }
}

export async function getForm(id: string): Promise<FormResponse> {
  if (!id || !isValidId(id)) {
    return { success: false, error: "Invalid form ID format." };
  }

  try {
    const user = await getCurrentUser();

    const [result] = await db
      .select({
        form: forms,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          degree: users.degree,
          specialization: users.specialization,
          mobile: users.mobile,
          role: users.role,
          photo: users.photo,
        },
      })
      .from(forms)
      .leftJoin(users, eq(forms.createdBy, users.id))
      .where(eq(forms.id, id))
      .limit(1);

    if (!result || !result.form) {
      return { success: false, error: "Form not found." };
    }

    const { form, creator } = result;
    const isOwner = user ? form.createdBy === user.id : false;
    const isAdmin = user ? user.role === "admin" : false;
    const isPublished = form.status === "published";
    const isPastDeadline = form.deadline
      ? new Date() > new Date(form.deadline)
      : false;

    // 1. Live status check:
    // If form is not published, only the owner or an admin can preview it.
    if (!isPublished && !isOwner && !isAdmin) {
      return {
        success: false,
        error:
          "This form is currently a draft and is not accepting responses yet.",
        isDraft: true,
        isPublished: false,
        form,
        creator,
        currentUser: user,
      };
    }

    // 2. Deadline check:
    // After deadline, respondents can no longer submit.
    if (isPastDeadline && !isOwner) {
      return {
        success: false,
        error:
          "The deadline for this form has passed. Submissions are no longer accepted.",
        isExpired: true,
        isPublished: true,
        form,
        creator,
        currentUser: user,
      };
    }

    // 3. Login requirement check (isPublic flag):
    // If form is published, but isPublic is false, respondents must be logged in.
    if (!form.isPublic && !user && !isOwner) {
      return {
        success: false,
        error:
          "Sign in required: The creator has specified that only logged-in users may submit this form.",
        requiresAuth: true,
        isPublished: true,
        form: {
          ...form,
          fields: [], // Mask fields until logged in
        },
        creator,
        currentUser: null,
      };
    }

    return {
      success: true,
      form,
      creator,
      isOwner,
      isPublished,
      isExpired: isPastDeadline,
      currentUser: user,
    };
  } catch (error: any) {
    console.error("Error fetching form:", error);
    return { success: false, error: error?.message || "Failed to fetch form." };
  }
}

export async function updateForm(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    fields: any;
    status: string;
    isPublic: boolean;
    deadline: Date | string;
    postSubmission: PostSubmissionSettings;
  }>,
): Promise<FormResponse> {
  if (!id || !isValidId(id)) {
    return { success: false, error: "Invalid form ID." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please log in to edit forms." };
  }

  try {
    const [existing] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Form not found." };
    }

    if (existing.createdBy !== user.id) {
      return {
        success: false,
        error: "You do not have permission to edit this form.",
      };
    }

    const deadlineValue =
      updates.deadline !== undefined
        ? typeof updates.deadline === "string"
          ? new Date(updates.deadline)
          : updates.deadline
        : undefined;

    const [updatedForm] = await db
      .update(forms)
      .set({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.fields !== undefined ? { fields: updates.fields } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.isPublic !== undefined
          ? { isPublic: updates.isPublic }
          : {}),
        ...(deadlineValue !== undefined ? { deadline: deadlineValue } : {}),
        ...(updates.postSubmission !== undefined
          ? { postSubmission: updates.postSubmission }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(forms.id, id))
      .returning();

    return {
      success: true,
      form: updatedForm,
      isOwner: true,
      currentUser: user,
    };
  } catch (error: any) {
    console.error("Error updating form:", error);
    return {
      success: false,
      error: error?.message || "Failed to update form.",
    };
  }
}

export async function deleteForm(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!id || !isValidId(id)) {
    return { success: false, error: "Invalid form ID." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const [existing] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        error: "Form not found.",
      };
    }

    const isOwner = existing.createdBy === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "You do not have permission to delete this form.",
      };
    }

    await db.delete(forms).where(eq(forms.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting form:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete form.",
    };
  }
}

export interface UserFormItem extends Form {
  submissionCount: number;
}

export async function getFormsForUser(
  page: number = 1,
  pageSize: number = 100,
): Promise<{
  success: boolean;
  forms: UserFormItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      forms: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
    };
  }

  try {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const [totalCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(forms)
      .where(eq(forms.createdBy, user.id));

    const totalCount = totalCountResult?.count || 0;
    const totalPages = Math.ceil(totalCount / validPageSize) || 1;

    // Sort by last modified (updatedAt descending)
    const userForms = await db
      .select()
      .from(forms)
      .where(eq(forms.createdBy, user.id))
      .orderBy(desc(forms.updatedAt))
      .limit(validPageSize)
      .offset(offset);

    // Get submission count for each form
    const formsWithCounts: UserFormItem[] = await Promise.all(
      userForms.map(async (f) => {
        const countRes = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(formSubmissions)
          .where(eq(formSubmissions.formId, f.id));

        return {
          ...f,
          submissionCount: countRes[0]?.count || 0,
        };
      }),
    );

    return {
      success: true,
      forms: formsWithCounts,
      totalCount,
      page: validPage,
      totalPages,
    };
  } catch (error: any) {
    console.error("Error fetching user forms:", error);
    return {
      success: false,
      forms: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
      error: error?.message || "Failed to load forms.",
    };
  }
}

export async function submitForm(
  formId: string,
  answers: Record<string, any>,
): Promise<{
  success: boolean;
  error?: string;
  submissionId?: string;
  postSubmission?: PostSubmissionSettings;
}> {
  if (!formId || !isValidId(formId)) {
    return { success: false, error: "Invalid form ID." };
  }

  try {
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (!form) {
      return {
        success: false,
        error: "Form does not exist or has been removed.",
      };
    }

    const user = await getCurrentUser();
    const isOwner = user ? form.createdBy === user.id : false;
    const isPublished = form.status === "published";
    const isPastDeadline = form.deadline
      ? new Date() > new Date(form.deadline)
      : false;

    // 1. Live status: Must be published (unless owner is testing)
    if (!isPublished && !isOwner) {
      return {
        success: false,
        error:
          "This form is currently in draft mode and is not live for responses.",
      };
    }

    // 2. Deadline check: After deadline, do not accept submissions
    if (isPastDeadline && !isOwner) {
      return {
        success: false,
        error:
          "The submission deadline for this form has passed. Submissions are no longer accepted.",
      };
    }

    // 3. Login requirement: If not public, respondent must be logged in
    if (!form.isPublic && !user) {
      return {
        success: false,
        error: "Login required: You must be logged in to submit this form.",
      };
    }

    // Insert response: submittedBy is user.id if logged in, or null if submitted anonymously
    const [newSubmission] = await db
      .insert(formSubmissions)
      .values({
        formId: form.id,
        submittedBy: user ? user.id : null,
        answers: answers,
      })
      .returning();

    return {
      success: true,
      submissionId: newSubmission.id,
      postSubmission: form.postSubmission as PostSubmissionSettings,
    };
  } catch (error: any) {
    console.error("Error submitting form:", error);
    return {
      success: false,
      error: error?.message || "Failed to submit form response.",
    };
  }
}

export interface SubmissionWithUser {
  id: string;
  formId: string;
  submittedBy: string | null;
  answers: Record<string, any>;
  submittedAt: Date;
  submitter: {
    id: string;
    name: string;
    email: string;
    degree: string | null;
    specialization: string | null;
  } | null;
}

export async function getFormSubmissions(
  formId: string,
  page: number = 1,
  pageSize: number = 100,
): Promise<{
  success: boolean;
  error?: string;
  form?: Form;
  submissions?: SubmissionWithUser[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
}> {
  if (!formId || !isValidId(formId)) {
    return { success: false, error: "Invalid form ID." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please log in to view submissions." };
  }

  try {
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (!form) {
      return { success: false, error: "Form not found." };
    }

    const isOwner = form.createdBy === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "You do not have permission to view submissions for this form.",
      };
    }

    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const [totalCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId));

    const totalCount = totalCountResult?.count || 0;
    const totalPages = Math.ceil(totalCount / validPageSize) || 1;

    const rawSubmissions = await db
      .select({
        id: formSubmissions.id,
        formId: formSubmissions.formId,
        submittedBy: formSubmissions.submittedBy,
        answers: formSubmissions.answers,
        submittedAt: formSubmissions.submittedAt,
        submitterId: users.id,
        submitterName: users.name,
        submitterEmail: users.email,
        submitterDegree: users.degree,
        submitterSpec: users.specialization,
      })
      .from(formSubmissions)
      .leftJoin(users, eq(formSubmissions.submittedBy, users.id))
      .where(eq(formSubmissions.formId, formId))
      .orderBy(desc(formSubmissions.submittedAt))
      .limit(validPageSize)
      .offset(offset);

    const submissions: SubmissionWithUser[] = rawSubmissions.map((s) => ({
      id: s.id,
      formId: s.formId,
      submittedBy: s.submittedBy,
      answers: (s.answers || {}) as Record<string, any>,
      submittedAt: s.submittedAt,
      submitter: s.submitterId
        ? {
            id: s.submitterId,
            name: s.submitterName || "User",
            email: s.submitterEmail || "",
            degree: s.submitterDegree || null,
            specialization: s.submitterSpec || null,
          }
        : null,
    }));

    return {
      success: true,
      form,
      submissions,
      totalCount,
      page: validPage,
      totalPages,
    };
  } catch (error: any) {
    console.error("Error fetching form submissions:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch form submissions.",
    };
  }
}

export async function getAllSubmissionsForExport(formId: string): Promise<{
  success: boolean;
  error?: string;
  form?: Form;
  submissions?: SubmissionWithUser[];
}> {
  if (!formId || !isValidId(formId)) {
    return { success: false, error: "Invalid form ID." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please log in to export submissions." };
  }

  try {
    const [form] = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (!form) {
      return { success: false, error: "Form not found." };
    }

    const isOwner = form.createdBy === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized." };
    }

    const rawSubmissions = await db
      .select({
        id: formSubmissions.id,
        formId: formSubmissions.formId,
        submittedBy: formSubmissions.submittedBy,
        answers: formSubmissions.answers,
        submittedAt: formSubmissions.submittedAt,
        submitterId: users.id,
        submitterName: users.name,
        submitterEmail: users.email,
        submitterDegree: users.degree,
        submitterSpec: users.specialization,
      })
      .from(formSubmissions)
      .leftJoin(users, eq(formSubmissions.submittedBy, users.id))
      .where(eq(formSubmissions.formId, formId))
      .orderBy(desc(formSubmissions.submittedAt));

    const submissions: SubmissionWithUser[] = rawSubmissions.map((s) => ({
      id: s.id,
      formId: s.formId,
      submittedBy: s.submittedBy,
      answers: (s.answers || {}) as Record<string, any>,
      submittedAt: s.submittedAt,
      submitter: s.submitterId
        ? {
            id: s.submitterId,
            name: s.submitterName || "User",
            email: s.submitterEmail || "",
            degree: s.submitterDegree || null,
            specialization: s.submitterSpec || null,
          }
        : null,
    }));

    return { success: true, form, submissions };
  } catch (error: any) {
    console.error("Error exporting submissions:", error);
    return {
      success: false,
      error: error?.message || "Failed to export submissions.",
    };
  }
}
