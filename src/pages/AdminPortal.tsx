/**
 * Admin Portal
 * Full admin dashboard with: Overview, Patient management, Appointments,
 * Waitlist, Scheduled, Records, Announcements, Messages
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ClinicSidebar from "@/components/ClinicSidebar";
import {
  Users, CalendarCheck, FolderOpen, Clock, MessageSquare,
  Plus, FileText, X, Check, Bold, Italic, Underline, List,
  AlignLeft, AlignCenter, AlignRight, Save, Megaphone,
  Search, Trash2, Pencil, CheckSquare, AlertTriangle, Activity,
  Download, LayoutDashboard, CalendarDays, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import jsPDF from "jspdf";

const strands = ["ICT", "GAS", "HUMSS", "STEM", "ABM"];

const AdminPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("Overview");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [finishedAppointments, setFinishedAppointments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStrand, setFilterStrand] = useState("all");
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [editPatient, setEditPatient] = useState<any>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: "", lrn: "", grade: "", strand: "", section: "",
    height: "", weight: "", bmi_status: "", medical_history: "",
    clinic_exposure: "", email: "", home_address: "", contact_no: ""
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordTitle, setRecordTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  /* Message state */
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [studentConversations, setStudentConversations] = useState<any[]>([]);

  const handleDownloadRecord = (record: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(record.title || "Untitled Medical Record", 20, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Created: ${new Date(record.created_at).toLocaleDateString()}`, 20, 30);
      doc.setTextColor(0);
      doc.setFontSize(12);
      const content = record.content || "No content available.";
      const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const splitText = doc.splitTextToSize(plainText, 170);
      let y = 50;
      splitText.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 7;
      });
      doc.save(`${record.title || "medical-record"}.pdf`);
      toast({ title: "Download started" });
    } catch (err) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const sidebarLinks = [
    { label: "Overview", icon: LayoutDashboard, onClick: () => setActiveSection("Overview") },
    { label: "Patient", icon: Users, onClick: () => setActiveSection("Patient") },
    { label: "Appointment", icon: CalendarCheck, onClick: () => setActiveSection("Appointment") },
    { label: "Waitlist", icon: Clock, onClick: () => setActiveSection("Waitlist") },
    { label: "Scheduled", icon: CalendarDays, onClick: () => setActiveSection("Scheduled") },
    { label: "Record", icon: FolderOpen, onClick: () => setActiveSection("Record") },
    { label: "Announcements", icon: Megaphone, onClick: () => setActiveSection("Announcements") },
    { label: "Messages", icon: MessageSquare, onClick: () => setActiveSection("Messages") },
  ];

  const isSHS = (grade: string) => grade === "11" || grade === "12";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (prof?.role !== "admin") { navigate("/login"); return; }
      loadData();
    };
    init();
  }, [navigate]);

  const loadData = async () => {
    const [pRes, aRes, allRes, wRes, fRes, rRes, annRes, finRes] = await Promise.all([
      supabase.from("patients").select("*").order("full_name"),
      supabase.from("appointments").select("*").eq("status", "pending").order("created_at"),
      supabase.from("appointments").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").in("status", ["approved", "waitlisted"]).order("created_at"),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("records").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("finished_appointments").select("*").order("finished_at", { ascending: false }),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (aRes.data) setAppointments(aRes.data);
    if (allRes.data) setAllAppointments(allRes.data);
    if (wRes.data) setWaitlist(wRes.data);
    if (fRes.data) {
      setFeedback(fRes.data);
      /* Group conversations by student_id */
      const grouped: Record<string, any[]> = {};
      fRes.data.forEach((f: any) => {
        if (!grouped[f.student_id]) grouped[f.student_id] = [];
        grouped[f.student_id].push(f);
      });
      setStudentConversations(Object.entries(grouped).map(([id, msgs]) => ({
        student_id: id,
        student_name: msgs[0]?.student_name || "Unknown",
        messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        unread: msgs.filter((m: any) => m.sender_role === "student").length,
      })));
    }
    if (rRes.data) setRecords(rRes.data);
    if (annRes.data) setAnnouncements(annRes.data);
    if (finRes.data) setFinishedAppointments(finRes.data);
  };

  /* Helper to extract grade number from stored grade string like "11 ICT - THALES" or "7 - Section" */
  const extractGradeNum = (gradeStr: string) => {
    const match = gradeStr?.match(/^(\d+)/);
    return match ? match[1] : "";
  };

  const extractStrand = (gradeStr: string) => {
    const match = gradeStr?.match(/^\d+\s+(\w+)\s*-/);
    return match ? match[1] : "";
  };

  const filteredPatients = patients
    .filter((p) => {
      const q = patientSearch.toLowerCase();
      const matchesSearch = p.full_name?.toLowerCase().includes(q) || p.lrn?.toLowerCase().includes(q) || p.grade?.toLowerCase().includes(q);
      const gradeNum = extractGradeNum(p.grade || "");
      const matchesGrade = filterGrade === "all" || gradeNum === filterGrade;
      const strand = extractStrand(p.grade || "");
      const matchesStrand = filterStrand === "all" || strand === filterStrand;
      return matchesSearch && matchesGrade && matchesStrand;
    })
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

  /* ===== CRUD Functions ===== */
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ title: announcementTitle, message: announcementMessage });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Announcement Posted!" }); setShowAddAnnouncement(false); setAnnouncementTitle(""); setAnnouncementMessage(""); loadData(); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    loadData();
  };

  const handleDeletePatient = async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    toast({ title: "Patient Deleted" }); loadData();
  };

  const openEditPatient = (p: any) => {
    const gradeStr = p.grade || "";
    let _grade = "", _strand = "", _section = "";
    const shsMatch = gradeStr.match(/^(\d+)\s+(\w+)\s*-\s*(.+)$/);
    const jhsMatch = gradeStr.match(/^(\d+)\s*-\s*(.+)$/);
    if (shsMatch) { _grade = shsMatch[1]; _strand = shsMatch[2]; _section = shsMatch[3].trim(); }
    else if (jhsMatch) { _grade = jhsMatch[1]; _section = jhsMatch[2].trim(); }
    else { _grade = gradeStr; }
    setEditPatient({ ...p, _grade, _strand, _section });
    setShowEditPatient(true);
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPatient) return;
    const { id, _grade, _strand, _section } = editPatient;
    const gradeDisplay = _strand ? `${_grade} ${_strand} - ${_section}` : `${_grade} - ${_section}`;
    const updateData = {
      full_name: editPatient.full_name, lrn: editPatient.lrn || null, grade: gradeDisplay,
      height: editPatient.height || null, weight: editPatient.weight || null,
      bmi_status: editPatient.bmi_status || null, medical_history: editPatient.medical_history || null,
      clinic_exposure: editPatient.clinic_exposure || null, email: editPatient.email || null,
      home_address: editPatient.home_address || null, contact_no: editPatient.contact_no || null,
    };
    const { error } = await supabase.from("patients").update(updateData).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Patient Updated!" }); setShowEditPatient(false); loadData(); }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ["bg-emerald-700", "bg-blue-700", "bg-orange-600", "bg-purple-700", "bg-teal-700", "bg-rose-700", "bg-indigo-700", "bg-amber-700"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const bmiStats = {
    total: patients.length,
    normal: patients.filter(p => p.bmi_status?.toLowerCase() === "normal").length,
    overweight: patients.filter(p => p.bmi_status?.toLowerCase() === "overweight").length,
    underweight: patients.filter(p => p.bmi_status?.toLowerCase() === "underweight").length,
  };

  const calculateBMI = (heightCm: string, weightKg: string): string => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h === 0) return "";

    const bmi = w / ((h / 100) ** 2);
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const gradeDisplay = newPatient.strand ? `${newPatient.grade} ${newPatient.strand} - ${newPatient.section}` : `${newPatient.grade} - ${newPatient.section}`;
    const patientData = {
      full_name: newPatient.full_name, lrn: newPatient.lrn, grade: gradeDisplay,
      height: newPatient.height || null, weight: newPatient.weight || null,
      bmi_status: newPatient.bmi_status || null, medical_history: newPatient.medical_history || null,
      clinic_exposure: newPatient.clinic_exposure || null, email: newPatient.email || null,
      home_address: newPatient.home_address || null, contact_no: newPatient.contact_no || null,
    };
    const { error } = await supabase.from("patients").insert(patientData);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Patient Added!" }); setShowAddPatient(false);
      setNewPatient({ full_name: "", lrn: "", grade: "", strand: "", section: "", height: "", weight: "", bmi_status: "", medical_history: "", clinic_exposure: "", email: "", home_address: "", contact_no: "" });
      loadData();
    }
  };

  /* Send SMS helper (fire-and-forget) */
  const sendSms = (to: string, message: string) => {
    supabase.functions.invoke("send-sms", { body: { to, message } }).catch(console.error);
  };

  /* Look up student contact number from profiles */
  const getStudentContact = async (studentId: string) => {
    const { data } = await supabase.from("profiles").select("contact_no").eq("id", studentId).maybeSingle();
    return data?.contact_no || null;
  };

  const handleApproveClick = (appointmentId: string) => {
    setApprovingId(appointmentId);
    setSelectedDate(undefined);
    setSelectedTime("09:00");
    setShowCalendar(true);
  };

  const handleRejectClick = (appointmentId: string) => {
    setRejectingId(appointmentId);
    setRejectComment("");
    setShowRejectDialog(true);
  };

  const confirmApproval = async () => {
    if (!approvingId || !selectedDate) return;
    const { count } = await supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "approved");
    const status = (count || 0) >= 5 ? "waitlisted" : "approved";
    /* Get the appointment to find student_id */
    const appt = allAppointments.find(a => a.id === approvingId);
    const { error } = await supabase.from("appointments").update({
      status, scheduled_date: selectedDate.toISOString(), scheduled_time: selectedTime,
    }).eq("id", approvingId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      /* Send SMS notification */
      if (appt?.student_id) {
        const contact = await getStudentContact(appt.student_id);
        if (contact) {
          if (status === "approved") {
            sendSms(contact, `Your clinic appointment is scheduled on ${selectedDate.toLocaleDateString()} at ${selectedTime}. Please come on time.`);
          } else {
            sendSms(contact, `Your clinic appointment has been added to the waitlist. You will be notified when a slot opens.`);
          }
        }
      }
      toast({
        title: status === "approved" ? "Appointment Approved!" : "Added to Waitlist",
        description: status === "waitlisted" ? "Max 5 active. Waitlisted." : `Scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      });
      setShowCalendar(false); loadData();
    }
  };

  const confirmRejection = async () => {
    if (!rejectingId) return;
    const { error } = await supabase.from("appointments").update({
      status: "rejected", admin_comment: rejectComment,
    }).eq("id", rejectingId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Appointment Rejected" }); setShowRejectDialog(false); loadData(); }
  };

  const handleMarkDone = async (appointmentId: string) => {
    const appt = allAppointments.find(a => a.id === appointmentId);
    if (!appt) return;

    /* Move to finished_appointments */
    await supabase.from("finished_appointments").insert({
      original_id: appt.id, student_id: appt.student_id, student_name: appt.student_name,
      lrn: appt.lrn, grade: appt.grade, service_type: appt.service_type,
      description: appt.description, scheduled_date: appt.scheduled_date,
      scheduled_time: appt.scheduled_time, admin_comment: appt.admin_comment,
    });
    await supabase.from("appointments").delete().eq("id", appointmentId);

    /* Promote first waitlisted appointment and notify via SMS */
    const { data: nextWaitlisted } = await supabase.from("appointments")
      .select("*").eq("status", "waitlisted").order("created_at").limit(1);
    if (nextWaitlisted && nextWaitlisted.length > 0) {
      const next = nextWaitlisted[0];
      await supabase.from("appointments").update({ status: "approved" }).eq("id", next.id);
      if (next.student_id) {
        const contact = await getStudentContact(next.student_id);
        if (contact) {
          const dateStr = next.scheduled_date ? new Date(next.scheduled_date).toLocaleDateString() : "TBD";
          const timeStr = next.scheduled_time || "TBD";
          sendSms(contact, `Great news! Your clinic appointment has been moved from the waitlist. It is now scheduled on ${dateStr} at ${timeStr}. Please come on time.`);
        }
      }
    }

    toast({ title: "Marked as Done" }); loadData();
  };

  const handleCreateRecord = async () => {
    const { data, error } = await supabase.from("records").insert({ title: "Untitled Document", content: "" }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setRecords([data, ...records]); setEditingRecord(data); setRecordTitle(data.title); }
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;
    const content = editorRef.current?.innerHTML || "";
    const { error } = await supabase.from("records").update({ title: recordTitle, content }).eq("id", editingRecord.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Record Saved!" }); loadData(); }
  };

  const handleDeleteRecord = async (id: string) => {
    await supabase.from("records").delete().eq("id", id);
    toast({ title: "Record Deleted" }); loadData();
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  /* Admin reply to student message — saves in-app AND sends SMS */
  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !adminReply.trim()) return;

    /* 1. Save in-app message */
    const { error } = await supabase.from("feedback").insert({
      student_id: selectedStudentId,
      student_name: "Admin",
      message: adminReply,
      sender_role: "admin",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    /* 2. Send SMS copy to the student */
    try {
      const contact = await getStudentContact(selectedStudentId);
      if (contact) {
        await sendSms(contact, `[School Clinic] Message from Admin: ${adminReply}`);
      }
    } catch (smsErr) {
      console.error("SMS send failed (message still saved in-app):", smsErr);
    }

    setAdminReply("");
    loadData();
    toast({ title: "Sent", description: "Message sent in-app and via SMS." });
  };

  /* Overview stats */
  const overviewStats = {
    totalPatients: patients.length,
    pendingAppts: appointments.length,
    approvedAppts: allAppointments.filter(a => a.status === "approved").length,
    waitlistedAppts: allAppointments.filter(a => a.status === "waitlisted").length,
    rejectedAppts: allAppointments.filter(a => a.status === "rejected").length,
    finishedAppts: finishedAppointments.length,
    totalRecords: records.length,
    totalAnnouncements: announcements.length,
    unreadMessages: feedback.filter(f => f.sender_role === "student").length,
  };

  return (
    <div className="flex min-h-screen">
      <ClinicSidebar links={sidebarLinks} title="Admin Portal" activeLink={activeSection} />
      <main className="flex-1 bg-background p-8 pt-16 md:pt-8 overflow-auto">

        {/* ===== OVERVIEW ===== */}
        {activeSection === "Overview" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" /> Dashboard Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Patients</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overviewStats.totalPatients}</p>
                <Users className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-bold text-accent mt-1">{overviewStats.pendingAppts}</p>
                <CalendarCheck className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</p>
                <p className="text-3xl font-bold text-primary mt-1">{overviewStats.approvedAppts}</p>
                <Check className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waitlisted</p>
                <p className="text-3xl font-bold text-muted-foreground mt-1">{overviewStats.waitlistedAppts}</p>
                <Clock className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejected</p>
                <p className="text-3xl font-bold text-destructive mt-1">{overviewStats.rejectedAppts}</p>
                <XCircle className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finished</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overviewStats.finishedAppts}</p>
                <CheckSquare className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Records</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overviewStats.totalRecords}</p>
                <FolderOpen className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Announcements</p>
                <p className="text-3xl font-bold text-foreground mt-1">{overviewStats.totalAnnouncements}</p>
                <Megaphone className="w-8 h-8 text-muted-foreground/30 ml-auto -mt-6" />
              </div>
            </div>

            {/* Recent appointments */}
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Appointments</h3>
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left p-3 text-sm font-semibold text-secondary-foreground">Student</th>
                    <th className="text-left p-3 text-sm font-semibold text-secondary-foreground">Service</th>
                    <th className="text-left p-3 text-sm font-semibold text-secondary-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-secondary-foreground">Date</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {allAppointments.slice(0, 10).map((appt) => (
                    <tr 
                      key={appt.id} 
                      className="group border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3 text-sm text-card-foreground">{appt.student_name}</td>
                      <td className="p-3 text-sm text-card-foreground">{appt.service_type}</td>
                      <td className="p-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                          ${appt.status === "approved" ? "bg-secondary text-primary" : ""}
                          ${appt.status === "pending" ? "bg-muted text-muted-foreground" : ""}
                          ${appt.status === "rejected" ? "bg-destructive/20 text-destructive" : ""}
                          ${appt.status === "waitlisted" ? "bg-accent/20 text-accent-foreground" : ""}
                        `}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(appt.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("appointments")
                              .delete()
                              .eq("id", appt.id);

                            if (error) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            } else {
                              toast({ 
                                title: "Appointment Deleted",
                                description: `${appt.student_name}'s appointment has been removed.` 
                              });
                              loadData();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== PATIENT SECTION ===== */}
        {activeSection === "Patient" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-6 h-6" /> Patients
                </h2>
                <p className="text-sm text-muted-foreground">Click "Show" to view full details</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterGrade} onValueChange={(v) => { setFilterGrade(v); setFilterStrand("all"); }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {["7", "8", "9", "10", "11", "12"].map((g) => (
                      <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterGrade === "11" || filterGrade === "12") && (
                  <Select value={filterStrand} onValueChange={setFilterStrand}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Strand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strands</SelectItem>
                      {strands.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={() => setShowAddPatient(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Patient
                </Button>
              </div>
            </div>

            {/* BMI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">TOTAL PATIENTS</p>
                <p className="text-4xl font-bold text-foreground mt-1">{bmiStats.total}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">NORMAL BMI</p>
                <p className="text-4xl font-bold text-emerald-600 mt-1">{bmiStats.normal}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">OVERWEIGHT</p>
                <p className="text-4xl font-bold text-orange-600 mt-1">{bmiStats.overweight}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">UNDERWEIGHT</p>
                <p className="text-4xl font-bold text-blue-600 mt-1">{bmiStats.underweight}</p>
              </div>
            </div>

            {/* Patient Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {filteredPatients.map((p) => {
                const isExpanded = expandedPatientId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${isExpanded ? 'shadow-xl' : ''}`}
                  >
                    <div className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${getAvatarColor(p.full_name)} flex items-center justify-center text-white text-xl font-bold`}>
                        {getInitials(p.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">LRN: {p.lrn}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPatientId(isExpanded ? null : p.id);
                        }}
                      >
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-6 border-t border-border pt-5 bg-muted/30">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">GRADE</p>
                            <p className="font-medium mt-1">{p.grade}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">BMI</p>
                            <p className="font-medium mt-1">{p.bmi_status || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">HEIGHT</p>
                            <p className="font-medium mt-1">{p.height ? `${p.height} cm` : "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">WEIGHT</p>
                            <p className="font-medium mt-1">{p.weight ? `${p.weight} kg` : "—"}</p>
                          </div>
                        </div>
                        <div className="mt-5 pt-5 border-t border-border">
                          <p className="text-xs text-muted-foreground font-medium mb-1">MEDICAL HISTORY</p>
                          <p className="text-sm">{p.medical_history || "None"}</p>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground font-medium mb-1">CLINIC EXPOSURE</p>
                          <p className="text-sm">{p.clinic_exposure || "None"}</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); openEditPatient(p); }}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id); }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADD PATIENT */}
            <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name (Last, First Middle)</label>
                    <Input value={newPatient.full_name} onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })} required placeholder="e.g. Rollon, Van A." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">LRN (Numbers only, max 12 digits)</label>
                    <Input 
                      type="text"
                      maxLength={12}
                      value={newPatient.lrn} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewPatient({ ...newPatient, lrn: value });
                      }} 
                      required 
                      
                    />
                    {newPatient.lrn && newPatient.lrn.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Only numbers allowed • {newPatient.lrn.length}/12 digits</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Grade</label>
                      <Select value={newPatient.grade} onValueChange={(v) => setNewPatient({ ...newPatient, grade: v, strand: "", section: "" })}>
                        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                        <SelectContent>{["7", "8", "9", "10", "11", "12"].map((g) => (<SelectItem key={g} value={g}>Grade {g}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    {isSHS(newPatient.grade) && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Strand</label>
                        <Select value={newPatient.strand} onValueChange={(v) => setNewPatient({ ...newPatient, strand: v })}>
                          <SelectTrigger><SelectValue placeholder="Select strand" /></SelectTrigger>
                          <SelectContent>{strands.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {newPatient.grade && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Section</label>
                      <Input value={newPatient.section} onChange={(e) => setNewPatient({ ...newPatient, section: e.target.value })} placeholder="e.g. SARTRE" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Height (cm)</label>
                      <Input 
                        type="number" 
                        placeholder="165" 
                        value={newPatient.height} 
                        onChange={(e) => {
                          const height = e.target.value;
                          const bmiStatus = calculateBMI(height, newPatient.weight);
                          setNewPatient({ ...newPatient, height, bmi_status: bmiStatus });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                      <Input 
                        type="number" 
                        placeholder="59" 
                        value={newPatient.weight} 
                        onChange={(e) => {
                          const weight = e.target.value;
                          const bmiStatus = calculateBMI(newPatient.height, weight);
                          setNewPatient({ ...newPatient, weight, bmi_status: bmiStatus });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">BMI Status (Auto-calculated)</label>
                    <Input value={newPatient.bmi_status || ""} readOnly className="bg-muted font-medium" />
                  </div>

                  <div><label className="block text-sm font-medium mb-1">Medical History</label>
                    <Input placeholder="e.g. Asthma" value={newPatient.medical_history} onChange={(e) => setNewPatient({ ...newPatient, medical_history: e.target.value })} />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Clinic Exposure</label>
                    <Input placeholder="e.g. Yes – 3x" value={newPatient.clinic_exposure} onChange={(e) => setNewPatient({ ...newPatient, clinic_exposure: e.target.value })} />
                  </div>

                  <DialogFooter><Button type="submit">Add Patient</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* EDIT PATIENT */}
            <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Patient</DialogTitle></DialogHeader>
                {editPatient && (
                  <form onSubmit={handleEditPatient} className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Full Name</label>
                      <Input value={editPatient.full_name} onChange={(e) => setEditPatient({ ...editPatient, full_name: e.target.value })} required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">LRN (Numbers only, max 12 digits)</label>
                      <Input 
                        type="text"
                        maxLength={12}
                        value={editPatient.lrn || ""} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setEditPatient({ ...editPatient, lrn: value });
                        }} 
                      />
                      {editPatient.lrn && editPatient.lrn.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Only numbers allowed • {editPatient.lrn.length}/12 digits</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Grade</label>
                        <Select value={editPatient._grade || ""} onValueChange={(v) => setEditPatient({ ...editPatient, _grade: v, _strand: "" })}>
                          <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                          <SelectContent>{["7", "8", "9", "10", "11", "12"].map((g) => (<SelectItem key={g} value={g}>Grade {g}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      {isSHS(editPatient._grade || "") && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Strand</label>
                          <Select value={editPatient._strand || ""} onValueChange={(v) => setEditPatient({ ...editPatient, _strand: v })}>
                            <SelectTrigger><SelectValue placeholder="Select strand" /></SelectTrigger>
                            <SelectContent>{strands.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {editPatient._grade && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <Input value={editPatient._section || ""} onChange={(e) => setEditPatient({ ...editPatient, _section: e.target.value })} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Height (cm)</label>
                        <Input 
                          type="number" 
                          placeholder="165" 
                          value={editPatient.height || ""} 
                          onChange={(e) => {
                            const height = e.target.value;
                            const bmiStatus = calculateBMI(height, editPatient.weight || "");
                            setEditPatient({ ...editPatient, height, bmi_status: bmiStatus });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                        <Input 
                          type="number" 
                          placeholder="59" 
                          value={editPatient.weight || ""} 
                          onChange={(e) => {
                            const weight = e.target.value;
                            const bmiStatus = calculateBMI(editPatient.height || "", weight);
                            setEditPatient({ ...editPatient, weight, bmi_status: bmiStatus });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">BMI Status (Auto-calculated)</label>
                      <Input value={editPatient.bmi_status || ""} readOnly className="bg-muted font-medium" />
                    </div>

                    <div><label className="block text-sm font-medium mb-1">Medical History</label>
                      <Input value={editPatient.medical_history || ""} onChange={(e) => setEditPatient({ ...editPatient, medical_history: e.target.value })} />
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Clinic Exposure</label>
                      <Input value={editPatient.clinic_exposure || ""} onChange={(e) => setEditPatient({ ...editPatient, clinic_exposure: e.target.value })} />
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Email</label>
                      <Input value={editPatient.email || ""} onChange={(e) => setEditPatient({ ...editPatient, email: e.target.value })} />
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Home Address</label>
                      <Input value={editPatient.home_address || ""} onChange={(e) => setEditPatient({ ...editPatient, home_address: e.target.value })} />
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Contact No.</label>
                      <Input value={editPatient.contact_no || ""} onChange={(e) => setEditPatient({ ...editPatient, contact_no: e.target.value })} />
                    </div>

                    <DialogFooter><Button type="submit">Save Changes</Button></DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ===== APPOINTMENT ===== */}
        {activeSection === "Appointment" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Pending Appointments</h2>
            {appointments.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending appointments.</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Student</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">LRN</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Service</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Grade</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Description</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="border-t border-border">
                        <td className="p-4 text-sm text-card-foreground">{appt.student_name}</td>
                        <td className="p-4 text-sm text-card-foreground">{appt.lrn}</td>
                        <td className="p-4 text-sm text-card-foreground">{appt.service_type}</td>
                        <td className="p-4 text-sm text-card-foreground">{appt.grade}</td>
                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{appt.description}</td>
                        <td className="p-4 flex gap-2">
                          <Button size="sm" onClick={() => handleApproveClick(appt.id)}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectClick(appt.id)}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Finished Appointments */}
            {finishedAppointments.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-foreground mb-4">Finished Appointments</h3>
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Student</th>
                        <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Service</th>
                        <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Scheduled</th>
                        <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Finished Date</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {finishedAppointments.map((appt) => (
                        <tr 
                          key={appt.id} 
                          className="group border-t border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 text-sm text-card-foreground">{appt.student_name}</td>
                          <td className="p-4 text-sm text-card-foreground">{appt.service_type}</td>
                          <td className="p-4 text-sm text-card-foreground">
                            {appt.scheduled_date 
                              ? new Date(appt.scheduled_date).toLocaleDateString() 
                              : "—"}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(appt.finished_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("finished_appointments")
                                  .delete()
                                  .eq("id", appt.id);

                                if (error) {
                                  toast({
                                    title: "Error",
                                    description: error.message,
                                    variant: "destructive"
                                  });
                                } else {
                                  toast({
                                    title: "Appointment Deleted",
                                    description: `${appt.student_name}'s record has been removed.`,
                                  });
                                  loadData();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approve Calendar Dialog */}
            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogContent>
                <DialogHeader><DialogTitle>Select Appointment Date & Time</DialogTitle></DialogHeader>
                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} className="pointer-events-auto" />
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <label className="text-sm font-medium">Time:</label>
                  <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-40" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCalendar(false)}>Cancel</Button>
                  <Button onClick={confirmApproval} disabled={!selectedDate}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Reject Appointment</DialogTitle></DialogHeader>
                <div>
                  <label className="block text-sm font-medium mb-2">Reason for rejection</label>
                  <Textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Explain why..." rows={3} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmRejection}>Reject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ===== WAITLIST ===== */}
        {activeSection === "Waitlist" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Appointment Waitlist</h2>
            {waitlist.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments in waitlist.</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">#</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Student</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Service</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Scheduled</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w, i) => (
                      <tr key={w.id} className="border-t border-border">
                        <td className="p-4 text-sm text-card-foreground font-bold">{i + 1}</td>
                        <td className="p-4 text-sm text-card-foreground">{w.student_name}</td>
                        <td className="p-4 text-sm text-card-foreground">{w.service_type}</td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${w.status === "approved" ? "bg-secondary text-primary" : "bg-accent/20 text-accent-foreground"}`}>{w.status}</span>
                        </td>
                        <td className="p-4 text-sm text-card-foreground">{w.scheduled_date ? `${new Date(w.scheduled_date).toLocaleDateString()}${w.scheduled_time ? ` at ${w.scheduled_time}` : ""}` : "—"}</td>
                        <td className="p-4">
                          <Button size="sm" variant="outline" onClick={() => handleMarkDone(w.id)}><CheckSquare className="w-4 h-4 mr-1" /> Mark Done</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== SCHEDULED / OVERVIEW ===== */}
        {activeSection === "Scheduled" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2"><CalendarDays className="w-6 h-6" /> Scheduled Appointments</h2>
            {(() => {
              const approved = allAppointments.filter(a => a.status === "approved" && a.scheduled_date);
              if (approved.length === 0) return (
                <div className="bg-card rounded-lg border border-border p-8 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No scheduled appointments.</p>
                </div>
              );

              /* Group by date */
              const grouped: Record<string, any[]> = {};
              approved.forEach(a => {
                const dateStr = new Date(a.scheduled_date).toLocaleDateString();
                if (!grouped[dateStr]) grouped[dateStr] = [];
                grouped[dateStr].push(a);
              });

              return (
                <div className="space-y-6">
                  {Object.entries(grouped).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, appts]) => {
                    const isUpcoming = new Date(appts[0].scheduled_date).getTime() - Date.now() < 86400000;
                    return (
                      <div key={date} className={`bg-card rounded-lg border ${isUpcoming ? "border-accent border-2" : "border-border"} p-5`}>
                        <h3 className={`text-lg font-semibold mb-3 ${isUpcoming ? "text-accent" : "text-card-foreground"}`}>
                          📅 {date} {isUpcoming && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full ml-2">Within 24hrs</span>}
                        </h3>
                        <div className="space-y-2">
                          {appts.map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-secondary/50 rounded-md px-4 py-2">
                              <div>
                                <p className="text-sm font-medium text-card-foreground">{a.student_name} — {a.service_type}</p>
                                <p className="text-xs text-muted-foreground">{a.scheduled_time || "No time set"}</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleMarkDone(a.id)}>
                                <CheckSquare className="w-4 h-4 mr-1" /> Done
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== RECORDS ===== */}
        {activeSection === "Record" && (
          <div>
            {editingRecord ? (
              <div className="record-editor">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <Input value={recordTitle} onChange={(e) => setRecordTitle(e.target.value)} className="text-xl font-bold border-none bg-transparent shadow-none max-w-md" placeholder="Document Title" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveRecord}><Save className="w-4 h-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingRecord(null); loadData(); }}><X className="w-4 h-4 mr-1" /> Close</Button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-t-lg p-2 flex gap-1 flex-wrap">
                  <button onClick={() => execCommand("bold")} className="p-2 rounded hover:bg-secondary"><Bold className="w-4 h-4" /></button>
                  <button onClick={() => execCommand("italic")} className="p-2 rounded hover:bg-secondary"><Italic className="w-4 h-4" /></button>
                  <button onClick={() => execCommand("underline")} className="p-2 rounded hover:bg-secondary"><Underline className="w-4 h-4" /></button>
                  <div className="w-px bg-border mx-1" />
                  <button onClick={() => execCommand("justifyLeft")} className="p-2 rounded hover:bg-secondary"><AlignLeft className="w-4 h-4" /></button>
                  <button onClick={() => execCommand("justifyCenter")} className="p-2 rounded hover:bg-secondary"><AlignCenter className="w-4 h-4" /></button>
                  <button onClick={() => execCommand("justifyRight")} className="p-2 rounded hover:bg-secondary"><AlignRight className="w-4 h-4" /></button>
                  <div className="w-px bg-border mx-1" />
                  <button onClick={() => execCommand("insertUnorderedList")} className="p-2 rounded hover:bg-secondary"><List className="w-4 h-4" /></button>
                  <div className="w-px bg-border mx-1" />
                  <select onChange={(e) => execCommand("fontSize", e.target.value)} className="text-sm bg-background border border-border rounded px-2 py-1">
                    <option value="3">Normal</option>
                    <option value="1">Small</option>
                    <option value="5">Large</option>
                    <option value="7">Huge</option>
                  </select>
                </div>
                <div ref={editorRef} contentEditable className="bg-card border border-t-0 border-border rounded-b-lg min-h-[500px] p-6 focus:outline-none" dangerouslySetInnerHTML={{ __html: editingRecord.content || "" }} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Medical Records</h2>
                  <Button onClick={handleCreateRecord}><Plus className="w-4 h-4 mr-2" /> Create New Record</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {records.map((rec) => (
                    <div key={rec.id} onClick={() => { setEditingRecord(rec); setRecordTitle(rec.title); }} className="group relative bg-card rounded-lg border border-border p-4 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                      <div className="text-center pb-1">
                        <FileText className="w-12 h-12 text-primary mx-auto mb-3 group-hover:scale-105 transition-transform" />
                        <p className="text-sm font-medium truncate px-2">{rec.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(rec.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDownloadRecord(rec); }}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                {records.length === 0 && (
                  <div className="bg-card rounded-lg border border-border p-12 text-center mt-4">
                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No records yet. Create your first medical record.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== ANNOUNCEMENTS ===== */}
        {activeSection === "Announcements" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manage Announcements</h2>
              <Button onClick={() => setShowAddAnnouncement(true)}><Plus className="w-4 h-4 mr-2" /> New Announcement</Button>
            </div>
            {announcements.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-card rounded-lg border border-border p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-accent font-semibold mb-1">{new Date(a.created_at).toLocaleDateString()}{a.title && ` — ${a.title}`}</p>
                        <p className="text-card-foreground">{a.message}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
              <DialogContent>
                <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                <form onSubmit={handleAddAnnouncement} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Title (optional)</label><Input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="e.g. Vaccination Schedule" /></div>
                  <div><label className="block text-sm font-medium mb-1">Message</label><Textarea value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} rows={4} required placeholder="Write your announcement..." /></div>
                  <DialogFooter><Button type="submit">Post Announcement</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ===== MESSAGES ===== */}
        {activeSection === "Messages" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Student Messages</h2>
            <div className="flex bg-card rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
              
              {/* Conversation List */}
              <div className="w-72 border-r border-border overflow-y-auto">
                {studentConversations.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  studentConversations.map((conv) => (
                    <div
                      key={conv.student_id}
                      className={`group flex items-center justify-between p-4 border-b border-border hover:bg-secondary transition-colors cursor-pointer ${selectedStudentId === conv.student_id ? "bg-secondary" : ""}`}
                      onClick={() => setSelectedStudentId(conv.student_id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate">{conv.student_name}</p>
                        <p className="text-xs text-muted-foreground">{conv.messages.length} messages</p>
                      </div>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={async (e) => {
                          e.stopPropagation();

                          // Delete all messages for this student
                          const { error } = await supabase
                            .from("feedback")
                            .delete()
                            .eq("student_id", conv.student_id);

                          if (error) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive"
                            });
                          } else {
                            toast({
                              title: "Conversation Deleted",
                              description: `All messages with ${conv.student_name} have been removed.`,
                            });

                            // Force clear selected conversation
                            setSelectedStudentId(null);

                            // Refresh data
                            loadData();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedStudentId ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {studentConversations.find(c => c.student_id === selectedStudentId)?.messages.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                            <p className="text-xs font-semibold mb-1">
                              {msg.sender_role === "admin" ? "Admin" : msg.student_name}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAdminReply} className="border-t border-border p-4 flex gap-2">
                      <Input 
                        placeholder="Type a reply..." 
                        value={adminReply} 
                        onChange={(e) => setAdminReply(e.target.value)} 
                        className="flex-1" 
                      />
                      <Button type="submit">Send</Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Select a conversation to view messages.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
