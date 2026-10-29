import "server-only";

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fatherName: varchar("father_name", { length: 255 }),
  degree: varchar("degree", { length: 255 }),
  specialization: varchar("specialization", { length: 255 }),
  mobile: varchar("mobile", { length: 50 }),
  role: varchar("role", { length: 50 }).notNull().default("student"),
  isBanned: boolean("is_banned").notNull().default(false),
  photo: text("photo"),
});

export const forms = pgTable("forms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: varchar("title", { length: 255 }).notNull().default("Untitled Form"),
  description: text("description"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fields: jsonb("fields").notNull().default([]),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  isPublic: boolean("is_public").notNull().default(false),
  deadline: timestamp("deadline", { withTimezone: true })
    .notNull()
    .default(sql`now() + interval '1 year'`),
  postSubmission: jsonb("post_submission")
    .notNull()
    .default(
      sql`'{"message": "Thank you! Your response has been recorded.", "links": [], "imageUrl": ""}'::jsonb`,
    ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: text("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),

  submittedBy: uuid("submitted_by").references(() => users.id, {
    onDelete: "set null",
  }), // Nullable for anonymous submissions
  answers: jsonb("answers").notNull().default({}),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;

export interface PostSubmissionLink {
  name: string;
  url: string;
}

export interface PostSubmissionSettings {
  message?: string;
  links?: PostSubmissionLink[];
  imageUrl?: string;
}
