import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default function AdminAccountPage() {
  return (
    <AdminPageFrame title="Аккаунт" currentPath="/admin/account">
      <ChangePasswordForm />
    </AdminPageFrame>
  );
}
