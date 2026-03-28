import {
  pgTable,
  text,
  timestamp,
  serial,
  index,
  uniqueIndex,
  integer,
  boolean,
} from 'drizzle-orm/pg-core'
import { workspace } from './workspace'

export const telegramChannels = pgTable(
  'telegram_channels',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    chatId: text('chat_id').notNull(),
    title: text('title').notNull(),
    username: text('username'),
    type: text('type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastSeenAt: timestamp('last_seen_at', { mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdIdx: index('telegram_channels_workspace_id_idx').on(table.workspaceId),
    workspaceChatUniqueIdx: uniqueIndex('telegram_channels_workspace_chat_unique_idx').on(
      table.workspaceId,
      table.chatId,
    ),
  }),
)
