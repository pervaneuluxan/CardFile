import AuthForm from "@/components/auth-form";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to your Cardfile board and pick up your job search where you left it.",
  path: "/signin",
});

export default function SigninPage() {
  return <AuthForm mode="signin" />;
}
