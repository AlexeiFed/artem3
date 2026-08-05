import { AdminShell } from "@/components/admin/AdminShell";

export function AdminPageFrame({
  title,
  currentPath,
  children,
}: {
  title: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <AdminShell title={title} currentPath={currentPath}>
      {children}
    </AdminShell>
  );
}
