import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Login</h1>
      <LoginForm />
      <p className="text-xs text-neutral-500">
        Demo-Zugänge: owner@clientportal.demo / OwnerPass123! ·
        client@clientportal.demo / ClientPass123!
      </p>
    </div>
  );
}
