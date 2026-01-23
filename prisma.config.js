// prisma.config.js
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not defined in .env file');
  process.exit(1);
}

console.log('✅ Database URL loaded successfully');

module.exports = {
  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl: directUrl,
  },
};
