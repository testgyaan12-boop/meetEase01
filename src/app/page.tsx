import Link from "next/link"
import { ArrowRight, ShieldCheck, Zap, Bell, CheckCircle2, Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  const testimonials = [
    {
      name: "Dr. Ananya Iyer",
      role: "Psychologist",
      text: "MeetEase has completely transformed how I handle patient consultations. The payment verification is a lifesaver.",
      avatar: "https://picsum.photos/seed/doc1/100/100"
    },
    {
      name: "Rahul Verma",
      role: "Tech Consultant",
      text: "The AI description tool helps me set professional agendas in seconds. Highly recommend for any freelancer.",
      avatar: "https://picsum.photos/seed/doc2/100/100"
    },
    {
      name: "Sarah Jenkins",
      role: "Career Coach",
      text: "Finally, a scheduling tool that feels premium and handles the messy logistics of booking and payments.",
      avatar: "https://picsum.photos/seed/doc3/100/100"
    },
    {
      name: "Marc Thompson",
      role: "Financial Advisor",
      text: "The real-time notifications ensure I never miss a confirmed session. It's my daily workspace now.",
      avatar: "https://picsum.photos/seed/doc4/100/100"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-headline font-bold text-primary">MeetEase</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary leading-tight">
              Professional Meetings, <br />
              <span className="text-accent">Simplified.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Book consultations, verify payments, and manage your schedule effortlessly. The all-in-one platform for modern professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 font-bold group shadow-xl shadow-primary/20">
                  Book Your Session <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 font-bold">
                View Pricing
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-muted overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i}/100/100`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Joined by <span className="text-foreground font-bold">2,000+</span> professionals
              </p>
            </div>
          </div>
          
          <div className="relative lg:block animate-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2rem] blur-3xl" />
            <div className="relative bg-white p-2 rounded-[2rem] shadow-2xl border border-white/50 backdrop-blur-sm">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/900" 
                alt="MeetEase Dashboard Preview" 
                className="rounded-[1.5rem] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">What our community says</h2>
              <p className="text-muted-foreground font-medium">Trusted by experts across the globe.</p>
            </div>
            <div className="hidden md:flex gap-2">
              <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary" /> 4.9/5 Rating
              </p>
            </div>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="border-none shadow-xl rounded-3xl h-full bg-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-8 space-y-6 flex flex-col h-full">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Quote className="h-5 w-5 fill-primary" />
                      </div>
                      <p className="text-lg font-medium text-foreground italic flex-1">"{t.text}"</p>
                      <div className="flex items-center gap-4 pt-4 border-t">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/10">
                          <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">{t.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-3 mt-8">
              <CarouselPrevious className="relative inset-0 translate-y-0 h-12 w-12 rounded-xl border-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg" />
              <CarouselNext className="relative inset-0 translate-y-0 h-12 w-12 rounded-xl border-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold">Everything you need to grow</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our feature-rich platform handles the logistics so you can focus on the conversation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "AI-Powered Descriptions", icon: Zap, desc: "Generate professional meeting summaries in seconds with our embedded GenAI tool." },
              { title: "Secure Payment Verification", icon: ShieldCheck, desc: "Built-in proof-of-payment system ensures secure and verified bookings every time." },
              { title: "Real-time Notifications", icon: Bell, desc: "Get notified instantly when meetings are confirmed or updated across all your devices." },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-background hover:bg-primary/5 transition-colors group">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-lg font-headline font-bold text-primary">MeetEase</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
            <Link href="#" className="hover:text-primary">Privacy</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
            <Link href="#" className="hover:text-primary">Support</Link>
            <Link href="#" className="hover:text-primary">Contact</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 MeetEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
