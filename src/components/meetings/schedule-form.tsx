"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle, Info, Calendar, Mail, Phone, User as UserIcon } from "lucide-react"
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
        message: `${values.clientName} (${values.clientEmail}) booked a session on ${new Date(values.slotStartTime).toLocaleString()}`,
        type: "new_booking",  // Add this
        isRead: false,
        createdAt: new Date().toISOString()
        // title: "New Booking Request",
        // message: `${values.clientName} booked a session.`,
        // isRead: false,
        // createdAt: new Date().toISOString()
      })

      toast({
        title: "Booking Requested",
        description: "Your session request has been submitted for verification.",
      })

      router.push("/dashboard/history")
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to upload. Try a smaller image.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-12 border-b">
          <CardHeader className="p-0 space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Calendar className="h-6 w-6" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-primary tracking-tight">Schedule Consultation</CardTitle>
            </div>
            <CardDescription className="text-base font-medium">Complete the form below to book your expert session.</CardDescription>
          </CardHeader>
        </div>

        <CardContent className="p-8 md:p-14">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">01</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Contact Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <UserIcon className="h-3 w-3" /> Full Name
                  </label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    {...form.register("clientName")}
                    className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner px-6 font-medium"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-[10px] text-destructive font-bold px-1">{form.formState.errors.clientName.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Email Address
                  </label>
                  <Input
                    placeholder="name@email.com"
                    {...form.register("clientEmail")}
                    className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner px-6 font-medium"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-[10px] text-destructive font-bold px-1">{form.formState.errors.clientEmail.message as string}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Mobile Number
                  </label>
                  <Input
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    {...form.register("clientMobile")}
                    className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner px-6 font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium px-1 flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" /> 10-digit Indian number starting with 6-9
                  </p>
                  {form.formState.errors.clientMobile && (
                    <p className="text-[10px] text-destructive font-bold px-1">{form.formState.errors.clientMobile.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">02</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Meeting Agenda</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Agenda / Description</label>
                <Textarea
                  placeholder="What would you like to discuss? Be specific for better results."
                  {...form.register("description")}
                  className="min-h-[150px] rounded-3xl bg-muted/30 border-none shadow-inner p-6 text-base font-medium"
                />
                {form.formState.errors.description && (
                  <p className="text-[10px] text-destructive font-bold px-1">{form.formState.errors.description.message as string}</p>
                )}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">03</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Select Time Slot</h3>
              </div>
              <SlotPicker
                onSelect={(id, start, end) => {
                  form.setValue("availableSlotId", id, { shouldValidate: true })
                  form.setValue("slotStartTime", start)
                  form.setValue("slotEndTime", end)
                }}
              />
              {form.formState.errors.availableSlotId && (
                <p className="text-[10px] text-destructive font-bold px-1 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Please select a time slot
                </p>
              )}
            </section>

            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">04</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60">Payment Proof</h3>
              </div>
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
                />
                <div className={cn(
                  "flex flex-col items-center justify-center border-4 border-dashed rounded-[2.5rem] p-12 transition-all",
                  form.watch("paymentProof")?.[0] ? "border-primary bg-primary/5" : "border-primary/10 group-hover:border-primary/30"
                )}>
                  {form.watch("paymentProof")?.[0] ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-primary mb-4 animate-in zoom-in" />
                      <p className="text-lg font-bold text-primary text-center truncate w-full px-4">{form.watch("paymentProof")?.[0].name}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Document attached. Click to replace.</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-muted-foreground/30 mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-lg font-bold text-muted-foreground">Upload Payment Receipt</p>
                      <p className="text-xs font-medium text-muted-foreground/60 mt-1">Actual file required for verification.</p>
                    </>
                  )}
                </div>
              </div>
              {form.formState.errors.paymentProof && (
                <p className="text-[10px] text-destructive font-bold px-1">{form.formState.errors.paymentProof.message as string}</p>
              )}
            </section>

            <Button
              type="submit"
              className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-xl shadow-primary/20 rounded-3xl transition-all active:scale-95"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                "BOOK CONSULTATION SESSION"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}