"use client"

import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useAuth } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User, Mail, Shield, Save, LogOut, ArrowRight, ShieldCheck, Copy, Check, QrCode, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is too short"),
  email: z.string().email("Invalid email"),
})

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const upiId = "meetease@upi" // Placeholder UPI ID

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])
  
  const { data: adminRole } = useDoc(adminRoleRef)
  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'
  const hasAdminAccess = !!adminRole || isSuperAdmin

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName || user?.displayName || "",
      email: profile?.email || user?.email || "",
    },
  })

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return

    setDocumentNonBlocking(userDocRef, {
      ...values,
      id: user?.uid,
      updatedAt: new Date().toISOString(),
      createdAt: profile?.createdAt || new Date().toISOString(),
    }, { merge: true })

    toast({
      title: "Profile Saved",
      description: "Your information has been updated successfully.",
    })
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    toast({
      title: "UPI Copied",
      description: "The UPI ID has been copied to your clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
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
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Account Profile</h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Manage your personal identity and preferences.</p>
        </div>
      </div>

      {hasAdminAccess && (
        <Link href="/admin">
          <Card className="border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group rounded-2xl md:rounded-3xl overflow-hidden">
            <CardContent className="p-4 md:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-primary text-base md:text-lg">Admin Workspace</p>
                    <Shield className="h-3 w-3 text-primary fill-primary" />
                  </div>
                  <p className="text-[10px] md:text-sm text-primary/70 font-medium">Manage meeting requests and verify payments.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-primary transition-transform group-hover:translate-x-2" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Support / UPI Card */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 dark:from-primary/5 dark:via-card dark:to-accent/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-6 md:p-10 text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase flex items-center gap-2">
              <Heart className="h-3 w-3 fill-primary" /> Show your love for expand
            </Badge>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white dark:bg-card p-4 rounded-2xl shadow-xl">
                <img 
                  src="https://picsum.photos/seed/qr99/400/400" 
                  alt="Payment QR" 
                  className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-lg"
                  data-ai-hint="qr code"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] md:text-xs font-black uppercase text-primary/60 tracking-widest">Support via UPI</p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-12 md:h-14 px-6 rounded-xl md:rounded-2xl bg-white/50 dark:bg-card/40 border border-primary/10 flex items-center font-bold text-sm md:text-lg text-primary shadow-sm min-w-[200px]">
                  {upiId}
                </div>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopyUpi}
                  className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl border-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium italic">Your contributions help us build better tools for everyone.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl bg-white/80 dark:bg-card/40 backdrop-blur-md rounded-2xl md:rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 p-6 md:p-10 border-b">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <User className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl font-headline font-bold text-primary tracking-tight">Personal Details</CardTitle>
              <CardDescription className="text-sm md:text-base font-medium">Update your public information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2 px-1">
                Full Name
              </label>
              <Input 
                {...form.register("fullName")} 
                className="h-12 md:h-16 rounded-xl md:rounded-2xl border-primary/10 bg-white/50 dark:bg-card/20 focus:ring-primary shadow-sm text-sm md:text-lg font-medium px-4 md:px-6"
              />
              {form.formState.errors.fullName && (
                <p className="text-[10px] md:text-xs text-destructive font-bold px-1">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2 px-1">
                Email Address
              </label>
              <Input 
                {...form.register("email")} 
                disabled
                className="h-12 md:h-16 rounded-xl md:rounded-2xl border-primary/10 bg-muted/40 shadow-sm opacity-60 px-4 md:px-6 font-medium"
              />
              <p className="text-[9px] md:text-[11px] text-muted-foreground italic px-1 font-medium">Email is linked to auth and cannot be changed.</p>
            </div>

            <div className="pt-4 md:pt-6 flex flex-col gap-3 md:gap-4">
              <Button 
                type="submit" 
                className="w-full h-12 md:h-16 bg-primary hover:bg-primary/90 text-white font-bold text-base md:text-xl rounded-xl md:rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex gap-2 md:gap-3"
              >
                <Save className="h-5 w-5 md:h-6 md:w-6" /> Save Profile
              </Button>
              
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-12 md:h-16 font-bold text-base md:text-xl rounded-xl md:rounded-2xl transition-all active:scale-95 flex gap-2 md:gap-3 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-none shadow-none"
              >
                <LogOut className="h-5 w-5 md:h-6 md:w-6" /> Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}