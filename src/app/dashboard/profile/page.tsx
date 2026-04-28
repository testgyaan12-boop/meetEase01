
"use client"

import { useUser, useFirestore, useDoc, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User, Mail, Shield, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemoFirebase } from "@/firebase"

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is too short"),
  email: z.string().email("Invalid email"),
})

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName || user?.displayName || "",
      email: profile?.email || user?.email || "",
    },
  })

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return

    updateDocumentNonBlocking(userDocRef, {
      ...values,
      updatedAt: new Date().toISOString(),
    })

    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    })
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48" />
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Account Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Card className="border-none shadow-xl bg-white/70 backdrop-blur-md rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-primary/5 p-8 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline font-bold text-primary">Personal Details</CardTitle>
              <CardDescription>Update your public-facing information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary flex items-center gap-2">
                <User className="h-4 w-4" /> Full Name
              </label>
              <Input 
                {...form.register("fullName")} 
                className="h-14 rounded-2xl border-primary/10 bg-white/50 focus:ring-primary shadow-sm"
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive font-bold">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-primary flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Address
              </label>
              <Input 
                {...form.register("email")} 
                disabled
                className="h-14 rounded-2xl border-primary/10 bg-muted/30 shadow-sm opacity-70"
              />
              <p className="text-[10px] text-muted-foreground italic px-1">Email cannot be changed for security reasons.</p>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex gap-2"
              >
                <Save className="h-5 w-5" /> Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-accent/5 rounded-[2rem]">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-accent">Account Security</p>
              <p className="text-xs text-muted-foreground font-medium">Your account is verified and secure.</p>
            </div>
          </div>
          <Button variant="ghost" className="text-accent font-bold">Manage</Button>
        </CardContent>
      </Card>
    </div>
  )
}
