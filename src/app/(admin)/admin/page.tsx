import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin");
  redirect("/admin/hero");
}
