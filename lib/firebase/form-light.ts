import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { type Form } from "./form-builder";

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
