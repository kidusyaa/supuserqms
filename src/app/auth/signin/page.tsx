// app/auth/signin/page.tsx
import { Suspense } from "react";
import SignInClient from "./Signinclient";
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    }>
      <SignInClient />
    </Suspense>
  );
}