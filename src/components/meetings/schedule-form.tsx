"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SlotPicker } from "./slot-picker"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"

const formSchema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientMobile: z.string().min(10, "Invalid mobile number"),
  description: z.string().min(10, "Please provide more details"),
  availableSlotId: z.string().min(1, "Please select a slot"),
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
    
    // In a real app, you would upload to Firebase Storage first. 
    // For this prototype, we'll use a placeholder URL.
    const paymentProofUrl = "https://picsum.photos/seed/pay123/600/800"

    const meetingData = {
      userId: user.uid,
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
      title: "Request Submitted",
      description: "We'll verify your payment and confirm your slot soon.",
    })
    
    router.push("/dashboard/history")
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="font-medium">You must be logged in to book a meeting.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-xl bg-white/70 backdrop-blur-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline font-bold text-primary">New Appointment</CardTitle>
        <CardDescription>Select a day and time that works for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="John Doe" {...form.register("clientName")} className="h-12" />
              {form.formState.errors.clientName && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.clientName.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile Number</label>
              <Input placeholder="+1 234 567 890" {...form.register("clientMobile")} className="h-12" />
              {form.formState.errors.clientMobile && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.clientMobile.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Purpose</label>
            <Textarea 
              placeholder="Tell us what you'd like to discuss..." 
              {...form.register("description")}
              className="min-h-[100px] bg-white"
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.description.message as string}</p>
            )}
          </div>

          <SlotPicker 
            onSelect={(id, start, end) => {
              form.setValue("availableSlotId", id, { shouldValidate: true })
              form.setValue("slotStartTime", start)
              form.setValue("slotEndTime", end)
            }} 
          />
          {form.formState.errors.availableSlotId && (
            <p className="text-xs text-destructive font-medium">Please select an available time slot.</p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Proof (Screenshot)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => form.setValue("paymentProof", e.target.files, { shouldValidate: true })}
              />
              <div className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors bg-white",
                form.watch("paymentProof")?.[0] ? "border-primary bg-primary/5" : "border-muted-foreground/20 group-hover:border-primary/50"
              )}>
                {form.watch("paymentProof")?.[0] ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">{form.watch("paymentProof")?.[0].name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload receipt screenshot</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
            {form.formState.errors.paymentProof && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.paymentProof.message as string}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Book Session"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
