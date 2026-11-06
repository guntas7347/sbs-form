import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getForm } from "@/lib/actions/forms";
import FormClient from "./FormClient";

// Cache so metadata and page reuse the same result
const getCachedForm = cache(async (id: string) => getForm(id));

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const form = await getCachedForm(id);

  if (form.success === false) {
    return {
      title: "Form Not Found",
      description: "This form does not exist or is no longer available.",
    };
  }

  const formData = form.form;

  const title = formData?.title || "Untitled Form";
  const description =
    formData?.description || "A form created using SBS Forms.";

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      type: "website",
      siteName: "SBS Forms",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/f/${id}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const form = await getCachedForm(id);

  if (form.success === false) notFound();

  return <FormClient />;
}
