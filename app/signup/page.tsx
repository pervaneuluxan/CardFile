import AuthForm from "@/components/auth-form";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Create your board",
  description: "Create a free Cardfile account and get a private board with five columns, from Wish List to Offer.",
  path: "/signup",
});

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
