import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email });
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-brand-900 mb-4">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-gray-600">If that email exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm" placeholder="you@company.com" />
            <button className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md py-2 text-sm font-medium">
              Send reset link
            </button>
          </form>
        )}
        <Link to="/login" className="text-sm text-brand-600 hover:underline block mt-4">Back to login</Link>
      </div>
    </div>
  );
}
