"use client"

import Link from "next/link"
import { useState } from "react"
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Quote, 
  Briefcase, 
  UserCheck, 
  TrendingUp,
  Heart,
  Copy,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const upiId = "meetease@upi"

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    toast({
      title: "UPI Copied",
      description: "The support UPI ID has been copied to your clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const testimonials = [
    {
      name: "Aditya Sharma",
      role: "Marketing Manager",
      text: "The salary negotiation strategy I learned here literally increased my offer by 30%. Decoding corporate reality is a game changer.",
      avatar: "https://picsum.photos/seed/doc1/100/100"
    },
    {
      name: "Sneha Kapur",
      role: "Software Engineer",
      text: "Finally, someone who explains what HR is actually looking for. My CV fix helped me land 3 interviews in a week.",
      avatar: "https://picsum.photos/seed/doc2/100/100"
    },
    {
      name: "Vikram Malhotra",
      role: "Operations Lead",
      text: "The one-on-one consultation for background verification gave me the confidence I needed to switch jobs smoothly.",
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
            <span className="text-xl font-headline font-bold text-primary">Office VS Me</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold">Book Consultation</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary leading-tight">
              Decoding <br />
              <span className="text-accent">Corporate Reality.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Ex-HR insights for your CV, Job Strategy, and Career Fixes. Skip the corporate noise and get the professional strategy you need to win.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 font-bold group shadow-xl shadow-primary/20">
                  Fix Your Career <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 font-bold">
                View Strategies
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-muted overflow-hidden">
                    <img src={`https://picsum.photos/seed/career${i}/100/100`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Trusted by <span className="text-foreground font-bold">14.7K+</span> professionals
              </p>
            </div>
          </div>
          
          <div className="relative lg:block animate-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2rem] blur-3xl" />
            <div className="relative bg-white p-2 rounded-[2rem] shadow-2xl border border-white/50 backdrop-blur-sm">
              <img 
                src="https://picsum.photos/seed/office/1200/900" 
                alt="Office VS Me Strategy Dashboard" 
                className="rounded-[1.5rem] w-full"
                data-ai-hint="office meeting"
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
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Success Stories</h2>
              <p className="text-muted-foreground font-medium">From corporate blockers to dream careers.</p>
            </div>
            <div className="hidden md:flex gap-2">
              <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary" /> 4.9/5 Success Rate
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
            <h2 className="text-3xl md:text-5xl font-headline font-bold">Your Career Toolkit</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get the strategy you need to navigate background verifications, salary negotiations, and HR reality.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "CV & Job Strategy", icon: UserCheck, desc: "Professional CV fixes and LinkedIn optimization to ensure you actually get seen by recruiters." },
              { title: "Salary Negotiation", icon: TrendingUp, desc: "Proven scripts and strategies to handle the 'What are your expectations?' talk and win." },
              { title: "Corporate reality check", icon: Briefcase, desc: "One-on-one sessions to decode your office politics, management issues, and career blockers." },
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
            <span className="text-lg font-headline font-bold text-primary">Office VS Me</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
            <Link href="#" className="hover:text-primary">Privacy</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
            <button 
              onClick={() => setIsSupportOpen(true)}
              className="hover:text-primary transition-colors focus:outline-none"
            >
              Support
            </button>
            <Link href="#" className="hover:text-primary">Consultations</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Office VS Me. All rights reserved.</p>
        </div>
      </footer>

      {/* Support Dialog */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-8 md:p-10 text-center space-y-6">
            <DialogHeader className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase flex items-center gap-2 mx-auto">
                  <Heart className="h-3 w-3 fill-primary" /> Show your love
                </Badge>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">Support Our Mission</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground">
                  Your contributions help us keep decoding corporate reality for everyone.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="relative group mx-auto w-fit">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white dark:bg-card p-4 rounded-2xl shadow-xl">
                <img 
                  src="https://picsum.photos/seed/qr99/400/400" 
                  alt="Support QR" 
                  className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-lg"
                  data-ai-hint="qr code"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Support via UPI</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-12 flex-1 max-w-[240px] px-6 rounded-xl bg-muted/40 border border-primary/10 flex items-center justify-center font-bold text-sm text-primary shadow-sm">
                    {upiId}
                  </div>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleCopyUpi}
                    className="h-12 w-12 rounded-xl border-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl font-bold border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                onClick={() => setIsSupportOpen(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
