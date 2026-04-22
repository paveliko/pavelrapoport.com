import { getSession, getUser } from "@repo/auth";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/ui/components/sidebar";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/login?error=session_expired");
  }

  const email = session.user.email;
  const user = await getUser();

  const navUser = user
    ? {
        name: user.profile.display_name ?? email,
        email,
        avatarUrl: user.profile.avatar_url,
        initial: (user.profile.display_name?.[0] ?? email[0]).toUpperCase(),
      }
    : {
        name: email.split("@")[0],
        email,
        avatarUrl: null,
        initial: email[0].toUpperCase(),
      };

  return (
    <SidebarProvider>
      <AppSidebar user={navUser} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
