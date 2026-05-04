
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle, Info, Mail, Phone, User as UserIcon, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit number starting with 6-9"),
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
      toast({ title: "Error", description: "Try again with a smaller image.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
        <CardContent className="p-8 md:p-14">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight">Confirm Booking</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-lg mx-auto leading-relaxed">Secure your slot in four simple steps and start your professional journey.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">

            {/* STEP 1: CONTACT */}
            <section className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-xl shadow-primary/20">01</div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground">Contact Details</h3>
                  <p className="text-sm font-medium text-muted-foreground">Information for follow-up and verification.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5" /> Full Name
                  </label>
                  <Input
                    placeholder="Rahul Sharma"
                    {...form.register("clientName")}
                    className="h-14 rounded-2xl bg-muted/40 border-none shadow-inner px-6 text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-xs text-destructive font-bold px-2">{form.formState.errors.clientName.message as string}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </label>
                  <Input
                    placeholder="rahul@example.com"
                    {...form.register("clientEmail")}
                    className="h-14 rounded-2xl bg-muted/40 border-none shadow-inner px-6 text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-xs text-destructive font-bold px-2">{form.formState.errors.clientEmail.message as string}</p>
                  )}
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Mobile Number
                  </label>
                  <Input
                    placeholder="Enter 10 digit number"
                    maxLength={10}
                    {...form.register("clientMobile")}
                    className="h-14 rounded-2xl bg-muted/40 border-none shadow-inner px-6 text-base font-bold text-foreground placeholder:text-muted-foreground/40"
                  />
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-1.5 mt-1.5 italic">
                      <Info className="h-3 w-3" /> Valid 10-digit number (starts 6-9)
                    </p>
                    {form.formState.errors.clientMobile && (
                      <p className="text-xs text-destructive font-bold mt-1.5">{form.formState.errors.clientMobile.message as string}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2: AGENDA */}
            <section className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-xl shadow-primary/20">02</div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground">Consultation Agenda</h3>
                  <p className="text-sm font-medium text-muted-foreground">What would you like to achieve in this session?</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-primary/70 ml-1">Brief Description</label>
                <Textarea
                  placeholder="Describe your requirements or questions..."
                  {...form.register("description")}
                  className="min-h-[160px] rounded-[2rem] bg-muted/40 border-none shadow-inner p-8 text-base font-bold text-foreground resize-none leading-relaxed"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive font-bold px-4">{form.formState.errors.description.message as string}</p>
                )}
              </div>
            </section>

            {/* STEP 3: SLOT */}
            <section className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-xl shadow-primary/20">03</div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground">Select Schedule</h3>
                  <p className="text-sm font-medium text-muted-foreground">Choose a window that fits your availability.</p>
                </div>
              </div>
              <div className="p-1">
                <SlotPicker
                  onSelect={(id, start, end) => {
                    form.setValue("availableSlotId", id, { shouldValidate: true })
                    form.setValue("slotStartTime", start)
                    form.setValue("slotEndTime", end)
                  }}
                />
                {form.formState.errors.availableSlotId && (
                  <div className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive animate-bounce">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-black uppercase tracking-wider">Please select a time slot to continue</p>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 4: PAYMENT */}
            <section className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-xl shadow-primary/20">04</div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground">Payment Verification</h3>
                  <p className="text-sm font-medium text-muted-foreground">Upload your transaction screenshot or receipt.</p>
                </div>
              </div>
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
                />
                <div className={cn(
                  "flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] p-12 transition-all duration-500 bg-muted/20",
                  form.watch("paymentProof")?.[0] 
                    ? "border-primary bg-primary/5 ring-8 ring-primary/5" 
                    : "border-primary/10 hover:border-primary/40 group-hover:bg-primary/5"
                )}>
                  {form.watch("paymentProof")?.[0] ? (
                    <div className="text-center space-y-4">
                      <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-in zoom-in">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-primary truncate max-w-[200px] mx-auto">{form.watch("paymentProof")?.[0].name}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-60">Tap to replace file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="h-20 w-20 rounded-3xl bg-muted/40 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground opacity-60">Upload Receipt</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Images only (max 2MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {form.formState.errors.paymentProof && (
                <p className="text-xs text-destructive font-bold px-6 text-center">{form.formState.errors.paymentProof.message as string}</p>
              )}
            </section>

            <div className="pt-8">
              <Button
                type="submit"
                className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-2xl shadow-2xl shadow-primary/30 rounded-[2rem] transition-all active:scale-95 group relative overflow-hidden"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <div className="flex items-center gap-4">
                    SUBMIT REQUEST
                    <CheckCircle2 className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-opacity" />
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
