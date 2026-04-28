
"use client"

import { useState, useEffect } from "react"
import { useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking, useDoc, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ListFilter
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
import { format, setHours, setMinutes, startOfDay } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("requests")

  // Super-admin check for the specific UID
  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef)
  const hasAdminAccess = !!adminRole || isSuperAdmin

  // Queries
  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(collection(firestore, "meetings"), orderBy("createdAt", "desc"))
  }, [firestore, hasAdminAccess])

  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(collection(firestore, "availableSlots"), orderBy("startTime", "asc"))
  }, [firestore, hasAdminAccess])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection(meetingsQuery)
  const { data: slots, isLoading: isSlotsLoading } = useCollection(slotsQuery)

  // Form states for new slot
  const [newSlotDate, setNewSlotDate] = useState<Date>(new Date())
  const [startTimeStr, setStartTimeStr] = useState("09:00")
  const [endTimeStr, setEndTimeStr] = useState("10:00")
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false)

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

  const handleMeetingAction = (id: string, action: 'confirmed' | 'rejected') => {
    if (!firestore) return
    const meetingRef = doc(firestore, "meetings", id)
    updateDocumentNonBlocking(meetingRef, { 
      status: action,
      updatedAt: new Date().toISOString()
    })
    
    toast({
      title: action === 'confirmed' ? "Session Approved" : "Request Declined",
      description: `The status has been updated.`,
    })
  }

  const handleAddSlot = () => {
    if (!firestore) return
    
    const [sH, sM] = startTimeStr.split(":").map(Number)
    const [eH, eM] = endTimeStr.split(":").map(Number)
    
    const startTime = setMinutes(setHours(newSlotDate, sH), sM).toISOString()
    const endTime = setMinutes(setHours(newSlotDate, eH), eM).toISOString()

    addDocumentNonBlocking(collection(firestore, "availableSlots"), {
      startTime,
      endTime,
      isBooked: false,
    })

    toast({
      title: "Slot Created",
      description: "A new availability slot has been added to the database.",
    })
    setIsAddSlotOpen(false)
  }

  const handleDeleteSlot = (id: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "availableSlots", id))
    toast({
      title: "Slot Removed",
      variant: "destructive",
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
                <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Admin Control</h1>
                {isSuperAdmin && <Badge className="bg-accent text-white font-black text-[10px] tracking-widest px-3 py-1">SUPER ADMIN</Badge>}
              </div>
              <p className="text-base text-muted-foreground font-medium">Manage meeting requests and time slot availability.</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="requests" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="h-16 bg-white rounded-[2rem] p-2 shadow-xl border-none">
            <TabsTrigger value="requests" className="rounded-[1.5rem] px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Meeting Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="rounded-[1.5rem] px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Availability Slots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
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
                <h2 className="text-2xl font-headline font-bold">Request Queue</h2>
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
                          <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
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
                                    <CheckCircle2 className="h-4 w-4" /> Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-3xl font-headline font-bold text-primary">Verify Request</DialogTitle>
                                    <DialogDescription className="text-base font-medium">Review payment proof from {req.clientName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border-8 border-muted/10 shadow-inner mt-4">
                                    <img 
                                      src={req.paymentProofUrl} 
                                      alt="Payment proof" 
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <DialogFooter className="sm:justify-between gap-4 pt-8">
                                    <Button 
                                      variant="destructive" 
                                      className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl" 
                                      onClick={() => handleMeetingAction(req.id, 'rejected')}
                                    >
                                      <XCircle className="mr-2 h-6 w-6" /> REJECT
                                    </Button>
                                    <Button 
                                      className="flex-1 h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl" 
                                      onClick={() => handleMeetingAction(req.id, 'confirmed')}
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
                  <div className="text-center py-32 bg-white/40 flex flex-col items-center gap-6">
                    <Inbox className="h-12 w-12 text-muted-foreground/20" />
                    <h3 className="text-2xl font-headline font-bold text-muted-foreground/60">No Pending Requests</h3>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-headline font-bold text-primary">Schedule Availability</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-14 px-8 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-bold gap-3 text-lg">
                    <Plus className="h-6 w-6" /> Create New Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-headline font-bold text-primary">Define Availability</DialogTitle>
                    <DialogDescription className="text-base font-medium">Set a new date and time range for consultations.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary ml-1">Select Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 rounded-2xl border-primary/10 bg-white/50 justify-start font-medium text-lg px-6">
                            <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                            {format(newSlotDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl">
                          <Calendar 
                            mode="single" 
                            selected={newSlotDate} 
                            onSelect={(d) => d && setNewSlotDate(d)}
                            disabled={(d) => d < startOfDay(new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-primary ml-1">Start Time</label>
                        <Input 
                          type="time" 
                          value={startTimeStr} 
                          onChange={(e) => setStartTimeStr(e.target.value)}
                          className="h-14 rounded-2xl border-primary/10 bg-white/50 text-lg px-6 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-primary ml-1">End Time</label>
                        <Input 
                          type="time" 
                          value={endTimeStr} 
                          onChange={(e) => setEndTimeStr(e.target.value)}
                          className="h-14 rounded-2xl border-primary/10 bg-white/50 text-lg px-6 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-8">
                    <Button onClick={handleAddSlot} className="w-full h-16 rounded-2xl bg-primary font-black text-xl shadow-xl shadow-primary/20">
                      AUTHORIZE SLOT
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-12 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="hover:bg-transparent border-primary/10">
                        <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Time Range</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                        <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className="border-primary/5 hover:bg-primary/5">
                          <TableCell className="py-8 pl-8">
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 text-primary/40" />
                              <span className="font-bold text-lg">{format(new Date(slot.startTime), "PPP")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-lg">
                              {format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={slot.isBooked ? "destructive" : "secondary"}
                              className="px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest"
                            >
                              {slot.isBooked ? "Booked" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-destructive hover:bg-destructive/10 h-12 w-12 rounded-xl"
                            >
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-32 bg-white/40 flex flex-col items-center gap-6">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/20" />
                  <h3 className="text-2xl font-headline font-bold text-muted-foreground/60">No Slots Defined</h3>
                  <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-bold" onClick={() => setIsAddSlotOpen(true)}>
                    Add your first availability
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
