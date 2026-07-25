import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const otpCodes = sqliteTable('otp_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: integer('consumed_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const pomodoroCycles = sqliteTable('pomodoro_cycles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  phase: text('phase').notNull(),
  focusDuration: integer('focus_duration').notNull(),
  shortBreakDuration: integer('short_break_duration').notNull(),
  longBreakDuration: integer('long_break_duration').notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const timerStates = sqliteTable('timer_states', {
  userId: text('user_id').primaryKey().references(() => users.id),
  state: text('state').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
