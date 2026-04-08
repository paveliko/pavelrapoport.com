import { requireAdmin } from "@repo/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <main>
      <h1>Studio</h1>
      <p>Welcome, {user.profile.display_name ?? user.email}</p>
    </main>
  );
}
