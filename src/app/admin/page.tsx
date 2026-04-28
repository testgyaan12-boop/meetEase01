
"use client"

import { useState, useEffect } from "react"
import { useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking, useDoc, useUser } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Direct super-admin check for the UID provided
  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef)
  
  const hasAdminAccess = !!adminRole || isSuperAdmin

  const meetingsQuery = useMemoFirebase(() => {
    // CRITICAL: We only trigger the global list query IF the user has confirmed admin status
    // This prevents "Missing or insufficient permissions" errors for regular users
    if (!firestore || !hasAdminAccess) return null
    return query(collection(firestore, "meetings"), orderBy("createdAt", "desc"))
  }, [firestore, hasAdminAccess])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection(meetingsQuery)

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "Administrative privileges are required for this section.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, isUserLoading, hasAdminAccess, isAdminLoading, router, toast])

  const handleAction = (id: string, action: 'confirmed' | 'rejected') => {
    if (!firestore) return
    const meetingRef = doc(firestore, "meetings", id)
    updateDocumentNonBlocking(meetingRef, { 
      status: action,
      updatedAt: new Date().toISOString()
    })
    
    toast({
      title: action === 'confirmed' ? "Session Approved" : "Request Declined",
      description: `The meeting status has been updated to ${action}.`,
    })
  }

  if (isUserLoading || (isAdminLoading && !isSuperAdmin)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary animate-pulse">Verifying Admin Clearance...</p>
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientMobile.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
              <ShieldCheck className="h-9 w-9 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Management Queue</h1>
                {isSuperAdmin && <Badge className="bg-accent text-white font-black text-[10px] tracking-widest px-3 py-1">SUPER ADMIN</Badge>}
              </div>
              <p className="text-base text-muted-foreground font-medium">Verify payments and authorize professional sessions.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardDescription className="font-black uppercase text-[11px] tracking-widest text-primary/60">Awaiting Proof</CardDescription>
              <CardTitle className="text-5xl font-headline text-primary">
                {isMeetingsLoading ? <Skeleton className="h-12 w-16" /> : meetings?.filter(m => m.status === 'pending').length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardDescription className="font-black uppercase text-[11px] tracking-widest text-green-600/60">Confirmed Sessions</CardDescription>
              <CardTitle className="text-5xl font-headline text-green-600">
                {isMeetingsLoading ? <Skeleton className="h-12 w-16" /> : meetings?.filter(m => m.status === 'confirmed').length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardDescription className="font-black uppercase text-[11px] tracking-widest text-accent/60">Active Clients</CardDescription>
              <CardTitle className="text-5xl font-headline text-accent">
                {isMeetingsLoading ? <Skeleton className="h-12 w-16" /> : new Set(meetings?.map(m => m.userId)).size || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-headline font-bold">Request Database</h2>
            <div className="relative w-full max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search clients..." 
                className="pl-12 h-14 bg-white rounded-2xl border-none shadow-xl text-base font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
            {isMeetingsLoading ? (
              <div className="p-12 space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : filteredMeetings && filteredMeetings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent border-primary/10">
                      <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Client Identity</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Submission Date</TableHead>
                      <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map((req) => (
                      <TableRow key={req.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                        <TableCell className="py-8 pl-8">
                          <div>
                            <p className="font-bold text-lg text-primary">{req.clientName}</p>
                            <p className="text-sm font-medium text-muted-foreground">{req.clientMobile}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : 'destructive'} 
                            className="px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest"
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground/70">
                            <Clock className="h-4 w-4 text-primary/40" />
                            {format(new Date(req.createdAt), "PPP")}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-12 px-6 rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary font-bold hover:text-white transition-all">
                                <CheckCircle2 className="h-4 w-4" /> Review Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-headline font-bold text-primary">Verification</DialogTitle>
                                <DialogDescription className="text-base font-medium">Verify transfer details for {req.clientName}</DialogDescription>
                              </DialogHeader>
                              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border-8 border-muted/10 shadow-inner mt-4 group">
                                <img 
                                  src={req.paymentProofUrl} 
                                  alt="Payment proof" 
                                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <DialogFooter className="sm:justify-between gap-4 pt-8">
                                <Button 
                                  variant="destructive" 
                                  className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-destructive/20" 
                                  onClick={() => handleAction(req.id, 'rejected')}
                                >
                                  <XCircle className="mr-2 h-6 w-6" /> REJECT
                                </Button>
                                <Button 
                                  className="flex-1 h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" 
                                  onClick={() => handleAction(req.id, 'confirmed')}
                                >
                                  <CheckCircle className="mr-2 h-6 w-6" /> APPROVE
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-32 bg-white/40 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                <div className="h-24 w-24 rounded-[2rem] bg-muted/20 flex items-center justify-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-headline font-bold text-muted-foreground/60 tracking-tight">Zero Pending Requests</h3>
                  <p className="text-muted-foreground font-medium max-w-sm mx-auto">Your management queue is completely clear. All payments have been verified.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
