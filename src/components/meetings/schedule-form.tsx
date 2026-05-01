"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle, FileText, Phone, Mail, User, Info, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SlotPicker } from "./slot-picker"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"

const formSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientMobile: z.string()
    .length(10, "Mobile number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Must be a valid Indian mobile number starting with 6-9"),
  description: z.string().min(10, "Please provide a clear meeting agenda (min 10 chars)"),
  availableSlotId: z.string().min(1, "Please select a time slot"),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  paymentProof: z.any().refine((files) => files?.length > 0, "Payment proof is required"),
})

export function ScheduleMeetingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const firestore = useFirestore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: user?.email || "",
      clientMobile: "",
      description: "",
      availableSlotId: "",
      slotStartTime: "",
      slotEndTime: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return

    setIsSubmitting(true)
    
    // In a real app, we would upload the file to Firebase Storage here.
    const paymentProofUrl = "https://picsum.photos/seed/pay123/600/800"

    const meetingData = {
      userId: user.uid,
      clientEmail: values.clientEmail,
      clientName: values.clientName,
      clientMobile: values.clientMobile,
      description: values.description,
      availableSlotId: values.availableSlotId,
      slotStartTime: values.slotStartTime,
      slotEndTime: values.slotEndTime,
      paymentProofUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addDocumentNonBlocking(collection(firestore, "meetings"), meetingData)
    
    toast({
      title: "Booking Requested Successfully",
      description: "Our team will verify your payment and confirm the slot shortly.",
    })
    
    router.push("/dashboard/history")
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto border-none shadow-2xl">
        <CardContent className="pt-10 text-center space-y-6">
          <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="font-bold text-lg text-primary">Session expired. Please log in again.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl">Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-6 md:p-10 border-b border-primary/5">
          <CardHeader className="p-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <CardTitle className="text-2xl md:text-4xl font-headline font-bold text-primary tracking-tight">Schedule Consultation</CardTitle>
            </div>
            <CardDescription className="text-sm md:text-base font-medium text-muted-foreground/80">Secure your professional session by filling out the details below.</CardDescription>
          </CardHeader>
        </div>
        
        <CardContent className="p-6 md:p-12">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 md:space-y-12">
            
            {/* 1. Personal Details */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs md:text-sm">1</div>
                <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-primary/60">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <User className="h-3 w-3" /> Full Name
                  </label>
                  <Input 
                    placeholder="Enter your name" 
                    {...form.register("clientName")} 
                    className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/50 border-primary/10 focus:ring-4 focus:ring-primary/5 shadow-sm text-sm md:text-base font-medium px-4 md:px-6" 
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider">{form.formState.errors.clientName.message as string}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Email Address
                  </label>
                  <Input 
                    placeholder="you@example.com" 
                    {...form.register("clientEmail")} 
                    className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/50 border-primary/10 focus:ring-4 focus:ring-primary/5 shadow-sm text-sm md:text-base font-medium px-4 md:px-6" 
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider">{form.formState.errors.clientEmail.message as string}</p>
                  )}
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Mobile Number
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm md:text-base">+91</div>
                    <Input 
                      placeholder="e.g. 9876543210" 
                      maxLength={10}
                      type="tel"
                      {...form.register("clientMobile")} 
                      className="h-12 md:h-14 pl-14 rounded-xl md:rounded-2xl bg-white/50 border-primary/10 focus:ring-4 focus:ring-primary/5 shadow-sm text-sm md:text-base font-medium px-4 md:px-6" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium px-1 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Exactly 10 digits starting with 6, 7, 8, or 9
                  </p>
                  {form.formState.errors.clientMobile && (
                    <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider">{form.formState.errors.clientMobile.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Agenda */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs md:text-sm">2</div>
                <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-primary/60">Meeting Agenda</h3>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Describe your requirements
                </label>
                <Textarea 
                  placeholder="What would you like to discuss during this consultation?" 
                  {...form.register("description")} 
                  className="min-h-[120px] md:min-h-[160px] rounded-[1.5rem] md:rounded-[2rem] bg-white/50 border-primary/10 focus:ring-4 focus:ring-primary/5 shadow-sm p-4 md:p-6 text-sm md:text-base font-medium leading-relaxed" 
                />
                {form.formState.errors.description && (
                  <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider">{form.formState.errors.description.message as string}</p>
                )}
              </div>
            </section>

            {/* 3. Slot Selection */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs md:text-sm">3</div>
                <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-primary/60">Pick a Time</h3>
              </div>
              <div className="p-1">
                <SlotPicker 
                  onSelect={(id, start, end) => {
                    form.setValue("availableSlotId", id, { shouldValidate: true })
                    form.setValue("slotStartTime", start)
                    form.setValue("slotEndTime", end)
                  }} 
                />
              </div>
              {form.formState.errors.availableSlotId && (
                <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Please select a time slot above
                </p>
              )}
            </section>

            {/* 4. Payment */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs md:text-sm">4</div>
                <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-primary/60">Payment Verification</h3>
              </div>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
                />
                <div className={cn(
                  "flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 transition-all bg-white/30 backdrop-blur-md",
                  form.watch("paymentProof")?.[0] ? "border-primary bg-primary/5" : "border-primary/10 group-hover:border-primary/30"
                )}>
                  {form.watch("paymentProof")?.[0] ? (
                    <>
                      <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] bg-primary flex items-center justify-center text-white mb-4 md:mb-6 shadow-2xl shadow-primary/20 animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-8 w-8 md:h-12 md:w-12" />
                      </div>
                      <p className="text-base md:text-xl font-bold text-primary tracking-tight text-center truncate w-full px-4">{form.watch("paymentProof")?.[0].name}</p>
                      <p className="text-[10px] md:text-sm font-medium text-muted-foreground mt-2">Click to replace receipt</p>
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] bg-muted/50 flex items-center justify-center text-muted-foreground/40 mb-4 md:mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                        <Upload className="h-8 w-8 md:h-12 md:w-12" />
                      </div>
                      <p className="text-base md:text-xl font-bold text-primary/80 tracking-tight">Upload Payment Proof</p>
                      <p className="text-[10px] md:text-sm font-medium text-muted-foreground mt-2">PNG, JPG or PDF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
              {form.formState.errors.paymentProof && (
                <p className="text-[9px] md:text-[10px] text-destructive font-black px-1 uppercase tracking-wider">{form.formState.errors.paymentProof.message as string}</p>
              )}
            </section>

            <Button 
              type="submit" 
              className="w-full h-16 md:h-20 bg-primary hover:bg-primary/90 text-white font-black text-lg md:text-2xl shadow-[0_20px_50px_rgba(51,51,204,0.3)] rounded-2xl md:rounded-[2rem] transition-all group active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 md:h-8 md:w-8 animate-spin" />
                  CONFIRMING...
                </>
              ) : (
                <>
                  BOOK CONSULTATION
                  <FileText className="ml-3 h-6 w-6 md:h-8 md:w-8 opacity-50 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
