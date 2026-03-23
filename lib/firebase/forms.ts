import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "./firebase";
import { type Form } from "./form-builder";

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getFormById = async (formId: string): Promise<Form | null> => {
  const docRef = doc(db, "forms", formId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Form;
  }
  return null;
};

export const getUserForms = async (ownerId: string) => {
  const q = query(collection(db, "forms"), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  const forms: (Form & { id: string })[] = [];
  querySnapshot.forEach((doc) => {
    forms.push({ id: doc.id, ...doc.data() } as Form & { id: string });
  });
  return forms;
};

export const getAllForms = async () => {
  const q = collection(db, "forms");
  const querySnapshot = await getDocs(q);
  const forms: (Form & { id: string })[] = [];
  querySnapshot.forEach((docSnap) => {
    forms.push({ id: docSnap.id, ...docSnap.data() } as Form & { id: string });
  });
  return forms;
};

export const softDeleteFormById = async (formId: string) => {
  const docRef = doc(db, "forms", formId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
  });
};

export const deleteFormById = async (formId: string) => {
  const docRef = doc(db, "forms", formId);
  await deleteDoc(docRef);
};

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() && userDoc.data().isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function deleteDashboardForm(
  formId: string,
  isAdmin: boolean,
): Promise<void> {
  try {
    if (isAdmin) {
      await softDeleteFormById(formId);
    } else {
      await deleteFormById(formId);
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    throw error;
  }
}

export async function fetchUserFormsPaginated(
  uid: string,
  pageSize: number,
  lastDocSnap: any = null,
): Promise<{ forms: any[]; lastVisible: any; totalCount: number }> {
  try {
    const baseQ = query(
      collection(db, "forms"),
      where("ownerId", "==", uid),
      where("deletedAt", "==", null),
    );

    const countSnap = await getCountFromServer(baseQ);
    const totalCount = countSnap.data().count;

    let formQ = query(baseQ, orderBy("updatedAt", "desc"), limit(pageSize));
    if (lastDocSnap) {
      formQ = query(
        baseQ,
        orderBy("updatedAt", "desc"),
        startAfter(lastDocSnap),
        limit(pageSize),
      );
    }

    const querySnapshot = await getDocs(formQ);
    const forms: any[] = [];
    querySnapshot.forEach((docSnap) => {
      forms.push({ id: docSnap.id, ...docSnap.data() });
    });

    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    return { forms, lastVisible, totalCount };
  } catch (error) {
    console.error("Error fetching user forms:", error);
    throw error;
  }
}

export async function fetchAdminFormsPaginated(
  pageSize: number,
  lastDocSnap: any = null,
): Promise<{ forms: any[]; lastVisible: any; totalCount: number }> {
  try {
    const baseQ = query(
      collection(db, "forms"),
      where("deletedAt", "==", null),
    );

    const countSnap = await getCountFromServer(baseQ);
    const totalCount = countSnap.data().count;

    let formQ = query(baseQ, orderBy("updatedAt", "desc"), limit(pageSize));
    if (lastDocSnap) {
      formQ = query(
        baseQ,
        orderBy("updatedAt", "desc"),
        startAfter(lastDocSnap),
        limit(pageSize),
      );
    }

    const querySnapshot = await getDocs(formQ);
    const forms: any[] = [];
    querySnapshot.forEach((docSnap) => {
      forms.push({ id: docSnap.id, ...docSnap.data() });
    });

    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    return {
      forms: forms.map((f: any) => ({
        ...f,
        ownerEmail: f.ownerEmail || "Unknown",
      })),
      lastVisible,
      totalCount,
    };
  } catch (error) {
    console.error("Error fetching admin forms:", error);
    throw error;
  }
}

export async function fetchAdminUsersPaginated(
  searchEmailPrefix: string,
  pageSize: number,
  lastDocSnap: any = null,
): Promise<{ users: any[]; lastVisible: any; totalCount: number }> {
  try {
    let baseQ = collection(db, "users") as any;

    if (searchEmailPrefix) {
      baseQ = query(
        baseQ,
        where("email", ">=", searchEmailPrefix),
        where("email", "<=", searchEmailPrefix + "\uf8ff"),
      );
    }

    const countSnap = await getCountFromServer(baseQ);
    const totalCount = countSnap.data().count;

    let userQ = query(baseQ, orderBy("email", "asc"), limit(pageSize));
    if (lastDocSnap) {
      userQ = query(
        baseQ,
        orderBy("email", "asc"),
        startAfter(lastDocSnap),
        limit(pageSize),
      );
    }

    const querySnapshot = await getDocs(userQ);
    const users: any[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    return { users, lastVisible, totalCount };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
}

export async function loadFormForSubmission(
  formId: string,
  userId?: string,
): Promise<{ form: Form | null; error: string }> {
  try {
    const docRef = doc(db, "forms", formId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { form: null, error: "Form not found" };
    }

    const formData = docSnap.data() as Form;

    if (!formData.isPublic) {
      return { form: null, error: "Form is not available" };
    }

    if (formData.deadline && new Date() > formData.deadline.toDate()) {
      return {
        form: null,
        error:
          "This form is no longer accepting responses as the deadline has passed.",
      };
    }

    if (!formData.allowMultipleResponses && userId) {
      const resRef = collection(db, "responses");
      const q = query(
        resRef,
        where("formId", "==", formId),
        where("userId", "==", userId),
      );
      const resSnap = await getDocs(q);
      if (!resSnap.empty) {
        return { form: null, error: "You have already submitted this form." };
      }
    }

    return { form: formData, error: "" };
  } catch (err) {
    console.error("Error loading form:", err);
    return { form: null, error: "Error loading form" };
  }
}

export async function submitFormResponse(
  formId: string,
  formOwnerId: string,
  userId: string,
  userEmail: string,
  answers: Record<string, string | string[]>,
): Promise<void> {
  await addDoc(collection(db, "responses"), {
    formId,
    formOwnerId,
    userId,
    userEmail,
    answers,
    submittedAt: serverTimestamp(),
  });
}

export async function loadFormResponses(
  formId: string,
  ownerId: string,
): Promise<{ form: Form | null; responses: any[]; error: string }> {
  try {
    const docRef = doc(db, "forms", formId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { form: null, responses: [], error: "Form not found" };
    }

    const formData = docSnap.data() as Form;

    // Ensure user is owner
    if (formData.ownerId !== ownerId) {
      return {
        form: null,
        responses: [],
        error: "You do not have permission to view these responses",
      };
    }

    const q = query(collection(db, "responses"), where("formId", "==", formId));
    const querySnapshot = await getDocs(q);
    const resData: any[] = [];
    querySnapshot.forEach((resSnap) => {
      resData.push({ id: resSnap.id, ...resSnap.data() });
    });

    resData.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis?.() || 0;
      const timeB = b.submittedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    // Use stored userEmail or fallback for older responses
    resData.forEach((r) => {
      if (!r.userEmail) {
        r.userEmail = "Anonymous";
      }
    });

    return { form: formData, responses: resData, error: "" };
  } catch (err) {
    console.error("Error loading responses:", err);
    return { form: null, responses: [], error: "Error loading responses" };
  }
}
