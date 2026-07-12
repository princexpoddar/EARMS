import { defineConfig } from "prisma/config";
import "dotenv/config"; // loads .env locally; ignored on Vercel (env vars injected natively)

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
