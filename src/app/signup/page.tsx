import { Suspense } from "react";
import SignupContent from "@/app/signup/SignupContent";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
