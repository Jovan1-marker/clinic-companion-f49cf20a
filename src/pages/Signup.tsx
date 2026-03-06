/**
 * Signup Page
 * Students register with their details including name split into last/first/middle.
 * Grade dropdown with SHS strand support.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.webp";

const strands = ["ICT", "GAS", "STEM", "HUMSS", "ABM"];

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lrn, setLrn] = useState("");
  const [grade, setGrade] = useState("");
  const [strand, setStrand] = useState("");
  const [section, setSection] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSHS = grade === "11" || grade === "12";
  const fullName = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
  const gradeDisplay = strand
    ? `${grade} ${strand} - ${section}`
    : `${grade} - ${section}`;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            lrn: lrn,
            role: "student",
          },
        },
      });

      if (error) throw error;

      /* Update profile with extra fields */
      if (data.user) {
        await supabase.from("profiles").update({
          grade: gradeDisplay,
          section,
          strand: strand || null,
          contact_no: contactNo,
        }).eq("id", data.user.id);
      }

      toast({
        title: "Account Created!",
        description: "You can now log in with your credentials.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account.",
        variant: "destructive",
      });
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
          <p className="text-muted-foreground">Create your student account</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name fields */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Last Name</label>
              <Input placeholder="e.g. Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">First Name</label>
              <Input placeholder="e.g. Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Middle Name (optional)</label>
              <Input placeholder="e.g. A." value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>

            {/* LRN */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">LRN</label>
              <Input placeholder="e.g. 136888141225" value={lrn} onChange={(e) => setLrn(e.target.value)} required maxLength={12} />
            </div>

            {/* Grade dropdown */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Grade</label>
              <Select value={grade} onValueChange={(v) => { setGrade(v); setStrand(""); }}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {["7", "8", "9", "10", "11", "12"].map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Strand dropdown for SHS */}
            {isSHS && (
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Strand</label>
                <Select value={strand} onValueChange={setStrand}>
                  <SelectTrigger><SelectValue placeholder="Select strand" /></SelectTrigger>
                  <SelectContent>
                    {strands.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Section */}
            {grade && (
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Section</label>
                <Input placeholder="e.g. THALES" value={section} onChange={(e) => setSection(e.target.value)} required />
              </div>
            )}

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Contact No.</label>
              <Input placeholder="e.g. 09123456789" value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log In</Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
