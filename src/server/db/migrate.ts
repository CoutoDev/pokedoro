import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

import { db } from './client'

migrate(db, { migrationsFolder: './src/server/db/migrations' })

console.log('Migrations applied')
