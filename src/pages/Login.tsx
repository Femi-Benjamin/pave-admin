// PAVE Admin - Sign in page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) navigate("/dashboard");
    else setError(result.error || "Login failed");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <img src="/pave_logo.png" alt="PAVE Admin Hub" className="mx-auto mb-8 h-16 w-16 rounded-2xl" />
          <h1 className="mb-4 text-5xl font-bold text-white font-display">PAVE Admin Hub</h1>
          <p className="max-w-md text-xl text-white/80">Digital Wallet, Savings & Thrift Platform</p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-white/70">
            <div><div className="text-3xl font-bold text-white">10K+</div><div className="text-sm">Active Users</div></div>
            <div><div className="text-3xl font-bold text-white">₦5M+</div><div className="text-sm">Transactions</div></div>
            <div><div className="text-3xl font-bold text-white">99.9%</div><div className="text-sm">Uptime</div></div>
          </div>
        </motion.div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <img src="/pave_logo.png" alt="PAVE Admin Hub" className="h-12 w-12 rounded-xl" />
            <span className="text-2xl font-bold text-foreground font-display">PAVE Admin Hub</span>
          </div>
          <div className="mb-7 text-center lg:text-left">
            <h2 className="mb-2 text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your admin account</p>
          </div>
          {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="arowolo@yopmail" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="admin198177" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pr-12" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">Forgot password?</Link>
            </div>
            <Button type="submit" className="h-12 w-full text-base gradient-hero hover:opacity-90" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</> : "Sign in"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}