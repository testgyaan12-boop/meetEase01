"use client"

import { useState, useEffect } from "react"
import { useMemoFirebase, useFirestore, useCollection, updateDocumentNonBlocking, useDoc, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { format, setHours, setMinutes, isPast } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Meeting, AvailableSlot } from "@/lib/types"

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Slot states
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null)
  const [newSlotDateStr, setNewSlotDateStr] = useState(format(new Date(), "yyyy-MM-dd"))
  const [startTimeStr, setStartTimeStr] = useState("09:00")
  const [endTimeStr, setEndTimeStr] = useState("10:00")

  // Review states
  const [reviewMeeting, setReviewMeeting] = useState<Meeting | null>(null)
  const [meetingLink, setMeetingLink] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

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
  const { data: slots, isLoading: isSlotsLoading } = useCollection<AvailableSlot>(slotsQuery)

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading && user && !hasAdminAccess) {
      toast({ title: "Access Denied", variant: "destructive" })
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
    toast({ title: "Request Approved" })
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
    toast({ title: "Request Rejected" })
    setReviewMeeting(null)
    setAdminNotes("")
    setIsProcessing(false)
  }

  const handleAddSlot = () => {
    if (!firestore) return
    const dateObj = new Date(newSlotDateStr)
    const [sH, sM] = startTimeStr.split(":").map(Number)
    const [eH, eM] = endTimeStr.split(":").map(Number)
    const startTime = setMinutes(setHours(dateObj, sH), sM).toISOString()
    const endTime = setMinutes(setHours(dateObj, eH), eM).toISOString()

    // Conflict check
    const isDuplicate = slots?.some(s => s.startTime === startTime && s.endTime === endTime)
    if (isDuplicate) {
      toast({ title: "Slot Conflict", description: "This time slot already exists.", variant: "destructive" })
      return
    }

    addDocumentNonBlocking(collection(firestore, "availableSlots"), {
      startTime,
      endTime,
      isBooked: false,
      isActive: true,
    })

    toast({ title: "Slot Created Successfully" })
    setIsAddSlotOpen(false)
  }

  const toggleSlotActive = (slot: AvailableSlot) => {
    if (!firestore) return
    const slotRef = doc(firestore, "availableSlots", slot.id)
    updateDocumentNonBlocking(slotRef, { isActive: !slot.isActive })
    toast({ title: `Slot ${!slot.isActive ? 'Enabled' : 'Disabled'}` })
  }

  const confirmDeleteSlot = () => {
    if (!firestore || !slotToDelete) return
    deleteDocumentNonBlocking(doc(firestore, "availableSlots", slotToDelete))
    toast({ title: "Slot Deleted", variant: "destructive" })
    setSlotToDelete(null)
  }

  const getMeetingStatus = (req: Meeting) => {
    if (req.status === 'confirmed' && req.slotEndTime && isPast(new Date(req.slotEndTime))) {
      return { label: "Done", variant: "outline" as const }
    }
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      rejected: "destructive",
      done: "outline"
    }
    return { label: req.status, variant: variants[req.status] || "secondary" }
  }

  if (isUserLoading || (isAdminLoading && !isSuperAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-500 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/dashboard")} 
            className="h-12 w-12 rounded-2xl bg-white shadow-sm border-primary/10 hover:bg-primary/5"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-headline font-bold text-primary flex items-center gap-3">
              Admin Workspace
              {isSuperAdmin && <Badge className="bg-accent text-[10px] py-0.5 px-2">SUPER ADMIN</Badge>}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">Manage consultations and availability</p>
          </div>
        </header>

        {/* Forced 3 columns on all screens for stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: "Requests", value: meetings?.length || 0, icon: Users, color: "bg-blue-600" },
            { title: "Pending", value: meetings?.filter(m => m.status === 'pending').length || 0, icon: Activity, color: "bg-orange-500" },
            { title: "Open Slots", value: slots?.filter(s => !s.isBooked && s.isActive).length || 0, icon: CalendarDays, color: "bg-green-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
                <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                  <p className="text-xl md:text-3xl font-headline font-bold text-primary">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-8">
          <TabsList className="bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 rounded-xl px-8 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Queue</TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 rounded-xl px-8 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <h2 className="text-2xl font-headline font-bold text-primary">Pending Reviews</h2>
              <div className="relative w-full sm:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search client name or email..." 
                  className="pl-12 h-14 bg-white rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-primary/5">
              {isMeetingsLoading ? (
                <div className="p-12 space-y-6"><Skeleton className="h-16 w-full rounded-2xl" /><Skeleton className="h-16 w-full rounded-2xl" /></div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent border-primary/10">
                      <TableHead className="py-6 pl-10 font-black text-[11px] uppercase text-primary/60 tracking-widest">Client</TableHead>
                      <TableHead className="font-black text-[11px] uppercase text-primary/60 tracking-widest">Status</TableHead>
                      <TableHead className="font-black text-[11px] uppercase text-primary/60 tracking-widest text-right pr-10">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map((req) => {
                      const status = getMeetingStatus(req)
                      return (
                        <TableRow key={req.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                          <TableCell className="pl-10 py-6">
                            <p className="font-bold text-base group-hover:text-primary transition-colors">{req.clientName}</p>
                            <p className="text-xs text-muted-foreground font-medium">{req.clientEmail}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="text-[10px] uppercase font-black px-3 py-1 rounded-lg">
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <Button 
                              variant="ghost" 
                              className="h-10 rounded-xl px-6 font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white transition-all"
                              onClick={() => {
                                setReviewMeeting(req)
                                setMeetingLink(req.meetingLink || "")
                                setAdminNotes(req.adminNotes || "")
                              }}
                            >
                              Review Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-32 space-y-4">
                  <Inbox className="mx-auto h-20 w-20 text-muted/10" />
                  <p className="text-xl font-bold text-muted-foreground">No matching requests found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-primary">Availability Management</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-xl shadow-primary/20">
                    <Plus className="mr-2 h-5 w-5" /> New Availability
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-md p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline font-bold text-primary">Create Slot</DialogTitle>
                    <DialogDescription>Define a new window for consultations.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-primary/60 tracking-widest ml-1">Select Date (Native)</label>
                      <Input 
                        type="date" 
                        value={newSlotDateStr} 
                        onChange={(e) => setNewSlotDateStr(e.target.value)} 
                        className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-bold" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-primary/60 tracking-widest ml-1">Start Time</label>
                        <Input 
                          type="time" 
                          value={startTimeStr} 
                          onChange={(e) => setStartTimeStr(e.target.value)} 
                          className="h-14 rounded-2xl bg-muted/30 border-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-primary/60 tracking-widest ml-1">End Time</label>
                        <Input 
                          type="time" 
                          value={endTimeStr} 
                          onChange={(e) => setEndTimeStr(e.target.value)} 
                          className="h-14 rounded-2xl bg-muted/30 border-none font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-8">
                    <Button onClick={handleAddSlot} className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-white shadow-xl shadow-primary/20">
                      SAVE AVAILABILITY
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-primary/5">
              {isSlotsLoading ? (
                <div className="p-12"><Skeleton className="h-24 w-full rounded-2xl" /></div>
              ) : slots && slots.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent border-primary/10">
                      <TableHead className="py-6 pl-10 font-black text-[11px] uppercase text-primary/60 tracking-widest">Time Slot</TableHead>
                      <TableHead className="font-black text-[11px] uppercase text-primary/60 tracking-widest">Status</TableHead>
                      <TableHead className="font-black text-[11px] uppercase text-primary/60 tracking-widest">Visibility</TableHead>
                      <TableHead className="pr-10 text-right font-black text-[11px] uppercase text-primary/60 tracking-widest">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                        <TableCell className="pl-10 py-6">
                          <p className="font-bold text-base">{format(new Date(slot.startTime), "EEEE, MMM d")}</p>
                          <p className="text-xs text-muted-foreground font-bold">{format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}</p>
                        </TableCell>
                        <TableCell>
                          {slot.isBooked ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-wide">BOOKED</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-black tracking-wide">AVAILABLE</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={slot.isActive} 
                              onCheckedChange={() => toggleSlotActive(slot)} 
                              disabled={slot.isBooked}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{slot.isActive ? 'Visible' : 'Hidden'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-10 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSlotToDelete(slot.id)} 
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                            disabled={slot.isBooked}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-32 space-y-4">
                  <CalendarIcon className="mx-auto h-20 w-20 text-muted/10" />
                  <p className="text-xl font-bold text-muted-foreground">No slots defined yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Deletion Confirmation */}
      <AlertDialog open={!!slotToDelete} onOpenChange={() => setSlotToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-headline font-bold text-primary">Remove Availability?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium pt-2">
              This will permanently delete this time slot. Users will no longer be able to book it. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-10 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl border-none bg-muted font-bold text-lg hover:bg-muted/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSlot} className="h-14 rounded-2xl bg-destructive text-white font-black text-lg shadow-xl shadow-destructive/20">
              DELETE PERMANENTLY
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog with Always-On Proof */}
      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-5xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-10 overflow-y-auto space-y-8 scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-3xl font-headline font-bold text-primary">Review Application</DialogTitle>
                <DialogDescription className="text-base font-medium">Verify credentials and respond to the requester.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-primary" />
                  <h4 className="text-[11px] font-black uppercase text-primary/60 tracking-widest">User Objective</h4>
                </div>
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 text-base font-medium leading-relaxed italic text-primary/80">
                  "{reviewMeeting?.description}"
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-primary/60 tracking-widest ml-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Meeting Link (For Approval)
                  </label>
                  <Input 
                    placeholder="https://meet.google.com/abc-defg-hij" 
                    className="h-14 rounded-2xl bg-white border-2 border-primary/5 focus:border-primary/20 font-medium" 
                    value={meetingLink} 
                    onChange={(e) => setMeetingLink(e.target.value)} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-primary/60 tracking-widest ml-1 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" /> Rejection Remarks
                  </label>
                  <Textarea 
                    placeholder="Provide a reason if rejecting..." 
                    className="min-h-[100px] rounded-2xl bg-white border-2 border-primary/5 focus:border-primary/20 font-medium p-4" 
                    value={adminNotes} 
                    onChange={(e) => setAdminNotes(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-6 sticky bottom-0 bg-white">
                <Button 
                  variant="destructive" 
                  className="flex-1 h-14 rounded-2xl font-black text-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-none" 
                  onClick={handleReject} 
                  disabled={isProcessing}
                >
                  Reject Request
                </Button>
                <Button 
                  className="flex-1 h-14 rounded-2xl font-black text-lg bg-primary text-white shadow-xl shadow-primary/20 transition-all" 
                  onClick={handleApprove} 
                  disabled={isProcessing}
                >
                  Approve & Notify
                </Button>
              </div>
            </div>

            {/* Permanent Proof Sidebar */}
            <div className="w-full md:w-[380px] bg-muted/20 p-8 border-l flex flex-col items-center shrink-0">
              <div className="w-full space-y-4 mb-6">
                <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-widest text-center">Transaction Proof</h4>
                <div className="h-px w-full bg-muted-foreground/10" />
              </div>
              <div className="w-full aspect-[3/4] rounded-3xl bg-white shadow-2xl overflow-hidden p-3 group relative cursor-zoom-in">
                <img 
                  src={reviewMeeting?.paymentProofUrl} 
                  className="w-full h-full object-contain rounded-2xl transition-transform group-hover:scale-110" 
                  alt="Payment Receipt" 
                />
                <a 
                  href={reviewMeeting?.paymentProofUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-6 right-6 h-12 w-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity border"
                >
                  <ExternalLink className="h-6 w-6" />
                </a>
              </div>
              <p className="mt-6 text-xs text-muted-foreground font-bold italic">Verify recipient and amount match</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}