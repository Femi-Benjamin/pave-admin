// PAVE Admin - Forgot Password Page

import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, Wallet, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await authService.forgotPassword(email);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || "Failed to send reset code");
    }

    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    const result = await authService.resetPassword(token.trim(), password);
    setIsLoading(false);
    if (result.success) {
      setIsDone(true);
    } else {
      setError(result.error || "Unable to reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/pave_logo.png"
            alt="PAVE Admin Hub"
            className="w-12 h-12 rounded-xl"
          />
          <span className="text-2xl font-bold text-foreground font-display">
            PAVE Admin Hub
          </span>
        </div>

        {isDone ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password updated</h2>
            <p className="text-muted-foreground mb-8">You can now sign in with your new password.</p>
            <Link to="/login">
              <Button className="w-full h-12">Back to login</Button>
            </Link>
          </motion.div>
        ) : isSuccess ? (
          <motion.form
            onSubmit={handleReset}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Enter your reset code</h2>
              <p className="text-muted-foreground">
                We sent a reset code to{" "}
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>
            {error && (
              <div role="alert" className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="token">Reset code</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} className="h-12" required autoComplete="one-time-code" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" required autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" required autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full h-12 text-base gradient-hero hover:opacity-90 transition-opacity" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Resetting...</>) : "Reset password"}
            </Button>
            <Link to="/login">
              <Button type="button" variant="ghost" className="w-full h-12 text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </motion.form>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Forgot password?
              </h2>
              <p className="text-muted-foreground">
                Enter your email and we'll send you a reset code
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pave.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base gradient-hero hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset code"
                )}
              </Button>

              <Link to="/login">
                <Button
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
