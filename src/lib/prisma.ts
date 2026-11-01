
import "server-only";

import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaSignature?: string;
};

// Next.js keeps globalThis across hot reloads. A client created before a schema
// change must not survive regeneration of @prisma/client with the new model.
const schemaSignature = `${Prisma.prismaVersion.client}:${JSON.stringify(Prisma.dmmf.datamodel)}`;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL est manquant.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prismaSchemaSignature === schemaSignature
    ? globalForPrisma.prisma ?? createPrismaClient()
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaSignature = schemaSignature;
}
