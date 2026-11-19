import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const fragments = pgTable("fragments", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  body: text("body").notNull(),
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  fragmentId: text("fragment_id").notNull(),
  kind: text("kind").notNull(),
  r2Key: text("r2_key").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
});

export const asks = pgTable("asks", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  fragmentId: text("fragment_id"),
});

export const diaryDays = pgTable("diary_days", {
  day: text("day").primaryKey(),
  polishedBody: text("polished_body"),
  polishedAt: timestamp("polished_at", { withTimezone: true }),
});

export const studyItems = pgTable("study_items", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  subject: text("subject").notNull(),
  minutes: integer("minutes").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  done: boolean("done").notNull(),
  unit: integer("unit"),
});

export const studyCursors = pgTable("study_cursors", {
  subject: text("subject").primaryKey(),
  unit: integer("unit").notNull(),
});
