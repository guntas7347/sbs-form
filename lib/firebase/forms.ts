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
  Timestamp,
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

export async function fetchDashboardForms(uid: string): Promise<{
  forms: (Form & { id: string; ownerEmail?: string })[];
  isAdmin: boolean;
}> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    const isUserAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
    const getMillis = (t: unknown) => {
      if (t instanceof Timestamp) return t.toMillis();
      return 0;
    };

    let fetchedForms;
    if (isUserAdmin) {
      fetchedForms = await getAllForms();
    } else {
      fetchedForms = await getUserForms(uid);
    }

    fetchedForms = fetchedForms.filter((f) => !f.deletedAt);
    fetchedForms.sort((a, b) => {
      const timeA = getMillis(a.updatedAt);
      const timeB = getMillis(b.updatedAt);
      return timeB - timeA;
    });

    if (isUserAdmin) {
      const uniqueOwnerIds = [
        ...new Set(fetchedForms.map((f) => f.ownerId).filter(Boolean)),
      ];
      const emailsMap: Record<string, string> = {};

      await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          try {
            const ownerDoc = await getDoc(doc(db, "users", ownerId));
            if (ownerDoc.exists()) {
              emailsMap[ownerId] = ownerDoc.data().email || "Unknown";
            }
          } catch (err) {
            emailsMap[ownerId] = "Unknown";
          }
        }),
      );

      fetchedForms = fetchedForms.map((f) => ({
        ...f,
        ownerEmail: f.ownerId ? emailsMap[f.ownerId] || "Unknown" : "Unknown",
      }));
    }

    return { forms: fetchedForms, isAdmin: isUserAdmin };
  } catch (error) {
    console.error("Error fetching dashboard forms:", error);
    throw error;
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
