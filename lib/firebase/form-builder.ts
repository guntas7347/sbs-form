import {
  doc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from "firebase/firestore";
import { db } from "./firebase";

export type FieldType =
  | "text"
  | "paragraph"
  | "mcq"
  | "checkbox"
  | "dropdown"
  | "number"
  | "text box"
  | "image"
  | "html";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
  content?: string;
}

export interface Form {
  title: string;
  description: string;
  ownerId?: string;
  ownerEmail?: string;
  isPublic: boolean;
  fields: FormField[];
  submitMessage?: string;
  allowMultipleResponses?: boolean;
  deadline: Timestamp; // not string
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  deletedAt: Timestamp | null;
}
const deadlineDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

export const createNewFormDoc = async (
  ownerId?: string,
  ownerEmail?: string,
) => {
  const formRef = doc(collection(db, "forms"));
  const newForm: Form = {
    title: "Untitled Form",
    description: "",
    ownerId: ownerId || "",
    ownerEmail: ownerEmail || "",
    isPublic: false,
    fields: [],
    deadline: Timestamp.fromDate(deadlineDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };
  await setDoc(formRef, newForm);
  return formRef.id;
};

export const createFormWithId = async (
  formId: string,
  userId?: string,
  userEmail?: string,
): Promise<Form> => {
  const docRef = doc(db, "forms", formId);

  const newForm: Form = {
    title: "Untitled Form",
    description: "",
    isPublic: false,
    ownerId: userId || "",
    ownerEmail: userEmail || "",
    fields: [],
    deadline: Timestamp.fromDate(deadlineDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };
  await setDoc(docRef, newForm);
  return newForm;
};

export const updateFormById = async (formId: string, data: Partial<Form>) => {
  const docRef = doc(db, "forms", formId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};
