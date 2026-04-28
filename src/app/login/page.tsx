"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    // Simulating authentication
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    if (data.email.includes('admin')) {
      toast({ title: "Welcome back, Admin!", description: "Redirecting to admin panel..." })
      router.push('/admin')
    } else {
      toast({ title: "Success!", description: "Welcome to MeetEase." })
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white mb-4 shadow-xl shadow-primary/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">MeetEase</h1>
          <p className="text-muted-foreground font-medium">Your professional meeting hub</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-12 border-muted-foreground/20 focus:ring-primary focus:border-primary"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 border-muted-foreground/20 focus:ring-primary focus:border-primary"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    {isLogin ? "Sign In" : "Register"} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "New to MeetEase?" : "Already have an account?"}
              <button 
                className="ml-1 text-primary font-bold hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}