const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("../../prisma/generated/index.js"); 

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;