// prisma.config.ts
import { defineConfig } from "@prisma/config";
import 'dotenv/config';

// Get URLs from environment variables
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not defined in .env file');
  process.exit(1);
}

console.log('✅ Database URL loaded successfully');

export default defineConfig({
  datasource: {
    url: databaseUrl,
    // Use shadowDatabaseUrl for direct connection (not directUrl)
    shadowDatabaseUrl: directUrl,
  },
});