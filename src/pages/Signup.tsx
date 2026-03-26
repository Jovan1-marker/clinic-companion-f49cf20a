/**
 * Signup Page
 * Students register with health info. Auto-creates patient record & sends SMS.
 */
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [clinicExposure, setClinicExposure] = useState("0");

  const isSHS = grade === "11" || grade === "12";
  const fullName = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
  const gradeDisplay = strand
    ? `${grade} ${strand} - ${section}`
    : `${grade} - ${section}`;

  /* Real-time BMI calculation */
  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  }, [height, weight]);

  const bmiStatus = useMemo(() => {
    if (!bmi) return "";
    const val = parseFloat(bmi);
    if (val < 18.5) return "Underweight";
    if (val < 25) return "Normal";
    if (val < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  /* Philippine mobile number validation */
  const isValidPHNumber = (num: string) => /^09\d{9}$/.test(num.replace(/\s+/g, ''));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPHNumber(contactNo)) {
      toast({ title: "Invalid Contact Number", description: "Use Philippine format: 09XXXXXXXXX", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            lrn,
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

        /* Auto-create patient record */
        await supabase.from("patients").insert({
          full_name: fullName,
          lrn,
          grade: gradeDisplay,
          contact_no: contactNo,
          email,
          height: height ? `${height}cm` : null,
          weight: weight ? `${weight}kg` : null,
          bmi_status: bmiStatus || null,
          medical_history: medicalHistory || "None",
          clinic_exposure: clinicExposure || "0",
        });
      }

      /* Send SMS confirmation (fire-and-forget) */
      if (contactNo) {
        supabase.functions.invoke("send-sms", {
          body: {
            to: contactNo,
            message: "Thank you for signing up at the School Clinic. Your account has been created successfully.",
          },
        }).catch(console.error);
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

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name fields */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Last Name</label>
              <Input placeholder="e.g. Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">First Name</label>
              <Input placeholder="e.g. Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Middle Name (optional)</label>
              <Input placeholder="e.g. A." value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Contact No. <span className="text-destructive">*</span></label>
              <Input placeholder="09123456789" value={contactNo} onChange={(e) => setContactNo(e.target.value)} required maxLength={11} />
              {contactNo && !isValidPHNumber(contactNo) && (
                <p className="text-xs text-destructive mt-1">Use format: 09XXXXXXXXX</p>
              )}
            </div>

            {/* LRN */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">LRN</label>
              <Input placeholder="e.g. 136888141225" value={lrn} onChange={(e) => setLrn(e.target.value)} required maxLength={12} />
            </div>

            {/* Grade dropdown */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Grade</label>
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
                <label className="block text-sm font-medium text-card-foreground mb-1">Strand</label>
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
                <label className="block text-sm font-medium text-card-foreground mb-1">Section</label>
                <Input placeholder="e.g. THALES" value={section} onChange={(e) => setSection(e.target.value)} required />
              </div>
            )}

            {/* Height & Weight side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Height (cm)</label>
                <Input type="number" placeholder="e.g. 165" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Weight (kg)</label>
                <Input type="number" placeholder="e.g. 60" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>

            {/* BMI display */}
            {bmi && (
              <div className="bg-secondary rounded-md p-3 text-sm">
                <span className="font-medium">BMI:</span> {bmi} —{" "}
                <span className={
                  bmiStatus === "Normal" ? "text-primary font-semibold" :
                  bmiStatus === "Underweight" ? "text-accent font-semibold" :
                  "text-destructive font-semibold"
                }>{bmiStatus}</span>
              </div>
            )}

            {/* Medical History */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Medical History</label>
              <Textarea placeholder="None" value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={2} />
            </div>

            {/* Clinic Exposure */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Clinic Exposure (times visited)</label>
              <Input type="number" min="0" placeholder="0" value={clinicExposure} onChange={(e) => setClinicExposure(e.target.value)} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Password</label>
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
