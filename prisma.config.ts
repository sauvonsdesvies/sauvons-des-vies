
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Charger les variables d'environnement du projet Next.js.
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
