"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MeetingDescriptionAI } from "./meeting-description-ai"
import { SlotPicker } from "./slot-picker"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Invalid mobile number"),
  description: z.string().min(10, "Please provide more details"),
  slotId: z.string().min(1, "Please select a slot"),
  slotTime: z.string(),
  slotDate: z.string(),
  paymentProof: z.any().refine((files) => files?.length > 0, "Payment proof is required"),
})

export function ScheduleMeetingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mobile: "",
      description: "",
      slotId: "",
      slotTime: "",
      slotDate: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    // Simulating API call/Firebase upload
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    toast({
      title: "Meeting Request Submitted",
      description: "Admin has been notified. We'll verify your payment and confirm soon.",
    })
    router.push("/dashboard/history")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-xl bg-white/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline font-bold text-primary">Schedule a Meeting</CardTitle>
        <CardDescription>Fill in your details and select a slot.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="John Doe" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile Number</label>
              <Input placeholder="+1 234 567 890" {...form.register("mobile")} />
              {form.formState.errors.mobile && (
                <p className="text-xs text-destructive">{form.formState.errors.mobile.message as string}</p>
              )}
            </div>
          </div>

          <MeetingDescriptionAI 
            value={form.watch("description")} 
            onChange={(val) => form.setValue("description", val, { shouldValidate: true })} 
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message as string}</p>
          )}

          <SlotPicker 
            onSelect={(date, id, time) => {
              form.setValue("slotId", id)
              form.setValue("slotTime", time)
              form.setValue("slotDate", date.toISOString())
            }} 
          />
          {form.formState.errors.slotId && (
            <p className="text-xs text-destructive">Please select a time slot.</p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Proof (Screenshot)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => form.setValue("paymentProof", e.target.files)}
              />
              <div className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors bg-white",
                form.watch("paymentProof")?.[0] ? "border-primary bg-primary/5" : "border-muted-foreground/20 group-hover:border-primary/50"
              )}>
                {form.watch("paymentProof")?.[0] ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">{form.watch("paymentProof")?.[0].name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload payment proof</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
            {form.formState.errors.paymentProof && (
              <p className="text-xs text-destructive">{form.formState.errors.paymentProof.message as string}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Confirm Schedule & Pay"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}