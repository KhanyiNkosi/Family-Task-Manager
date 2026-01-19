// app/register/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push("/");
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#00C2E0", fontSize: "32px", marginBottom: "20px" }}>Register Page</h1>
      <p style={{ color: "#64748b", marginBottom: "30px" }}>This is a placeholder. Add your registration form here.</p>
      <button 
        onClick={handleBack}
        style={{ background: "#00C2E0", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        Back to Home
      </button>
    </div>
  );
}
