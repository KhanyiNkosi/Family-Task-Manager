"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent", // "parent" or "child"
    familyCode: "",
    joinExistingFamily: false, // For parents joining as 2nd parent
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      // Strict password validation
      const password = formData.password;
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (password.length < minLength) {
        newErrors.password = `Password must be at least ${minLength} characters`;
      } else if (!hasUpperCase) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!hasLowerCase) {
        newErrors.password = "Password must contain at least one lowercase letter";
      } else if (!hasNumber) {
        newErrors.password = "Password must contain at least one number";
      } else if (!hasSpecialChar) {
        newErrors.password = "Password must contain at least one special character (!@#$%^&*...)";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "child" && !formData.familyCode.trim()) {
      newErrors.familyCode = "Family code is required for child accounts";
    }

    if (formData.role === "parent" && formData.joinExistingFamily && !formData.familyCode.trim()) {
      newErrors.familyCode = "Family code is required to join an existing family";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Check registration limit first (app-level check)
      const limitResponse = await fetch('/api/check-registration-limit');
      const limitData = await limitResponse.json();
      
      if (!limitData.allowed) {
        setErrors({ 
          general: limitData.message || 'Registration is currently at capacity. Please try again later or contact support@familytask.co' 
        });
        setLoading(false);
        return;
      }

      // If child OR parent joining existing family, validate family code first
      if (formData.role === "child" || (formData.role === "parent" && formData.joinExistingFamily)) {
        const validateResponse = await fetch('/api/family/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            familyCode: formData.familyCode,
            role: formData.role,
            checkParentLimit: formData.role === "parent"
          })
        });

        const validateData = await validateResponse.json();
        
        if (!validateData.valid) {
          setErrors({ familyCode: validateData.error });
          setLoading(false);
          return;
        }
      }

      // Use the Supabase client we fixed
      const supabase = createClientSupabaseClient();
      
      // Dynamic redirect URL - works in both local and production
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      // Make the actual Supabase API call with email and password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            family_code: formData.familyCode,
            join_existing_family: formData.role === "parent" && formData.joinExistingFamily,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes("rate limit")) {
          setCooldownSeconds(300); // 5 minute cooldown
          setErrors({ 
            general: "⏱️ Rate limit reached. Please wait 5 minutes before trying again, or check your email - you may have already received a confirmation link." 
          });
        } else if (error.message.includes("Anonymous") || error.message.includes("anonymous")) {
          setErrors({ 
            general: "Authentication error. Please try again or contact support." 
          });
        } else if (error.message.includes("already registered")) {
          setErrors({ 
            general: "This email is already registered. Please log in instead, or use a different email." 
          });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        // Success! Immediately create family and fix profile
        console.log("✅ User created:", data.user?.id);
        
        try {
          // CRITICAL FIX: Create family and update profile immediately
          const userId = data.user?.id;
          if (userId) {
            if (formData.role === "parent" && !formData.joinExistingFamily) {
              // Parent: Create new family (only if not joining existing)
              const familyId = crypto.randomUUID();
              
              console.log("Creating family for parent:", familyId);
              
              // Create family record using service role via API
              const familyResponse = await fetch('/api/family/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId,
                  familyId,
                  role: 'parent'
                })
              });
              
              const familyResult = await familyResponse.json();
              if (familyResult.success) {
                console.log("✅ Family created and profile updated!");
              } else {
                console.warn("⚠️ Family creation failed:", familyResult.error);
              }
            } else if (formData.role === "parent" && formData.joinExistingFamily) {
              // Parent joining existing family as 2nd parent
              console.log("Linking 2nd parent to family:", formData.familyCode);
              
              const linkResponse = await fetch('/api/family/link-parent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId,
                  familyCode: formData.familyCode
                })
              });
              
              const linkResult = await linkResponse.json();
              if (linkResult.success) {
                console.log("✅ 2nd parent linked to family!");
              } else {
                console.warn("⚠️ Parent linking failed:", linkResult.error);
              }
            } else {
              // Child: Link to existing family
              console.log("Linking child to family:", formData.familyCode);
              
              const linkResponse = await fetch('/api/family/link-child', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId,
                  familyCode: formData.familyCode
                })
              });
              
              const linkResult = await linkResponse.json();
              if (linkResult.success) {
                console.log("✅ Child linked to family!");
              } else {
                console.warn("⚠️ Child linking failed:", linkResult.error);
              }
            }
          }
        } catch (familyError) {
          console.error("Family setup error (non-fatal):", familyError);
          // Continue anyway - user is created
        }
        
        setSuccess(true);
        
        // Store email for confirmation page
        localStorage.setItem("pendingRegistrationEmail", formData.email);
        
        // Show success message briefly then redirect to success page
        setTimeout(() => {
          router.push("/register/success");
        }, 1500);
      }
    } catch (error: any) {
      setErrors({ 
        general: error.message || "Registration failed. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">
        {/* Left Side - Illustration/Info */}
        <div className="md:w-2/5 bg-gradient-to-br from-cyan-500 to-teal-600 text-white p-10 flex flex-col justify-center">
          <div className="mb-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <i className="fas fa-smile text-3xl"></i>
              </div>
              <h1 className="text-3xl font-black">FamilyTask</h1>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Join Our Family Community</h2>
            <p className="text-white/90">
              Create your account and start organizing family tasks, earning rewards, and building better habits together!
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-trophy text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Earn Rewards</h3>
                <p className="text-white/80 text-sm">Complete tasks and earn points for fun rewards</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-users text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Family Collaboration</h3>
                <p className="text-white/80 text-sm">Work together as a team to achieve family goals</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Track Progress</h3>
                <p className="text-white/80 text-sm">Monitor your family's achievements and growth</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="md:w-3/5 bg-white p-10">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Join FamilyTask and organize your family life</p>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                  <div>
                    <p className="text-green-800 font-medium">
                      Account created successfully!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Redirecting to confirmation page...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
                  <div>
                    <p className="text-red-800 font-medium">
                      Registration Error
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                      {errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <i className="fas fa-user"></i>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-lock"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                  {!errors.password && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p className="font-medium">Password must contain:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>At least 8 characters</li>
                        <li>Uppercase letter (A-Z)</li>
                        <li>Lowercase letter (a-z)</li>
                        <li>Number (0-9)</li>
                        <li>Special character (!@#$%...)</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-lock"></i>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  I am a... <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: "parent" }));
                      if (errors.role) setErrors(prev => ({ ...prev, role: "" }));
                    }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.role === "parent"
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 hover:border-cyan-300 text-gray-700"
                    }`}
                  >
                    <i className="fas fa-user-friends text-2xl"></i>
                    <span className="font-bold">Parent</span>
                    <span className="text-sm">Manage family tasks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: "child" }));
                      if (errors.role) setErrors(prev => ({ ...prev, role: "" }));
                    }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.role === "child"
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 hover:border-cyan-300 text-gray-700"
                    }`}
                  >
                    <i className="fas fa-child text-2xl"></i>
                    <span className="font-bold">Child</span>
                    <span className="text-sm">Complete tasks & earn rewards</span>
                  </button>
                </div>
                <input type="hidden" name="role" value={formData.role} />
              </div>

              {/* For Parents: Option to join existing family */}
              {formData.role === "parent" && (
                <div className="animate-fade-in">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.joinExistingFamily}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, joinExistingFamily: e.target.checked }));
                          if (!e.target.checked) {
                            setFormData(prev => ({ ...prev, familyCode: "" }));
                            setErrors(prev => ({ ...prev, familyCode: "" }));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-blue-900 font-medium">
                          I want to join an existing family (as co-parent)
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Check this if you're a parent joining a family that already exists. Maximum 2 parents per family.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Family Code (for children OR parents joining existing family) */}
              {(formData.role === "child" || (formData.role === "parent" && formData.joinExistingFamily)) && (
                <div className="animate-fade-in">
                  <label className="block text-gray-700 font-medium mb-2">
                    Family Code <span className="text-red-500">*</span>
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      {formData.role === "parent" 
                        ? "(Enter the code from the first parent)" 
                        : "(Enter the code provided by your parent)"}
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-home"></i>
                    </div>
                    <input
                      type="text"
                      name="familyCode"
                      value={formData.familyCode}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.familyCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your family code"
                    />
                  </div>
                  {errors.familyCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.familyCode}</p>
                  )}
                  
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-amber-600 text-lg mt-0.5"></i>
                      <div>
                        <p className="text-amber-800 text-sm">
                          {formData.role === "parent" 
                            ? "Get the family code from the first parent. Both parents will have equal access to manage the family." 
                            : "Ask your parent for the family code. This connects your account to your family."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  required
                />
                <label htmlFor="terms" className="text-gray-700 text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-cyan-600 font-medium hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-cyan-600 font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating Account...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <i className="fas fa-clock"></i>
                    Retry in {Math.floor(cooldownSeconds / 60)}:{(cooldownSeconds % 60).toString().padStart(2, '0')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Add fade-in animation to CSS */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
