"use client"

import { useState, useEffect } from "react"
import { useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking, useDoc, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, 
  Search,
  Inbox,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Users,
  CalendarDays,
  Activity,
  ArrowLeft,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format, setHours, setMinutes, isPast, startOfDay } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Meeting } from "@/lib/types"

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("requests")

  // States for Approval/Rejection
  const [reviewMeeting, setReviewMeeting] = useState<Meeting | null>(null)
  const [meetingLink, setMeetingLink] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Super-admin check
  const isSuperAdmin = user?.uid === 'hKv5CWVQv7YvJk8mLyCY11ec96O2'

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "roles_admin", user.uid)
  }, [firestore, user])

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef)
  const hasAdminAccess = !!adminRole || isSuperAdmin

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(collection(firestore, "meetings"), orderBy("createdAt", "desc"))
  }, [firestore, hasAdminAccess])

  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || !hasAdminAccess) return null
    return query(collection(firestore, "availableSlots"), orderBy("startTime", "asc"))
  }, [firestore, hasAdminAccess])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection<Meeting>(meetingsQuery)
  const { data: slots, isLoading: isSlotsLoading } = useCollection(slotsQuery)

  const [newSlotDateStr, setNewSlotDateStr] = useState(format(new Date(), "yyyy-MM-dd"))
  const [startTimeStr, setStartTimeStr] = useState("09:00")
  const [endTimeStr, setEndTimeStr] = useState("10:00")
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "Administrative privileges required.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, isUserLoading, hasAdminAccess, isAdminLoading, router, toast])

  const handleApprove = () => {
    if (!firestore || !reviewMeeting) return
    if (!meetingLink.trim()) {
      toast({ title: "Error", description: "Meeting link is required for approval.", variant: "destructive" })
      return
    }
    setIsProcessing(true)
    const meetingRef = doc(firestore, "meetings", reviewMeeting.id)
    
    updateDocumentNonBlocking(meetingRef, { 
      status: 'confirmed',
      meetingLink: meetingLink,
      updatedAt: new Date().toISOString()
    })
    
    toast({ title: "Session Approved" })
    setReviewMeeting(null)
    setMeetingLink("")
    setIsProcessing(false)
  }

  const handleReject = () => {
    if (!firestore || !reviewMeeting) return
    if (!adminNotes.trim()) {
      toast({ title: "Error", description: "Please provide a reason for rejection.", variant: "destructive" })
      return
    }
    setIsProcessing(true)
    const meetingRef = doc(firestore, "meetings", reviewMeeting.id)
    
    updateDocumentNonBlocking(meetingRef, { 
      status: 'rejected',
      adminNotes: adminNotes,
      updatedAt: new Date().toISOString()
    })
    
    toast({ title: "Request Declined", variant: "destructive" })
    setReviewMeeting(null)
    setAdminNotes("")
    setIsProcessing(false)
  }

  const handleMarkDone = (id: string) => {
    if (!firestore) return
    const meetingRef = doc(firestore, "meetings", id)
    updateDocumentNonBlocking(meetingRef, { 
      status: 'done',
      updatedAt: new Date().toISOString()
    })
    toast({ title: "Meeting Completed" })
  }

  const handleAddSlot = () => {
    if (!firestore) return
    const dateObj = new Date(newSlotDateStr)
    const [sH, sM] = startTimeStr.split(":").map(Number)
    const [eH, eM] = endTimeStr.split(":").map(Number)
    const startTime = setMinutes(setHours(dateObj, sH), sM).toISOString()
    const endTime = setMinutes(setHours(dateObj, eH), eM).toISOString()

    addDocumentNonBlocking(collection(firestore, "availableSlots"), {
      startTime,
      endTime,
      isBooked: false,
    })

    toast({ title: "Slot Created" })
    setIsAddSlotOpen(false)
  }

  const handleDeleteSlot = (id: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "availableSlots", id))
    toast({ title: "Slot Removed", variant: "destructive" })
  }

  if (isUserLoading || (isAdminLoading && !isSuperAdmin)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Verifying Clearance...</p>
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    { title: "Requests", value: meetings?.length || 0, icon: Users, color: "bg-blue-600" },
    { title: "Pending", value: meetings?.filter(m => m.status === 'pending').length || 0, icon: Activity, color: "bg-orange-500" },
    { title: "Slots", value: slots?.filter(s => !s.isBooked).length || 0, icon: CalendarDays, color: "bg-green-600" }
  ]

  const isMeetingExpired = (meeting: Meeting) => {
    if (meeting.status === 'done') return true
    if (meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))) return true
    return false
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-700 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/dashboard")}
              className="h-10 w-10 rounded-xl bg-white shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-headline font-bold text-primary flex items-center gap-2">
                  Admin
                  {isSuperAdmin && <Badge className="bg-accent text-[8px] tracking-tight">SUPER</Badge>}
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Control Center</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-3 md:p-6 flex flex-col items-center gap-1 md:gap-3">
                <div className={cn("h-8 w-8 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-white", stat.color)}>
                  <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div className="text-center">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{stat.title}</p>
                  <p className="text-sm md:text-2xl font-headline font-bold text-primary leading-none">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-white rounded-xl p-1 shadow-sm border-none w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 rounded-lg px-6 h-full font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 rounded-lg px-6 h-full font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-headline font-bold w-full">Incoming Queue</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by name/email..." 
                  className="pl-10 h-10 bg-white rounded-xl border-none shadow-sm text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border-none shadow-lg bg-white overflow-hidden">
              {isMeetingsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-none">
                        <TableHead className="py-4 pl-6 font-black uppercase text-primary/60 tracking-widest text-[10px]">Client</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[10px]">Status</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[10px]">Date</TableHead>
                        <TableHead className="pr-6 text-right font-black uppercase text-primary/60 tracking-widest text-[10px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMeetings.map((req) => (
                        <TableRow key={req.id} className="border-primary/5">
                          <TableCell className="py-4 pl-6">
                            <div>
                              <p className="font-bold text-sm text-primary">{req.clientName}</p>
                              <p className="text-[10px] text-muted-foreground">{req.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : req.status === 'done' ? 'outline' : 'destructive'} 
                              className="text-[9px] font-black uppercase"
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold whitespace-nowrap">
                            {format(new Date(req.createdAt), "MMM d, p")}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {req.status === 'pending' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-lg font-bold text-xs"
                                onClick={() => setReviewMeeting(req)}
                              >
                                Review
                              </Button>
                            ) : req.status === 'confirmed' && !isMeetingExpired(req) ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg font-bold text-primary text-xs"
                                onClick={() => handleMarkDone(req.id)}
                              >
                                Done
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Passed</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 bg-white/40">
                  <Inbox className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <h3 className="text-sm font-headline font-bold text-muted-foreground/60">No matching requests</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-headline font-bold">Time Slots</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 rounded-xl bg-primary shadow-md font-bold text-xs">
                    <Plus className="h-4 w-4 mr-2" /> Create Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-sm p-6 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline font-bold">New Availability</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-primary/60 ml-1">Choose Date</label>
                      <Input 
                        type="date" 
                        value={newSlotDateStr} 
                        onChange={(e) => setNewSlotDateStr(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd")}
                        className="h-12 rounded-2xl border-primary/10 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-primary/60 ml-1">Start Time</label>
                        <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-12 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-primary/60 ml-1">End Time</label>
                        <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-12 rounded-2xl" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button onClick={handleAddSlot} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">ADD SESSION</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-2xl border-none shadow-lg bg-white overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-none">
                        <TableHead className="py-4 pl-6 font-black uppercase text-primary/60 tracking-widest text-[10px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[10px]">Time</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[10px]">Booking</TableHead>
                        <TableHead className="pr-6 text-right font-black uppercase text-primary/60 tracking-widest text-[10px]">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className="border-primary/5">
                          <TableCell className="py-4 pl-6 font-bold text-sm">
                            {format(new Date(slot.startTime), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={slot.isBooked ? "destructive" : "secondary"} className="text-[9px]">
                              {slot.isBooked ? "Reserved" : "Open"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="h-8 w-8 text-destructive rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 bg-white/40">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <h3 className="text-sm font-headline font-bold text-muted-foreground/60">No availability set</h3>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-4xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl bg-white">
          <div className="flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">Verification</DialogTitle>
                <p className="text-sm text-muted-foreground">Approve with meeting link or reject with feedback.</p>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-muted/30 border border-muted/20">
                  <p className="text-[10px] font-black text-primary/60 uppercase mb-1">Agenda</p>
                  <p className="text-sm font-medium italic text-foreground/80 leading-relaxed">"{reviewMeeting?.description}"</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary/60 uppercase px-1">Meeting Link (Approval Required)</label>
                  <Input 
                    placeholder="https://meet.google.com/..." 
                    className="h-12 rounded-2xl bg-muted/20"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary/60 uppercase px-1">Reason (Rejection Only)</label>
                  <Textarea 
                    placeholder="Why is this request being declined?" 
                    className="min-h-[80px] rounded-2xl bg-muted/20"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs bg-primary"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  Confirm
                </Button>
              </div>
            </div>

            <div className="w-full md:w-[350px] bg-muted/10 p-6 border-t md:border-t-0 md:border-l border-muted/20">
              <p className="text-[10px] font-black text-muted-foreground uppercase text-center mb-4">Payment Receipt</p>
              <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl bg-white border-4 border-white">
                <img 
                  src={reviewMeeting?.paymentProofUrl} 
                  className="object-contain w-full h-full bg-muted/5" 
                  alt="Payment Proof" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/600/800" }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
