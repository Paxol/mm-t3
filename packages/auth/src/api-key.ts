import type { NextApiRequest } from "next";
import { prisma } from "@paxol/db";

export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function authenticateToken(req: NextApiRequest): Promise<User | null> {
  const rawToken = req.headers.authorization ?? req.query["token"];
  let token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  token = token?.replace("Bearer ", "");

  if (!token) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { token },
    select: { expires: true, user: true },
  });

  if (!apiKey || apiKey.expires.getTime() < Date.now()) return null;

  return {
    id: apiKey.user.id,
    name: apiKey.user.name,
    email: apiKey.user.email,
    image: apiKey.user.image,
  };
}
