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
      title: "Total Requests",
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
      title: "Available Slots",
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
    <div className="min-h-screen bg-background p-3 md:p-8 lg:p-12 animate-in fade-in duration-700 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-3xl font-headline font-bold text-primary">Admin Console</h1>
                {isSuperAdmin && <Badge className="bg-accent text-[8px] md:text-[9px] tracking-widest px-1.5">SUPER ADMIN</Badge>}
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground font-medium">Manage queue and availability.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-xl bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
              <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", stat.color)}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                  <p className="text-xl md:text-2xl lg:text-3xl font-headline font-bold text-primary leading-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-4 md:space-y-6" onValueChange={setActiveTab}>
          <TabsList className="h-12 md:h-14 bg-white rounded-xl md:rounded-2xl p-1 shadow-lg border-none w-full sm:w-auto overflow-hidden">
            <TabsTrigger value="requests" className="flex-1 sm:flex-none rounded-lg md:rounded-xl px-4 md:px-6 h-full font-bold text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 sm:flex-none rounded-lg md:rounded-xl px-4 md:px-6 h-full font-bold text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              Slots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-headline font-bold w-full">Client Requests</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter client..." 
                  className="pl-10 h-10 md:h-12 bg-white rounded-xl md:rounded-2xl border-none shadow-xl text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl md:rounded-3xl border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isMeetingsLoading ? (
                <div className="p-6 md:p-8 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 md:h-14 w-full rounded-xl" />)}
                </div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/5 hover:bg-transparent">
                        <TableHead className="py-4 md:py-5 pl-4 md:pl-6 font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Client</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Status</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Date</TableHead>
                        <TableHead className="pr-4 md:pr-6 text-right font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMeetings.map((req) => (
                        <TableRow key={req.id} className="border-primary/5 group">
                          <TableCell className="py-3 md:py-4 pl-4 md:pl-6">
                            <div>
                              <p className="font-bold text-xs md:text-sm text-primary line-clamp-1">{req.clientName}</p>
                              <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1">{req.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge 
                                variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : req.status === 'done' ? 'outline' : 'destructive'} 
                                className="w-fit text-[8px] md:text-[9px] font-black uppercase px-1.5 md:px-2"
                              >
                                {req.status}
                              </Badge>
                              {isMeetingExpired(req) && req.status === 'confirmed' && (
                                <span className="text-[8px] text-muted-foreground italic">Exp.</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-foreground/70">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="whitespace-nowrap">{format(new Date(req.createdAt), "MMM d")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 md:pr-6 text-right">
                            {req.status === 'pending' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 md:h-9 px-2 md:px-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs"
                                onClick={() => setReviewMeeting(req)}
                              >
                                Review
                              </Button>
                            ) : req.status === 'confirmed' && !isMeetingExpired(req) ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 md:h-9 px-2 md:px-3 rounded-lg md:rounded-xl font-bold text-primary text-[10px] md:text-xs"
                                onClick={() => handleMarkDone(req.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finish
                              </Button>
                            ) : (
                              <span className="text-[9px] md:text-[10px] text-muted-foreground italic">Ended</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 md:py-24 bg-white/40">
                  <Inbox className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <h3 className="text-lg font-headline font-bold text-muted-foreground/60">No Requests</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-headline font-bold">Manage Slots</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 md:h-12 rounded-xl md:rounded-2xl bg-primary shadow-xl shadow-primary/20 font-bold gap-2 text-xs md:text-sm">
                    <Plus className="h-4 w-4" /> New Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] max-w-[calc(100vw-2rem)] sm:max-w-md p-4 md:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline">Add Availability</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-center">
                      <Calendar 
                        mode="single" 
                        selected={newSlotDate} 
                        onSelect={(d) => d && setNewSlotDate(d)}
                        className="rounded-2xl border bg-white shadow-sm"
                        disabled={(d) => d < startOfDay(new Date())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/60 px-1">Start Time</label>
                        <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-primary/5" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/60 px-1">End Time</label>
                        <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-11 rounded-xl bg-muted/20 border-primary/5" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-6 sm:flex-col sm:space-x-0">
                    <Button onClick={handleAddSlot} className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-wider">CREATE SLOT</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-2xl md:rounded-3xl border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-6 md:p-8 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 md:h-14 w-full rounded-xl" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/5 hover:bg-transparent">
                        <TableHead className="py-4 md:py-5 pl-4 md:pl-6 font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Time</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Status</TableHead>
                        <TableHead className="pr-4 md:pr-6 text-right font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[10px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className="border-primary/5">
                          <TableCell className="py-3 md:py-4 pl-4 md:pl-6">
                            <span className="font-bold text-xs md:text-sm">{format(new Date(slot.startTime), "MMM d")}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-[9px] md:text-sm text-foreground/80 whitespace-nowrap">
                              {format(new Date(slot.startTime), "p")} – {format(new Date(slot.endTime), "p")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={slot.isBooked ? "destructive" : "secondary"}
                              className="font-black text-[8px] uppercase px-1.5"
                            >
                              {slot.isBooked ? "Booked" : "Free"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-4 md:pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
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
                <div className="text-center py-16 md:py-24 bg-white/40">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <h3 className="text-lg font-headline font-bold text-muted-foreground/60">No Slots</h3>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] md:max-w-4xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-3xl bg-white">
          <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
            <div className="flex-1 p-5 md:p-10 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-headline font-bold text-primary">Verification</DialogTitle>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">Verify payment and meeting details.</p>
              </DialogHeader>
              
              <div className="space-y-4 md:space-y-6">
                <div className="p-4 rounded-2xl bg-muted/30 space-y-2 border border-muted/20">
                  <p className="text-[9px] md:text-[10px] font-black text-primary/60 uppercase tracking-widest">Client Message</p>
                  <p className="text-xs md:text-sm font-medium leading-relaxed italic text-foreground/80">"{reviewMeeting?.description}"</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-primary/60 uppercase tracking-widest px-1">Meeting Link (Approved)</label>
                  <div className="relative">
                    <Input 
                      placeholder="e.g., https://meet.google.com/abc" 
                      className="h-11 rounded-xl bg-muted/20 border-primary/10 text-sm pr-10"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                    />
                    <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-primary/60 uppercase tracking-widest px-1">Reason (Rejected)</label>
                  <Textarea 
                    placeholder="Provide feedback..." 
                    className="min-h-[80px] rounded-xl bg-muted/20 border-primary/10 text-sm"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="destructive" 
                  className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wide text-[10px] md:text-xs"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  Reject & Notify
                </Button>
                <Button 
                  className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wide text-[10px] md:text-xs shadow-xl shadow-primary/20"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  Approve & Confirm
                </Button>
              </div>
            </div>

            <div className="w-full md:w-[320px] lg:w-[380px] bg-muted/30 p-5 md:p-8 flex flex-col items-center border-t md:border-t-0 md:border-l border-muted/30">
              <div className="w-full space-y-4">
                <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Payment Proof</p>
                <div className="aspect-[3/4] w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-white border-4 border-white group relative">
                  <img 
                    src={reviewMeeting?.paymentProofUrl} 
                    className="object-contain w-full h-full bg-muted/10 transition-transform duration-500 group-hover:scale-105" 
                    alt="Proof" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/600/800" }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white text-[9px] font-black uppercase tracking-widest">Receipt View</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
