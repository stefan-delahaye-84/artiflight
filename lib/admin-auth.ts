import { cookies } from "next/headers";

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return !!token && token === process.env.ADMIN_SECRET;
}
