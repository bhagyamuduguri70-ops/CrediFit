import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, accessToken } = response.data.data;

      login(user, accessToken);

      // Redirect based on role code
      switch (user.roleCode) {
        case "APPLICANT":
          navigate("/applicant/dashboard");
          break;
        case "ADMISSION_OFFICER":
          navigate("/officer/dashboard");
          break;
        case "EVALUATOR":
          navigate("/evaluator/dashboard");
          break;
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0_20px_50px_rgba(20,43,79,0.08)] border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Section: Enterprise Brand Panel */}
        <div className="lg:col-span-5 bg-[#142B4F] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle geometric background accents */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0D9488]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0D9488] flex items-center justify-center font-bold text-white shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">CrediFit</span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-teal-300">
                  Admission Register
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white leading-snug">
                University Admission Stage-Wise Screening System
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streamlining academic validation, certificate auditing, departmental rubric scoring, and formal enrollment governance.
              </p>
            </div>
          </div>

          {/* Middle: 5 Canonical Screening Stages */}
          <div className="relative z-10 my-6 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 5-Stage Verification Protocol
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Stage 1: Application Screening & Profile</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Stage 2: Officer Document Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Stage 3: Automated Eligibility Rules</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Stage 4: Faculty Department Review</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Stage 5: Final Admission Decision</span>
              </li>
            </ul>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>MySQL 8 Relational Integrity</span>
            <span className="text-teal-400 font-medium">Enterprise v2.0</span>
          </div>
        </div>

        {/* Right Section: Modern Clean Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Welcome Back</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Sign in to your CrediFit Admission Portal to continue.
              </p>
            </div>

            {/* Quick Demo Switcher */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200/90 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center justify-between">
                <span>Quick Demo Accounts:</span>
                <span className="text-[10px] text-blue-600 font-medium">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@credifit.demo", "Demo@1234")}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded text-slate-800 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("officer1@credifit.demo", "Demo@1234")}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded text-slate-800 transition-colors"
                >
                  Officer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("evaluator1@credifit.demo", "Demo@1234")}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded text-slate-800 transition-colors"
                >
                  Evaluator
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("applicant1@credifit.demo", "Applicant@1234")}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded text-slate-800 transition-colors"
                >
                  Applicant
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@credifit.demo"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#172033]">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Please contact the University Admission Admin to reset credentials.");
                    }}
                    className="text-[11px] text-[#2563EB] hover:underline font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-[#64748B] select-none">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#142B4F] hover:bg-[#0d1e38] text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Registration Link for Applicants */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-[#64748B]">
                Applying for undergraduate admission?{" "}
                <Link
                  to="/register"
                  className="text-[#2563EB] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Create an applicant account
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
