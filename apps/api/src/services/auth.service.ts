import type { LoginInput, SignupInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.middleware.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const authUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

type AuthUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

function toSafeUser(user: AuthUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function signupUser(input: SignupInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new HttpError("Email is already in use.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: safeUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError("Email is already in use.", 409);
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: authUserSelect,
  });

  if (!user) {
    throw new HttpError("Invalid credentials", 401);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError("Invalid credentials", 401);
  }

  return toSafeUser(user);
}

export function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: safeUserSelect,
  });
}
