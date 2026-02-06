import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function AuthUserSession() {
  return getServerSession(authOptions);
}
