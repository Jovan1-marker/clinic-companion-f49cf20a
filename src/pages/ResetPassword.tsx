/**
 * Reset Password Page
 * User arrives here from the password reset email link.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.webp";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /* Check for recovery token in URL */
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast({ title: "Invalid Link", description: "This reset link is invalid or expired.", variant: "destructive" });
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password Updated!", description: "You can now log in with your new password." });
      navigate("/login");
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
          <p className="text-muted-foreground">Set your new password</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">New Password</label>
              <Input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
