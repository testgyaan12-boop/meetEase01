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
  MessageSquare,
  AlertCircle
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
import { format, setHours, setMinutes, isPast } from "date-fns"
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
    if (!adminNotes) {
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
      description: "Lifetime requests"
    },
    {
      title: "Pending",
      value: meetings?.filter(m => m.status === 'pending').length || 0,
      icon: Activity,
      color: "bg-orange-500",
      description: "Needs review"
    },
    {
      title: "Available",
      value: slots?.filter(s => !s.isBooked).length || 0,
      icon: CalendarDays,
      color: "bg-green-600",
      description: "Open sessions"
    }
  ]

  const isMeetingExpired = (meeting: Meeting) => {
    if (meeting.status === 'done') return true
    if (meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))) return true
    return false
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 animate-in fade-in duration-700 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-[1.5rem] md:rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <ShieldCheck className="h-8 w-8 md:h-9 md:u-9 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-headline font-bold text-primary tracking-tight">Admin Control</h1>
                {isSuperAdmin && <Badge className="bg-accent text-white font-black px-3 py-1 text-[10px] tracking-widest">SUPER ADMIN</Badge>}
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-medium">Manage requests and availability.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-xl bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
                <div className={cn("h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", stat.color)}>
                  <stat.icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div>
                  <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl md:text-4xl font-headline font-bold text-primary">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="h-14 md:h-16 bg-white rounded-2xl md:rounded-3xl p-1.5 md:p-2 shadow-xl border-none">
            <TabsTrigger value="requests" className="rounded-xl md:rounded-2xl px-6 md:px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="rounded-xl md:rounded-2xl px-6 md:px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-headline font-bold">Request Queue</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search clients..." 
                  className="pl-12 h-12 md:h-14 bg-white rounded-xl md:rounded-2xl border-none shadow-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isMeetingsLoading ? (
                <div className="p-12 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Client</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Date</TableHead>
                        <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMeetings.map((req) => (
                        <TableRow key={req.id} className="border-primary/5 group">
                          <TableCell className="py-6 md:py-8 pl-8">
                            <div>
                              <p className="font-bold text-base md:text-lg text-primary">{req.clientName}</p>
                              <p className="text-xs font-medium text-muted-foreground">{req.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge 
                                variant={req.status === 'pending' ? 'secondary' : req.status === 'confirmed' ? 'default' : req.status === 'done' ? 'outline' : 'destructive'} 
                                className="w-fit px-3 py-1 rounded-lg font-black text-[9px] md:text-[10px] uppercase tracking-widest"
                              >
                                {req.status}
                              </Badge>
                              {isMeetingExpired(req) && req.status === 'confirmed' && (
                                <Badge variant="secondary" className="w-fit text-[8px] opacity-70">AUTO-DONE</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-foreground/70">
                              <Clock className="h-4 w-4 text-primary/50" />
                              <span>{format(new Date(req.createdAt), "MMM d, p")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'pending' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-10 px-4 rounded-xl font-bold"
                                  onClick={() => setReviewMeeting(req)}
                                >
                                  Review
                                </Button>
                              ) : req.status === 'confirmed' && !isMeetingExpired(req) ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-10 px-4 rounded-xl font-bold text-primary hover:bg-primary/5"
                                  onClick={() => handleMarkDone(req.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Done
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic font-medium">No actions</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-32 bg-white/40">
                  <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground/60">No Requests Found</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-headline font-bold">Manage Availability</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary shadow-xl shadow-primary/20 font-bold gap-2">
                    <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Add</span> Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] md:rounded-[2.5rem] max-w-sm md:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Slot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <Calendar 
                      mode="single" 
                      selected={newSlotDate} 
                      onSelect={(d) => d && setNewSlotDate(d)}
                      className="mx-auto rounded-2xl border bg-white"
                      disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Start</label>
                        <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">End</label>
                        <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-8">
                    <Button onClick={handleAddSlot} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-bold shadow-xl shadow-primary/20">CREATE SLOT</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-12 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Time Range</TableHead>
                        <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                        <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className="border-primary/5">
                          <TableCell className="py-6 md:py-8 pl-8">
                            <span className="font-bold text-base md:text-lg">{format(new Date(slot.startTime), "PPP")}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm md:text-lg text-foreground/80">
                              {format(new Date(slot.startTime), "p")} – {format(new Date(slot.endTime), "p")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={slot.isBooked ? "destructive" : "secondary"}
                              className="font-black text-[9px] md:text-[10px] uppercase tracking-widest px-3"
                            >
                              {slot.isBooked ? "Booked" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-32 bg-white/40">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground/60">No Slots Defined</h3>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] overflow-hidden p-0 gap-0">
          <div className="grid md:grid-cols-2">
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Review Request</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/50 space-y-2">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Client Message</p>
                  <p className="text-sm font-medium leading-relaxed italic">"{reviewMeeting?.description}"</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest px-1">Meeting Link (For Approval)</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="https://zoom.us/..." 
                      className="pl-10 h-12 rounded-xl"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest px-1">Remarks (For Rejection)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                      placeholder="Why is this request declined?" 
                      className="pl-10 min-h-[80px] rounded-xl pt-3.5"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="destructive" 
                  className="flex-1 h-12 rounded-xl font-bold shadow-lg"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  REJECT
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  APPROVE
                </Button>
              </div>
            </div>

            <div className="bg-muted flex flex-col items-center justify-center p-8 space-y-4 border-l">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Proof</p>
              <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={reviewMeeting?.paymentProofUrl} 
                  className="object-cover w-full h-full" 
                  alt="Proof" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/600/800" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium text-center italic">Verify transaction details before confirming session.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
