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
  Clock,
  Inbox,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Users,
  CalendarDays,
  Activity,
  CheckCircle2,
  ExternalLink,
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
import { Calendar } from "@/components/ui/calendar"
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

  const [newSlotDate, setNewSlotDate] = useState<Date>(new Date())
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
    
    toast({ title: "Session Approved", description: "Meeting link sent to user." })
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
    const [sH, sM] = startTimeStr.split(":").map(Number)
    const [eH, eM] = endTimeStr.split(":").map(Number)
    const startTime = setMinutes(setHours(newSlotDate, sH), sM).toISOString()
    const endTime = setMinutes(setHours(newSlotDate, eH), eM).toISOString()

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
        <p className="text-sm font-bold text-primary tracking-widest uppercase">Verifying Clearance...</p>
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    {
      title: "Requests",
      value: meetings?.length || 0,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Pending",
      value: meetings?.filter(m => m.status === 'pending').length || 0,
      icon: Activity,
      color: "bg-orange-500",
    },
    {
      title: "Slots",
      value: slots?.filter(s => !s.isBooked).length || 0,
      icon: CalendarDays,
      color: "bg-green-600",
    }
  ]

  const isMeetingExpired = (meeting: Meeting) => {
    if (meeting.status === 'done') return true
    if (meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))) return true
    return false
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-8 animate-in fade-in duration-700 pb-32">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/dashboard")}
              className="h-10 w-10 rounded-xl bg-white shadow-sm shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1 md:gap-2">
                  <h1 className="text-lg md:text-2xl font-headline font-bold text-primary truncate">Admin</h1>
                  {isSuperAdmin && <Badge className="bg-accent text-[7px] md:text-[8px] tracking-tight px-1">SUPER</Badge>}
                </div>
                <p className="text-[9px] md:text-xs text-muted-foreground font-medium">Control Center</p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Row - Forced to 3 columns even on small mobile */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-md bg-white rounded-xl md:rounded-2xl overflow-hidden group">
              <CardContent className="p-2 md:p-4 flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-3">
                <div className={cn("h-7 w-7 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0", stat.color)}>
                  <stat.icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                </div>
                <div className="text-center md:text-left min-w-0">
                  <p className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-xs md:text-xl font-headline font-bold text-primary leading-none">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-4 md:space-y-6" onValueChange={setActiveTab}>
          <TabsList className="h-10 md:h-12 bg-white rounded-xl p-1 shadow-sm border-none w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 sm:flex-none rounded-lg px-4 h-full font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 sm:flex-none rounded-lg px-4 h-full font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              Slots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-headline font-bold w-full">Queue</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter client..." 
                  className="pl-9 h-9 md:h-10 bg-white rounded-xl border-none shadow-sm text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl border-none shadow-lg bg-white overflow-hidden">
              {isMeetingsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-10 py-2 pl-4 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Client</TableHead>
                        <TableHead className="h-10 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Status</TableHead>
                        <TableHead className="h-10 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Submitted</TableHead>
                        <TableHead className="h-10 pr-4 text-right font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMeetings.map((req) => (
                        <TableRow key={req.id} className="border-primary/5 group">
                          <TableCell className="py-2 pl-4">
                            <div>
                              <p className="font-bold text-[10px] md:text-xs text-primary truncate max-w-[80px] md:max-w-none">{req.clientName}</p>
                              <p className="text-[8px] md:text-[10px] text-muted-foreground truncate max-w-[80px] md:max-w-none">{req.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : req.status === 'done' ? 'outline' : 'destructive'} 
                              className="text-[7px] md:text-[8px] font-black uppercase px-1 h-4"
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-foreground/70">
                              <span className="whitespace-nowrap">{format(new Date(req.createdAt), "MMM d, p")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            {req.status === 'pending' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2 rounded-lg font-bold text-[9px] md:text-xs"
                                onClick={() => setReviewMeeting(req)}
                              >
                                Review
                              </Button>
                            ) : req.status === 'confirmed' && !isMeetingExpired(req) ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 rounded-lg font-bold text-primary text-[9px] md:text-xs"
                                onClick={() => handleMarkDone(req.id)}
                              >
                                Finish
                              </Button>
                            ) : (
                              <span className="text-[8px] text-muted-foreground italic">Past</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 bg-white/40">
                  <Inbox className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <h3 className="text-sm font-headline font-bold text-muted-foreground/60">Empty</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-headline font-bold">Slots</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-9 md:h-10 rounded-xl bg-primary shadow-md font-bold text-[10px] md:text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md p-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-headline">New Availability</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-center scale-90 md:scale-100">
                      <Calendar 
                        mode="single" 
                        selected={newSlotDate} 
                        onSelect={(d) => d && setNewSlotDate(d)}
                        className="rounded-xl border bg-white"
                        disabled={(d) => d < startOfDay(new Date())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-primary/60 px-1">Start</label>
                        <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-10 rounded-xl text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-primary/60 px-1">End</label>
                        <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-10 rounded-xl text-xs" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button onClick={handleAddSlot} className="w-full h-11 rounded-xl font-bold text-xs">CREATE</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-xl md:rounded-2xl border-none shadow-lg bg-white overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-10 py-2 pl-4 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Date</TableHead>
                        <TableHead className="h-10 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Time</TableHead>
                        <TableHead className="h-10 font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Status</TableHead>
                        <TableHead className="h-10 pr-4 text-right font-black uppercase text-primary/60 tracking-widest text-[8px] md:text-[10px]">Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className="border-primary/5">
                          <TableCell className="py-2 pl-4 font-bold text-[10px] md:text-xs">
                            {format(new Date(slot.startTime), "MMM d")}
                          </TableCell>
                          <TableCell className="text-[10px] md:text-xs font-medium whitespace-nowrap">
                            {format(new Date(slot.startTime), "p")}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={slot.isBooked ? "destructive" : "secondary"}
                              className="text-[7px] md:text-[8px] px-1 h-4"
                            >
                              {slot.isBooked ? "Booked" : "Free"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="h-7 w-7 text-destructive rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 bg-white/40">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <h3 className="text-sm font-headline font-bold text-muted-foreground/60">No Slots</h3>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] md:max-w-4xl rounded-2xl overflow-hidden p-0 border-none shadow-2xl bg-white">
          <div className="flex flex-col md:flex-row max-h-[85vh] overflow-y-auto">
            {/* Form Section */}
            <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl font-headline font-bold text-primary">Verify Request</DialogTitle>
                <p className="text-[10px] md:text-xs text-muted-foreground">Approve with link or reject with feedback.</p>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-muted/30 space-y-1 border border-muted/20">
                  <p className="text-[8px] md:text-[9px] font-black text-primary/60 uppercase">Agenda</p>
                  <p className="text-xs font-medium italic text-foreground/80 leading-snug">"{reviewMeeting?.description}"</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] md:text-[9px] font-black text-primary/60 uppercase px-1">Meet Link (Approval)</label>
                  <Input 
                    placeholder="https://meet.google.com/..." 
                    className="h-10 rounded-xl bg-muted/20 text-xs"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] md:text-[9px] font-black text-primary/60 uppercase px-1">Feedback (Rejection)</label>
                  <Textarea 
                    placeholder="Why was this rejected?" 
                    className="min-h-[60px] rounded-xl bg-muted/20 text-xs"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="destructive" 
                  className="flex-1 h-10 rounded-xl font-bold uppercase text-[9px] md:text-xs"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                <Button 
                  className="flex-1 h-10 rounded-xl font-bold uppercase text-[9px] md:text-xs"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  Approve
                </Button>
              </div>
            </div>

            {/* Always Visible Proof Image */}
            <div className="w-full md:w-[300px] bg-muted/10 p-4 border-t md:border-t-0 md:border-l border-muted/20">
              <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase text-center mb-2">Payment Receipt</p>
              <div className="aspect-[3/4] w-full rounded-xl overflow-hidden shadow-lg bg-white border-2 border-white group relative">
                <img 
                  src={reviewMeeting?.paymentProofUrl} 
                  className="object-contain w-full h-full bg-muted/5 transition-transform duration-500 group-hover:scale-105" 
                  alt="Payment Proof" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/600/800" }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <p className="text-white text-[8px] font-black uppercase tracking-widest">Full Image</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
