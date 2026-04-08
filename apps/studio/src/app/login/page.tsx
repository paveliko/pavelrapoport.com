import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login — Studio",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Studio</h1>
          <p className="text-sm text-neutral-500">
            Sign in with your email to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
