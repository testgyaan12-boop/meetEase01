
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name required").optional(),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      toast({ title: "Welcome!", description: "Signed in successfully with Google." })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.")
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
      <div className="w-full max-w-md space-y-4 md:space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-1 md:space-y-2">
          <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-primary text-white mb-2 md:mb-6 shadow-2xl shadow-primary/20 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight">MeetEase</h1>
          <p className="hidden md:block text-muted-foreground font-medium text-lg">Your professional meeting hub</p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-card/90 backdrop-blur-xl">
          <CardHeader className="space-y-1 p-5 md:p-6">
            <CardTitle className="text-2xl md:text-3xl font-headline font-bold text-primary">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-sm md:text-base font-medium">
              {isLogin ? "Sign in to manage your appointments." : "Start your journey with MeetEase today."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0 md:pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4 md:mb-6 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary">
                    Full Name
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Jane Doe" 
                    className="h-11 md:h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50"
                    {...register("fullName")}
                  />
                  {errors.fullName && <p className="text-[10px] md:text-xs text-destructive font-semibold">{errors.fullName.message}</p>}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" /> Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-11 md:h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50"
                  {...register("email")}
                />
                {errors.email && <p className="text-[10px] md:text-xs text-destructive font-semibold">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold flex items-center gap-2 text-primary">
                  <Lock className="h-4 w-4" /> Password
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-11 md:h-12 border-primary/10 focus:ring-primary focus:border-primary bg-white/50 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] md:text-xs text-destructive font-semibold">{errors.password.message}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base md:text-lg shadow-xl shadow-primary/20 rounded-xl md:rounded-2xl transition-all active:scale-95 mt-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : (
                  <>
                    {isLogin ? "Sign In" : "Register Now"} <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 md:my-8 relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted"></span>
              </div>
              <div className="relative flex justify-center text-[10px] md:text-xs uppercase">
                <span className="bg-white/80 dark:bg-card px-4 text-muted-foreground font-bold">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 md:h-14 border-primary/10 hover:bg-primary/5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 md:space-y-6 p-5 md:p-6 pb-6 md:pb-10 pt-0">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted"></span>
              </div>
              <div className="relative flex justify-center text-[10px] md:text-xs uppercase">
                <span className="bg-white/80 dark:bg-card px-4 text-muted-foreground font-bold">Account help</span>
              </div>
            </div>
            <p className="text-center text-xs md:text-sm font-medium">
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
