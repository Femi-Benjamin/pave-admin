// PAVE Admin - Sign in and registration page
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAdminAccount } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const emptyRegistration = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
};

const registerFields = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phoneNumber: "Phone number",
  address: "Address",
  city: "City",
  state: "State",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, admin } = useAuth();
  const createAdminAccount = useCreateAdminAccount();
  const navigate = useNavigate();

  const switchMode = () => {
    setError("");
    setSuccessMessage("");
    setIsRegistering((current) => !current);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) navigate("/dashboard");
    else setError(result.error || "Login failed");
    setIsLoading(false);
  };

  const handleRegistration = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    if (admin?.role !== "super_admin") {
      setError(
        "Admin account creation is restricted to signed-in super administrators. Please sign in, then create the account from Settings.",
      );
      return;
    }
    try {
      const response = await createAdminAccount.mutateAsync({
        ...registration,
        role: "admin",
      });
      setEmail(registration.email);
      setPassword("");
      setRegistration(emptyRegistration);
      setSuccessMessage(
        response?.message ||
          "Account created. Sign in with your email and password.",
      );
      setIsRegistering(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your account.",
      );
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <img
            src="/pave_logo.png"
            alt="PAVE Admin Hub"
            className="mx-auto mb-8 h-16 w-16 rounded-2xl"
          />
          <h1 className="mb-4 text-5xl font-bold text-white font-display">
            PAVE Admin Hub
          </h1>
          <p className="max-w-md text-xl text-white/80">
            Digital Wallet, Savings & Thrift Platform
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-white/70">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">₦5M+</div>
              <div className="text-sm">Transactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm">Uptime</div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto pr-1"
        >
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <img
              src="/pave_logo.png"
              alt="PAVE Admin Hub"
              className="h-12 w-12 rounded-xl"
            />
            <span className="text-2xl font-bold text-foreground font-display">
              PAVE Admin Hub
            </span>
          </div>
          <div className="mb-7 text-center lg:text-left">
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              {isRegistering ? "Create an admin account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground">
              {isRegistering
                ? "A signed-in super administrator must authorize this account."
                : "Sign in to your admin account"}
            </p>
          </div>
          {(error || successMessage) && (
            <div
              className={`mb-5 rounded-lg border p-4 text-sm ${error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-success/20 bg-success/10 text-success"}`}
            >
              {error || successMessage}
            </div>
          )}
          {isRegistering ? (
            <form
              onSubmit={handleRegistration}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {Object.entries(registerFields).map(([name, label]) => (
                <div
                  key={name}
                  className={name === "address" ? "sm:col-span-2" : ""}
                >
                  <Label htmlFor={`register-${name}`}>{label}</Label>
                  <Input
                    id={`register-${name}`}
                    type={
                      name === "email"
                        ? "email"
                        : name === "phoneNumber"
                          ? "tel"
                          : "text"
                    }
                    value={registration[name as keyof typeof registration]}
                    onChange={(event) =>
                      setRegistration((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                    className="mt-2 h-11"
                    required
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="h-12 sm:col-span-2 gradient-hero hover:opacity-90"
                disabled={createAdminAccount.isPending}
              >
                {createAdminAccount.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground sm:col-span-2">
                Sign in as a super administrator and use Settings to create an
                administrator account.
              </p>
              <p className="text-center text-md text-muted-foreground sm:col-span-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder=" chinedu@pave.ng"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="admin123"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 pr-12"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base gradient-hero hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              {/* <p className="text-center text-sm text-muted-foreground">
                Demo credentials:{" "}
                <span className="text-foreground">
                  chinedu@pave.ng / admin123
                </span>
              </p> */}
              <p className="text-center text-md text-muted-foreground">
                Need an admin account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Register
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
