import { defineConfig } from "prisma/config";

const DATABASE_URL = "postgresql://neondb_owner:npg_d5gV4Anchvry@ep-bold-base-atlme0zr.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
