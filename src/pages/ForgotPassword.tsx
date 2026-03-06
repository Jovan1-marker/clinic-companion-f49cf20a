/**
 * Forgot Password Page
 * Sends a password reset email to the user.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.webp";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email Sent!", description: "Check your inbox for the reset link." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={logo} alt="AAIS Logo" className="w-14 h-14 rounded-full" />
            <h1 className="text-2xl font-bold text-secondary-foreground">MIMS</h1>
          </div>
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Email Address</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
