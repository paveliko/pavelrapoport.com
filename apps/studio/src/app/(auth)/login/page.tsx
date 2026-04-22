import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login — Studio",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  not_authorized:
    "Your email is not authorized for the studio. Contact Pavel if this is a mistake.",
  auth_failed: "Authentication failed. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawError = params.error;
  const errorKey = Array.isArray(rawError) ? rawError[0] : rawError;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Studio</h1>
          <p className="text-sm text-neutral-500">
            Sign in to continue
          </p>
        </div>
        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
