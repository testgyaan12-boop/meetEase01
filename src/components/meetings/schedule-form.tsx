"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Upload, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Info, 
  Mail, 
  User as UserIcon, 
  Copy, 
  Check, 
  Briefcase,
  FileText,
  ShieldAlert,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { SlotPicker } from "./slot-picker"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

const formSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email address"),
  description: z.string().min(10, "Please provide a clear meeting agenda (min 10 chars)"),
  availableSlotId: z.string().min(1, "Please select a time slot"),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  paymentProof: z.any().refine((files) => files?.length > 0, "Payment proof is required"),
  consent: z.boolean().refine(val => val === true, "You must agree to the terms to proceed"),
})

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export function ScheduleMeetingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [upiCopied, setUpiCopied] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const firestore = useFirestore()

  const upiId = "meetease@upi"

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: user?.email || "",
      description: "",
      availableSlotId: "",
      slotStartTime: "",
      slotEndTime: "",
      consent: false,
    },
  })

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setUpiCopied(true)
    toast({
      title: "UPI Copied",
      description: "The UPI ID has been copied to your clipboard.",
    })
    setTimeout(() => setUpiCopied(false), 2000)
  }

  const onConfirmSubmission = async () => {
    if (!firestore) {
      toast({ title: "Service Error", description: "Firestore is not ready. Please refresh.", variant: "destructive" })
      return
    }
    
    setIsSubmitting(true)
    setIsConfirmOpen(false)
    const values = form.getValues()

    try {
      let paymentProofUrl = ""
      const file = values.paymentProof?.[0]
      
      if (file) {
        paymentProofUrl = await toBase64(file)
      }

      const meetingData = {
        userId: user?.uid || "guest",
        clientEmail: values.clientEmail,
        clientName: values.clientName,
        description: values.description,
        availableSlotId: values.availableSlotId,
        slotStartTime: values.slotStartTime,
        slotEndTime: values.slotEndTime,
        paymentProofUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await addDocumentNonBlocking(collection(firestore, "meetings"), meetingData)

      await addDocumentNonBlocking(collection(firestore, "admin_notifications"), {
        title: "📅 New Booking Request",
        message: `${values.clientName} booked a session on ${new Date(values.slotStartTime).toLocaleString()}`,
        type: "new_booking",
        isRead: false,
        createdAt: new Date().toISOString()
      })

      toast({ title: "Booking Requested", description: "Your verification is in progress." })
      
      if (user) {
        router.push("/dashboard/history")
      } else {
        router.push("/book/success")
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({ 
        title: "Submission Failed", 
        description: error.message || "Something went wrong.", 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsConfirmOpen(true)
  }

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full max-w-full overflow-hidden">
      <Card className="glass rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border-none shadow-2xl w-full">
        <CardContent className="p-6 md:p-14">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-5xl font-headline font-bold text-primary tracking-tight">Schedule Consultation</h2>
            <p className="text-[11px] md:text-lg font-medium text-muted-foreground max-w-lg mx-auto leading-relaxed">Secure your professional strategy session in four simple steps.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 md:space-y-16">

            {/* STEP 1: CONTACT */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-8 w-8 md:h-12 w-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm md:text-xl shadow-xl shadow-primary/20 shrink-0">01</div>
                <div>
                  <h3 className="text-base md:text-xl font-headline font-bold text-foreground">Contact Details</h3>
                  <p className="text-[9px] md:text-sm font-medium text-muted-foreground">Information for follow-up and verification.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <UserIcon className="h-3 w-3 md:h-3.5 md:w-3.5" /> Full Name
                  </label>
                  <Input
                    placeholder="Rahul Sharma"
                    {...form.register("clientName")}
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-muted/40 border-none shadow-inner px-4 md:px-6 text-sm md:text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-[9px] md:text-xs text-destructive font-bold px-2">{form.formState.errors.clientName.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <Mail className="h-3 w-3 md:h-3.5 md:w-3.5" /> Email
                  </label>
                  <Input
                    placeholder="rahul@example.com"
                    {...form.register("clientEmail")}
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-muted/40 border-none shadow-inner px-4 md:px-6 text-sm md:text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-[9px] md:text-xs text-destructive font-bold px-2">{form.formState.errors.clientEmail.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            {/* STEP 2: AGENDA */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-8 w-8 md:h-12 w-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm md:text-xl shadow-xl shadow-primary/20 shrink-0">02</div>
                <div>
                  <h3 className="text-base md:text-xl font-headline font-bold text-foreground">Consultation Agenda</h3>
                  <p className="text-[9px] md:text-sm font-medium text-muted-foreground">What would you like to achieve in this session?</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1">Professional Agenda</label>
                <Textarea
                  placeholder="Tell us more about your career goals or specific challenges..."
                  {...form.register("description")}
                  className="min-h-[120px] md:min-h-[160px] rounded-xl md:rounded-[2rem] bg-muted/40 border-none shadow-inner p-4 md:p-8 text-sm md:text-base font-bold text-foreground resize-none leading-relaxed"
                />
                {form.formState.errors.description && (
                  <p className="text-[9px] md:text-xs text-destructive font-bold px-2">{form.formState.errors.description.message as string}</p>
                )}
              </div>
            </section>

            {/* STEP 3: SLOT */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-8 w-8 md:h-12 w-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm md:text-xl shadow-xl shadow-primary/20 shrink-0">03</div>
                <div>
                  <h3 className="text-base md:text-xl font-headline font-bold text-foreground">Select Schedule</h3>
                  <p className="text-[9px] md:text-sm font-medium text-muted-foreground">Choose a window that fits your availability.</p>
                </div>
              </div>
              <div className="w-full">
                <SlotPicker
                  onSelect={(id, start, end) => {
                    form.setValue("availableSlotId", id, { shouldValidate: true })
                    form.setValue("slotStartTime", start)
                    form.setValue("slotEndTime", end)
                  }}
                />
                {form.formState.errors.availableSlotId && (
                  <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-[8px] md:text-sm font-black uppercase tracking-wider">Please select a time slot to continue</p>
                  </div>
                )}
              </div>
            </section>

            {/* SESSION PAYMENT INSTRUCTIONS */}
            <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-700">
              <CardContent className="p-6 md:p-10 flex flex-col items-center text-center space-y-6">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase flex items-center gap-2 mx-auto">
                    <Briefcase className="h-3 w-3" /> Professional Fee
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-headline font-bold text-primary">Session Payment</h3>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground max-w-xs mx-auto">
                    Please scan the QR code or use the UPI ID to pay for your selected consultation session.
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25"></div>
                  <div className="relative bg-white dark:bg-card p-3 rounded-2xl shadow-xl">
                    <img 
                      src="https://picsum.photos/seed/qr99/400/400" 
                      alt="Payment QR" 
                      className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-lg"
                      data-ai-hint="qr code"
                    />
                  </div>
                </div>

                <div className="w-full max-w-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 rounded-xl bg-background border border-primary/10 flex items-center justify-center font-bold text-sm md:text-base text-primary shadow-sm">
                      {upiId}
                    </div>
                    <Button 
                      type="button"
                      size="icon" 
                      variant="outline" 
                      onClick={handleCopyUpi}
                      className="h-12 w-12 rounded-xl border-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                    >
                      {upiCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic">Payment is required to confirm your booking.</p>
                </div>
              </CardContent>
            </Card>

            {/* STEP 4: PAYMENT VERIFICATION */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-8 w-8 md:h-12 w-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm md:text-xl shadow-xl shadow-primary/20 shrink-0">04</div>
                <div>
                  <h3 className="text-base md:text-xl font-headline font-bold text-foreground">Payment Verification</h3>
                  <p className="text-[9px] md:text-sm font-medium text-muted-foreground">Upload your transaction screenshot or receipt.</p>
                </div>
              </div>
              <div className="relative group cursor-pointer w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
                />
                <div className={cn(
                  "flex flex-col items-center justify-center border-4 border-dashed rounded-2xl md:rounded-[3rem] p-6 md:p-12 transition-all duration-500 bg-muted/20 w-full",
                  form.watch("paymentProof")?.[0] 
                    ? "border-primary bg-primary/5 ring-4 md:ring-8 ring-primary/5" 
                    : "border-primary/10 hover:border-primary/40 group-hover:bg-primary/5"
                )}>
                  {form.watch("paymentProof")?.[0] ? (
                    <div className="text-center space-y-3">
                      <div className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-3xl bg-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-in zoom-in">
                        <CheckCircle2 className="h-6 w-6 md:h-10 md:w-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs md:text-lg font-black text-primary truncate max-w-[140px] md:max-w-[200px] mx-auto">{form.watch("paymentProof")?.[0].name}</p>
                        <p className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-60">Tap to replace file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-3xl bg-muted/40 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-6 w-6 md:h-10 md:w-10 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-xs md:text-lg font-black text-foreground opacity-60">Upload Receipt</p>
                        <p className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Actual transaction proof</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {form.formState.errors.paymentProof && (
                <p className="text-[9px] md:text-xs text-destructive font-bold px-2 text-center">{form.formState.errors.paymentProof.message as string}</p>
              )}
            </section>

            {/* CONSENT CHECKBOX */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <Checkbox 
                  id="consent" 
                  checked={form.watch("consent")}
                  onCheckedChange={(checked) => form.setValue("consent", !!checked, { shouldValidate: true })}
                  className="mt-1 data-[state=checked]:bg-primary"
                />
                <label htmlFor="consent" className="text-xs md:text-sm font-medium text-foreground/80 leading-relaxed cursor-pointer select-none">
                  I agree to the{" "}
                  <button 
                    type="button" 
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-primary font-bold hover:underline"
                  >
                    privacy policy
                  </button>{" "}
                  and{" "}
                  <button 
                    type="button" 
                    onClick={() => setIsTermsOpen(true)}
                    className="text-primary font-bold hover:underline"
                  >
                    terms
                  </button>{" "}
                  for this consultation.
                </label>
              </div>
              {form.formState.errors.consent && (
                <p className="text-[10px] md:text-xs text-destructive font-bold px-2">{form.formState.errors.consent.message as string}</p>
              )}
            </div>

            <div className="pt-2 md:pt-8 w-full">
              <Button
                type="submit"
                className="w-full h-14 md:h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base md:text-2xl shadow-2xl shadow-primary/30 rounded-xl md:rounded-[2rem] transition-all active:scale-95 group relative overflow-hidden"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2 md:gap-4">
                    SUBMIT REQUEST
                    <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-8 md:p-10 space-y-6">
            <DialogHeader className="text-center">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 mx-auto">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">Verify Details</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Please double check your agenda and payment proof before final submission.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-primary/5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Schedule</p>
                <p className="text-sm font-bold text-foreground">
                  {form.watch("slotStartTime") ? new Date(form.watch("slotStartTime")).toLocaleString() : 'Not selected'}
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold leading-tight">Confirmed sessions are non-refundable for no-shows.</p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-xl font-bold border-none bg-muted text-muted-foreground"
                onClick={() => setIsConfirmOpen(false)}
              >
                Go Back
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20"
                onClick={onConfirmSubmission}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Send"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-8 md:p-10 space-y-6">
            <DialogHeader className="text-left">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">Privacy Policy</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                For Office VS Me Consultation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm md:text-base text-foreground/80 leading-relaxed font-medium">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>Your name, email, and phone number are collected only to schedule and confirm consultation sessions.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>Payment proof images are stored temporarily for verification and deleted after 30 days.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>Your data is not shared with any third party.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>For data removal, contact: <span className="font-bold text-primary">officevsme@gmail.com</span></p>
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl font-bold bg-primary text-white" onClick={() => setIsPrivacyOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-8 md:p-10 space-y-6">
            <DialogHeader className="text-left">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">Service Terms</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Agreement for professional consultations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Full payment required to confirm booking", icon: "✅" },
                { label: "No refund for no-shows", icon: "❌" },
                { label: "Reschedule allowed 12 hours before session", icon: "🔄" },
                { label: "Contact: officevsme@gmail.com for queries", icon: "📧" }
              ].map((term, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-primary/5">
                  <span className="text-xl shrink-0">{term.icon}</span>
                  <p className="text-sm md:text-base font-bold text-foreground/80">{term.label}</p>
                </div>
              ))}
            </div>
            <Button className="w-full h-12 rounded-xl font-bold bg-primary text-white" onClick={() => setIsTermsOpen(false)}>
              I Agree
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}