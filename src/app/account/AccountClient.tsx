"use client";
import { useState } from "react";
import { Metadata } from "next";
import Loader from "@/components/ui/Loader"; 
import UserProfile from "@/components/profile/UserProfile";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast"; // <-- ADDED


export default function AccountPage() {
  const { user, loadingUser, loginUser, logoutUser } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const loadingToast = toast.loading(isLogin ? "Signing in..." : "Creating account...");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // SUCCESS
      loginUser(data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!", { id: loadingToast });

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Authentication failed", { id: loadingToast });
    } finally {
      setFormLoading(false);
    }
  };

  if (loadingUser) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader /></div>;

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
           <UserProfile user={user} onLogout={logoutUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-serif font-bold text-gray-900 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-500 uppercase tracking-wide">
            {isLogin ? "Sign in to access your dashboard" : "Join us for exclusive offers"}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm rounded-r" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {!isLogin && (
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-floral-magenta focus:border-floral-magenta focus:z-10 sm:text-sm transition-colors"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-floral-magenta focus:border-floral-magenta focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-floral-magenta focus:border-floral-magenta focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={formLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-pink-700 bg-floral-magenta hover:text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-floral-magenta uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <ArrowRight className="h-5 w-5 text-pink-700 group-hover:text-pink-200" aria-hidden="true" />
              </span>
              {formLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="font-medium text-floral-magenta hover:text-pink-700 underline transition-colors"
            >
              {isLogin ? "Register now" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}