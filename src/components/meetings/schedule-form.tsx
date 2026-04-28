
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react"
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
  clientMobile: z.string().min(10, "Invalid mobile number"),
  description: z.string().min(10, "Please provide more details about the meeting agenda"),
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
    
    // In a real app, this would be a storage upload URL
    const paymentProofUrl = "https://picsum.photos/seed/pay123/600/800"

    const meetingData = {
      userId: user.uid,
      clientEmail: user.email || "",
      clientName: values.clientName,
      clientMobile: values.clientMobile,
      description: values.description,
      availableSlotId: values.availableSlotId,
      paymentProofUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addDocumentNonBlocking(collection(firestore, "meetings"), meetingData)
    
    toast({
      title: "Booking Requested",
      description: "We are verifying your payment details. Please check history for updates.",
    })
    
    router.push("/dashboard/history")
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="font-medium">Session expired. Please log in again to continue.</p>
          <Button onClick={() => router.push('/login')} className="w-full">Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <div className="bg-primary/5 p-8 border-b">
          <CardHeader className="p-0">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Schedule Consultation</CardTitle>
            <CardDescription className="text-base">Fill in the details below to secure your professional session.</CardDescription>
          </CardHeader>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80 ml-1">Full Name</label>
                  <Input placeholder="John Doe" {...form.register("clientName")} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary shadow-sm" />
                  {form.formState.errors.clientName && (
                    <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.clientName.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80 ml-1">Mobile Number</label>
                  <Input placeholder="+1 (555) 000-0000" {...form.register("clientMobile")} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary shadow-sm" />
                  {form.formState.errors.clientMobile && (
                    <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.clientMobile.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Meeting Agenda
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 ml-1">Description</label>
                <Textarea 
                  placeholder="What would you like to discuss?" 
                  {...form.register("description")}
                  className="min-h-[120px] rounded-2xl bg-white/50 border-primary/10 focus:ring-primary shadow-sm p-4 text-base"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive font-bold ml-1">{form.formState.errors.description.message as string}</p>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Availability Check
              </h3>
              <SlotPicker 
                onSelect={(id, start, end) => {
                  form.setValue("availableSlotId", id, { shouldValidate: true })
                  form.setValue("slotStartTime", start)
                  form.setValue("slotEndTime", end)
                }} 
              />
              {form.formState.errors.availableSlotId && (
                <p className="text-xs text-destructive font-bold ml-1 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Select a time slot above.
                </p>
              )}
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Payment Verification
              </h3>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
                />
                <div className={cn(
                  "flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] p-12 transition-all bg-white/50",
                  form.watch("paymentProof")?.[0] ? "border-primary bg-primary/5" : "border-muted-foreground/10 group-hover:border-primary/30"
                )}>
                  {form.watch("paymentProof")?.[0] ? (
                    <>
                      <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center text-white mb-4 shadow-xl shadow-primary/20 animate-in zoom-in">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <p className="text-lg font-bold text-primary">{form.watch("paymentProof")?.[0].name}</p>
                    </>
                  ) : (
                    <>
                      <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Upload className="h-10 w-10" />
                      </div>
                      <p className="text-lg font-bold">Upload screenshot</p>
                    </>
                  )}
                </div>
              </div>
            </section>

            <Button 
              type="submit" 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/20 rounded-[1.5rem] transition-all group"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Submit Request
                  <FileText className="ml-3 h-6 w-6 opacity-50" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
