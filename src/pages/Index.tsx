/**
 * Landing Page (Index)
 * The public-facing homepage of MIMS.
 * Contains: Header, Hero slideshow, Ticker, About, Services, Announcements, Footer
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Heart, Pill, ClipboardList, ShieldCheck, Activity } from "lucide-react";
import slide1 from "@/assets/slide1.jpg";
import slide2 from "@/assets/slide2.jpg";
import slide3 from "@/assets/slide3.jpg";
import logo from "@/assets/logo.webp";

/* Slideshow image data */
const slides = [
  { src: slide1, alt: "Modern school clinic interior", caption: "State-of-the-Art School Clinic" },
  { src: slide2, alt: "Nurse attending to student", caption: "Caring for Every Student" },
  { src: slide3, alt: "Medical records and stethoscope", caption: "Organized Health Records" },
];

/* Clinic services data */
const services = [
  { icon: Stethoscope, title: "General Checkup", desc: "Routine health assessments for all students." },
  { icon: Heart, title: "First Aid", desc: "Immediate care for injuries and emergencies." },
  { icon: Pill, title: "Medicine Dispensing", desc: "Over-the-counter medication for common ailments." },
  { icon: ClipboardList, title: "Health Records", desc: "Secure digital records for every student." },
  { icon: ShieldCheck, title: "Health Counseling", desc: "Guidance on nutrition, hygiene, and wellness." },
  { icon: Activity, title: "BMI Monitoring", desc: "Regular body mass index tracking and advice." },
];

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  /* Load announcements from database */
  useEffect(() => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data);
    });
  }, []);

  /* Auto-advance slideshow every 8 seconds */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  /* Smooth scroll to a section by ID */
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HEADER ============ */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between py-3 px-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="AAIS Logo" className="w-10 h-10 rounded-full" />
            <h1 className="text-xl font-bold text-primary-foreground">
              MIMS <span className="text-accent font-normal text-sm">School Clinic</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => scrollTo("services")}
              className="text-primary-foreground hover:text-accent transition-colors text-sm font-medium hidden sm:block"
            >
              Services
            </button>
            <button
              onClick={() => scrollTo("announcements")}
              className="text-primary-foreground hover:text-accent transition-colors text-sm font-medium hidden sm:block"
            >
              Announcements
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-accent text-accent-foreground px-5 py-2 rounded-md text-sm font-semibold hover:bg-clinic-gold-hover transition-colors"
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* ============ ANNOUNCEMENTS TICKER ============ */}
      {announcements.length > 0 && (
        <div className="bg-accent overflow-hidden py-2">
          <div className="ticker-animate whitespace-nowrap">
            {announcements.map((a, i) => (
              <span key={a.id} className="text-accent-foreground text-sm font-medium mx-8">
                📢 {a.title ? `${a.title}: ` : ""}{a.message}
                {i < announcements.length - 1 && " • "}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ============ HERO SLIDESHOW ============ */}
      <section className="relative w-full h-[500px] overflow-hidden bg-primary">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img src={slide.src} alt={slide.alt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground text-center slide-fade-in">
                {slide.caption}
              </h2>
            </div>
          </div>
        ))}

        {/* Slide indicator dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentSlide ? "bg-accent" : "bg-primary-foreground/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ============ ABOUT CLINIC ============ */}
      <section className="py-20 bg-secondary" id="about">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-secondary-foreground text-center mb-4">
            About Our Clinic
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-8 rounded-full" />
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              The Army's Angels Integrated School Clinic is dedicated to providing quality healthcare
              services to all students. Our medical team ensures a safe and healthy environment through
              regular checkups, emergency care, and comprehensive health record management.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We leverage the Medical Information Management System (MIMS) to streamline
              appointments, maintain accurate patient records, and deliver prompt medical
              attention whenever our students need it.
            </p>
          </div>
        </div>
      </section>

      {/* ============ CLINIC SERVICES ============ */}
      <section className="py-20 bg-background" id="services">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Clinic Services
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-12 rounded-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ ANNOUNCEMENTS ============ */}
      <section className="py-20 bg-secondary" id="announcements">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-secondary-foreground text-center mb-4">
            Announcements
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-8 rounded-full" />
          <div className="max-w-2xl mx-auto space-y-4">
            {announcements.length === 0 ? (
              <p className="text-center text-muted-foreground">No announcements at this time.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="bg-card rounded-lg border border-border p-5">
                  <p className="text-sm text-accent font-semibold mb-1">
                    {new Date(a.created_at).toLocaleDateString()}
                    {a.title && ` — ${a.title}`}
                  </p>
                  <p className="text-card-foreground">{a.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-primary py-8">
        <div className="container mx-auto px-6 text-center">
          <img src={logo} alt="AAIS Logo" className="w-12 h-12 rounded-full mx-auto mb-3" />
          <p className="text-primary-foreground/70 text-sm">
            © 2026 Army's Angels Integrated School — Medical Information Management System (MIMS). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
