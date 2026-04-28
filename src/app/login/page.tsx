"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name required").optional(),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, router])

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    setError(null)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password)
        toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." })
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
        if (data.fullName) {
          await updateProfile(userCredential.user, { displayName: data.fullName })
        }
        toast({ title: "Account created!", description: "Welcome to MeetEase." })
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white mb-6 shadow-2xl shadow-primary/20 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-primary tracking-tight">MeetEase</h1>
          <p className="text-muted-foreground font-medium text-lg">Your professional meeting hub</p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-base font-medium">
              {isLogin ? "Sign in to manage your appointments." : "Start your journey with MeetEase today."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2 text-primary">
                    Full Name
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Jane Doe" 
                    className="h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50"
                    {...register("fullName")}
                  />
                  {errors.fullName && <p className="text-xs text-destructive font-semibold">{errors.fullName.message}</p>}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" /> Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive font-semibold">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Lock className="h-4 w-4" /> Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive font-semibold">{errors.password.message}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 rounded-2xl transition-all active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    {isLogin ? "Sign In" : "Register Now"} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pb-10">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 px-4 text-muted-foreground font-bold">New here?</span>
              </div>
            </div>
            <p className="text-center text-sm font-medium">
              {isLogin ? "Don't have an account?" : "Already a member?"}
              <button 
                className="ml-2 text-primary font-bold hover:underline"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                }}
              >
                {isLogin ? "Create account" : "Sign in here"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
