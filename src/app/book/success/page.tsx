"use client"

import { CheckCircle2, ArrowRight, ShieldCheck, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 md:h-24 md:w-24 bg-primary rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-primary/20">
            <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12" />
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tight">Request Sent!</h1>
          <p className="text-muted-foreground font-medium">Your consultation request is being verified.</p>
        </div>

        <Card className="border-none shadow-xl bg-card overflow-hidden rounded-[2rem]">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-xl mx-auto flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">What happens next?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our team will verify your payment receipt within 24 hours. Once confirmed, you'll receive an email invitation with the meeting link.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/">
                <Button className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">
                  Return Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full h-12 text-primary font-bold rounded-xl group">
                  Create Account to Track <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 opacity-50">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-xs font-headline font-bold text-primary">Office VS Me</span>
        </div>
      </div>
    </div>
  )
}