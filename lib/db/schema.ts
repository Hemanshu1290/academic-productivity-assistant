import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core"

// ---------- Better Auth tables (verbatim column names) ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ---------- App tables ----------

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  status: text("status").notNull().default("active"), // active | completed | archived
  deadlineAt: timestamp("deadlineAt"),
  deadlineConfidence: text("deadlineConfidence"), // exact | inferred | none
  estimatedMinutes: integer("estimatedMinutes"),
  sourceType: text("sourceType").notNull().default("text"), // text | voice | photo
  sourceRaw: text("sourceRaw"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
})

export const subtasks = pgTable("subtasks", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  taskId: text("taskId").notNull(),
  title: text("title").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
  estimatedMinutes: integer("estimatedMinutes").notNull().default(25),
  scheduledFor: timestamp("scheduledFor"),
  status: text("status").notNull().default("pending"), // pending | completed
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  completedAt: timestamp("completedAt"),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Subtask = typeof subtasks.$inferSelect
export type NewSubtask = typeof subtasks.$inferInsert
