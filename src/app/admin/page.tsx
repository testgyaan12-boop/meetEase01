
"use client"

import { useState, useEffect } from "react"
import { useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking, useDoc, useUser } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  User, 
  Search,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2
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

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef)

  // CRITICAL: Ensure the query only runs if the user IS confirmed as an admin.
  // This prevents the permission error you saw.
  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !adminRole) return null
    return query(collection(firestore, "meetings"), orderBy("createdAt", "desc"))
  }, [firestore, adminRole])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection(meetingsQuery)

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !adminRole) {
      toast({
        title: "Access Denied",
        description: "You do not have administrative privileges for this section.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, isUserLoading, adminRole, isAdminLoading, router, toast])

  const handleAction = (id: string, action: 'confirmed' | 'rejected') => {
    if (!firestore) return
    const meetingRef = doc(firestore, "meetings", id)
    updateDocumentNonBlocking(meetingRef, { 
      status: action,
      updatedAt: new Date().toISOString()
    })
    
    toast({
      title: action === 'confirmed' ? "Session Confirmed" : "Request Rejected",
      description: `Status updated successfully.`,
    })
  }

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!adminRole) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientMobile.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Admin Panel</h1>
              <p className="text-sm text-muted-foreground font-medium">Verified Request Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Pending Verification</CardDescription>
              <CardTitle className="text-4xl font-headline text-primary">
                {isMeetingsLoading ? <Skeleton className="h-10 w-12" /> : meetings?.filter(m => m.status === 'pending').length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Confirmed Total</CardDescription>
              <CardTitle className="text-4xl font-headline text-green-600">
                {isMeetingsLoading ? <Skeleton className="h-10 w-12" /> : meetings?.filter(m => m.status === 'confirmed').length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Revenue Forecast</CardDescription>
              <CardTitle className="text-4xl font-headline text-accent">$3,120</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-headline font-bold">Request Queue</h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by client name..." 
                className="pl-11 h-12 bg-white rounded-xl border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6">
            {isMeetingsLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
            ) : filteredMeetings && filteredMeetings.length > 0 ? (
              filteredMeetings.map((req) => (
                <Card key={req.id} className="bg-white border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                  <div className="flex flex-col lg:row">
                    <div className="flex-1 p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-primary">{req.clientName}</h3>
                          <p className="text-sm font-medium text-muted-foreground">{req.clientMobile}</p>
                        </div>
                        <Badge 
                          variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : 'destructive'} 
                          className="px-4 py-1.5 rounded-lg font-bold"
                        >
                          {req.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-xl border border-muted-foreground/5 italic text-sm leading-relaxed">
                        &quot;{req.description}&quot;
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Received: {format(new Date(req.createdAt), "PPp")}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 rounded-lg gap-2 border-primary text-primary hover:bg-primary/5 font-bold">
                              <CheckCircle2 className="h-4 w-4" /> Review Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-headline font-bold">Transfer Verification</DialogTitle>
                              <DialogDescription className="text-base">Review payment proof for {req.clientName}</DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-muted/20 shadow-inner mt-4">
                              <img 
                                src={req.paymentProofUrl} 
                                alt="Payment proof" 
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <DialogFooter className="sm:justify-between gap-3 pt-6">
                              <Button 
                                variant="destructive" 
                                className="flex-1 h-12 rounded-xl font-bold" 
                                onClick={() => handleAction(req.id, 'rejected')}
                              >
                                <XCircle className="mr-2 h-5 w-5" /> Reject
                              </Button>
                              <Button 
                                className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90" 
                                onClick={() => handleAction(req.id, 'confirmed')}
                              >
                                <CheckCircle className="mr-2 h-5 w-5" /> Confirm
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-24 bg-white/40 rounded-3xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center">
                <Inbox className="h-16 w-16 text-muted-foreground/20 mb-6" />
                <h3 className="text-2xl font-headline font-bold text-muted-foreground">Queue Empty</h3>
                <p className="text-muted-foreground font-medium">No pending requests require your attention right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
