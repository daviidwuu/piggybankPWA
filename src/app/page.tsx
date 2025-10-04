import { AuthGuard } from "@/app/auth-guard";
import { Dashboard } from "@/app/dashboard";

export default function Page() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
