import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default async function AdminAccountPage() {
  const { requireAdminOrRedirect } = await import(
    "@/modules/auth/require-admin"
  );
  await requireAdminOrRedirect("/admin/account");

  return (
    <AdminPageFrame title="Аккаунт" currentPath="/admin/account">
      <ChangePasswordForm />
    </AdminPageFrame>
  );
}
