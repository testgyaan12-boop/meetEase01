
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle, Info, Mail, Phone, User as UserIcon, QrCode, Copy, Check, Briefcase } from "lucide-react"
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

const formSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientMobile: z.string()
    .length(10, "Mobile number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian number starting with 6-9"),
  description: z.string().min(10, "Please provide a clear meeting agenda (min 10 chars)"),
  availableSlotId: z.string().min(1, "Please select a time slot"),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  paymentProof: z.any().refine((files) => files?.length > 0, "Payment proof is required"),
})

export function ScheduleMeetingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [upiCopied, setUpiCopied] = useState(false)
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
      clientMobile: "",
      description: "",
      availableSlotId: "",
      slotStartTime: "",
      slotEndTime: "",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return
    setIsSubmitting(true)

    try {
      let paymentProofUrl = ""
      const file = values.paymentProof?.[0]
      if (file) {
        paymentProofUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

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

      addDocumentNonBlocking(collection(firestore, "admin_notifications"), {
        title: "📅 New Booking Request",
        message: `${values.clientName} booked a session on ${new Date(values.slotStartTime).toLocaleString()}`,
        type: "new_booking",
        isRead: false,
        createdAt: new Date().toISOString()
      })

      toast({ title: "Booking Requested", description: "Verification in progress." })
      router.push("/dashboard/history")
    } catch (error) {
      toast({ title: "Error", description: "Submission failed. Please check your data.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full max-w-full overflow-hidden">
      <Card className="glass rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border-none shadow-2xl w-full">
        <CardContent className="p-6 md:p-14">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-5xl font-headline font-bold text-primary tracking-tight">Confirm Booking</h2>
            <p className="text-[11px] md:text-lg font-medium text-muted-foreground max-w-lg mx-auto leading-relaxed">Secure your slot in four simple steps and start your professional journey.</p>
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" /> Mobile Number
                  </label>
                  <Input
                    placeholder="10 digit Indian number"
                    maxLength={10}
                    {...form.register("clientMobile")}
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-muted/40 border-none shadow-inner px-4 md:px-6 text-sm md:text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  <div className="flex items-center justify-between px-1 md:px-2">
                    <p className="text-[8px] md:text-[11px] text-muted-foreground font-bold flex items-center gap-1 mt-1 italic">
                      <Info className="h-2.5 w-2.5" /> Exactly 10 digits starting with 6-9
                    </p>
                    {form.formState.errors.clientMobile && (
                      <p className="text-[9px] md:text-xs text-destructive font-bold mt-1">{form.formState.errors.clientMobile.message as string}</p>
                    )}
                  </div>
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
                <label className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1">Brief Description</label>
                <Textarea
                  placeholder="Describe your requirements or questions..."
                  {...form.register("description")}
                  className="min-h-[100px] md:min-h-[160px] rounded-xl md:rounded-[2rem] bg-muted/40 border-none shadow-inner p-4 md:p-8 text-sm md:text-base font-bold text-foreground resize-none leading-relaxed"
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
    </div>
  )
}
