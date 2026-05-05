
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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
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
import { format, setHours, setMinutes, startOfToday } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { Meeting, AvailableSlot } from "@/lib/types"
import { NotificationListener } from "@/components/admin/NotificationListener"

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Slot states
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null)
  const [startTimeStr, setStartTimeStr] = useState("09:00")
  const [endTimeStr, setEndTimeStr] = useState("10:00")

  // Review states
  const [reviewMeeting, setReviewMeeting] = useState<Meeting | null>(null)
  const [meetingLink, setMeetingLink] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProofExpanded, setIsProofExpanded] = useState(false)

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
      toast({ title: "Link Required", description: "Meeting link is mandatory for approval.", variant: "destructive" })
      return
    }
    setIsProcessing(true)
    const meetingRef = doc(firestore, "meetings", reviewMeeting.id)
    updateDocumentNonBlocking(meetingRef, { 
      status: 'confirmed',
      meetingLink: meetingLink,
      updatedAt: new Date().toISOString()
    })
    toast({ title: "Approved Successfully" })
    setReviewMeeting(null)
    setMeetingLink("")
    setIsProcessing(false)
  }

  const handleReject = () => {
    if (!firestore || !reviewMeeting) return
    if (!adminNotes.trim()) {
      toast({ title: "Reason Required", description: "Provide a reason for rejection.", variant: "destructive" })
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
    // Using a placeholder date (epoch) for recurring slots
    const baseDate = startOfToday()
    const [sH, sM] = startTimeStr.split(":").map(Number)
    const [eH, eM] = endTimeStr.split(":").map(Number)
    const startTime = setMinutes(setHours(baseDate, sH), sM).toISOString()
    const endTime = setMinutes(setHours(baseDate, eH), eM).toISOString()

    addDocumentNonBlocking(collection(firestore, "availableSlots"), {
      startTime,
      endTime,
      isBooked: false, // Default false, dynamic checks used in picker
      isActive: true,
    })

    toast({ title: "Daily Slot Created" })
    setIsAddSlotOpen(false)
  }

  const toggleSlotActive = (slot: AvailableSlot) => {
    if (!firestore) return
    const slotRef = doc(firestore, "availableSlots", slot.id)
    updateDocumentNonBlocking(slotRef, { isActive: !slot.isActive })
  }

  const confirmDeleteSlot = () => {
    if (!firestore || !slotToDelete) return
    deleteDocumentNonBlocking(doc(firestore, "availableSlots", slotToDelete))
    toast({ title: "Slot Removed", variant: "destructive" })
    setSlotToDelete(null)
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
      <NotificationListener />
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/dashboard")} 
            className="h-12 w-12 rounded-xl bg-card shadow-sm border-primary/10"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-headline font-bold text-primary flex items-center gap-2">
              Admin Panel
              {isSuperAdmin && <Badge className="bg-accent text-[8px] py-0">SUPER</Badge>}
            </h1>
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground tracking-tight">Manage your professional schedule</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { title: "Total Requests", value: meetings?.length || 0, icon: Users, color: "bg-blue-600" },
            { title: "Pending", value: meetings?.filter(m => m.status === 'pending').length || 0, icon: Activity, color: "bg-orange-500" },
            { title: "Daily Slots", value: slots?.filter(s => s.isActive).length || 0, icon: CalendarDays, color: "bg-green-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="border-none shadow-xl bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-3 md:p-6 flex flex-col items-center text-center gap-1 md:gap-3">
                <div className={cn("h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-[7px] md:text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                  <p className="text-sm md:text-3xl font-headline font-bold text-primary">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-card rounded-xl p-1 shadow-sm border border-primary/10 w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 rounded-lg px-6 py-2.5 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Queue</TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 rounded-lg px-6 py-2.5 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Daily Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg md:text-xl font-headline font-bold text-primary">Pending Approvals</h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Find client..." 
                  className="pl-10 h-11 bg-card rounded-xl border-none shadow-lg focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-card shadow-2xl overflow-hidden border border-primary/5">
              {isMeetingsLoading ? (
                <div className="p-10 space-y-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent border-primary/10">
                      <TableHead className="py-5 pl-8 font-black text-[10px] uppercase tracking-widest text-primary/60">Client</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary/60">Status</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest text-primary/60">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map((req) => (
                      <TableRow key={req.id} className="hover:bg-primary/5 border-primary/5">
                        <TableCell className="pl-8 py-4">
                          <p className="font-bold text-sm text-foreground">{req.clientName}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{req.clientEmail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[8px] uppercase font-black px-2 py-0.5">
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 rounded-lg font-bold text-xs bg-primary/5 hover:bg-primary hover:text-white"
                            onClick={() => {
                              setReviewMeeting(req)
                              setMeetingLink(req.meetingLink || "")
                              setAdminNotes(req.adminNotes || "")
                              setIsProofExpanded(false)
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <Inbox className="mx-auto h-12 w-12 text-muted/20" />
                  <p className="mt-2 font-bold text-muted-foreground">No records found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-headline font-bold text-primary">Recurring Slots</h2>
                <p className="text-xs text-muted-foreground font-medium">These windows repeat daily unless deactivated.</p>
              </div>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Add Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-sm p-8 bg-card border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline font-bold text-primary">New Daily Window</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">Add a recurring time slot for daily consultations.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-primary/60 ml-1">Start Time</label>
                        <Input 
                          type="time" 
                          value={startTimeStr} 
                          onChange={(e) => setStartTimeStr(e.target.value)} 
                          className="h-12 rounded-xl bg-muted/40 border-none font-bold text-foreground" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-primary/60 ml-1">End Time</label>
                        <Input 
                          type="time" 
                          value={endTimeStr} 
                          onChange={(e) => setEndTimeStr(e.target.value)} 
                          className="h-12 rounded-xl bg-muted/40 border-none font-bold text-foreground" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button onClick={handleAddSlot} className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20">
                      CREATE RECURRING SLOT
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-2xl bg-card shadow-2xl overflow-hidden border border-primary/5">
              {isSlotsLoading ? (
                <div className="p-10"><Skeleton className="h-16 w-full" /></div>
              ) : slots && slots.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="hover:bg-transparent border-primary/10">
                      <TableHead className="py-5 pl-8 font-black text-[10px] uppercase tracking-widest text-primary/60">Daily Time Range</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-primary/60">Display Status</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest text-primary/60">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id} className="hover:bg-primary/5 border-primary/5">
                        <TableCell className="pl-8 py-4">
                          <p className="font-bold text-sm text-foreground">
                            {format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold">Appears for every user selected date</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={slot.isActive} 
                              onCheckedChange={() => toggleSlotActive(slot)} 
                              className="data-[state=checked]:bg-primary h-5 w-9"
                            />
                            <span className="text-[9px] font-black uppercase opacity-60 text-foreground">
                              {slot.isActive ? 'Active Daily' : 'Paused'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSlotToDelete(slot.id)} 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted/20" />
                  <p className="mt-2 font-bold text-muted-foreground">No recurring slots defined</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!slotToDelete} onOpenChange={() => setSlotToDelete(null)}>
        <AlertDialogContent className="rounded-2xl p-8 max-w-sm bg-card border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-headline font-bold text-foreground">Remove Slot?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium pt-1 text-muted-foreground">
              This will permanently delete this recurring time window.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl border-none bg-muted font-bold text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSlot} className="h-11 rounded-xl bg-destructive text-white font-bold shadow-xl shadow-destructive/20">
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-2xl md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 scrollbar-hide order-2 md:order-1">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-headline font-bold text-primary">Verify Request</DialogTitle>
                <DialogDescription className="text-xs md:text-sm font-medium text-muted-foreground">Review client agenda and payment proof.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="md:hidden">
                  <Collapsible open={isProofExpanded} onOpenChange={setIsProofExpanded} className="rounded-2xl bg-muted/20 border border-primary/5 overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 hover:bg-primary/5">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">Transaction Proof</span>
                        </div>
                        {isProofExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 border-t border-primary/5">
                      <div className="flex flex-col items-center">
                        <div className="w-full aspect-[3/4] rounded-xl bg-card shadow-lg overflow-hidden p-1 relative border border-primary/5">
                          {reviewMeeting?.paymentProofUrl ? (
                            <img 
                              src={reviewMeeting.paymentProofUrl} 
                              className="w-full h-full object-contain rounded-lg" 
                              alt="Payment Proof Mobile" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                              <Inbox className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                          {reviewMeeting?.paymentProofUrl && (
                            <a 
                              href={reviewMeeting.paymentProofUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="absolute bottom-2 right-2 h-8 w-8 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="p-4 md:p-5 rounded-2xl bg-primary/5 border border-primary/10">
                  <h4 className="text-[10px] font-black uppercase text-primary/60 mb-2 tracking-widest">Meeting Objective</h4>
                  <p className="text-xs md:text-sm font-medium italic text-primary/80 leading-relaxed">"{reviewMeeting?.description}"</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> Virtual Link (Google Meet/Zoom)
                    </label>
                    <Input 
                      placeholder="https://..." 
                      className="h-11 md:h-12 rounded-xl border-2 border-primary/5 focus:border-primary/20 bg-muted/20 font-medium text-foreground text-sm" 
                      value={meetingLink} 
                      onChange={(e) => setMeetingLink(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary/60 ml-1 flex items-center gap-1.5">
                      <XCircle className="h-3 w-3 text-destructive" /> Rejection Remarks
                    </label>
                    <Textarea 
                      placeholder="Reason for rejection..." 
                      className="min-h-[80px] rounded-xl border-2 border-primary/5 focus:border-primary/20 bg-muted/20 font-medium text-foreground text-sm" 
                      value={adminNotes} 
                      onChange={(e) => setAdminNotes(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex flex-row gap-3 md:gap-4 pt-4 sticky bottom-0 bg-card border-t border-primary/5 mt-auto">
                  <Button 
                    variant="destructive" 
                    className="flex-1 h-11 md:h-12 rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-xs md:text-sm" 
                    onClick={handleReject} 
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 h-11 md:h-12 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 text-xs md:text-sm" 
                    onClick={handleApprove} 
                    disabled={isProcessing}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>

            <div className="hidden md:flex w-[320px] bg-muted/20 p-8 border-l border-primary/5 flex-col items-center shrink-0 order-2">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Transaction Proof</h4>
              <div className="w-full aspect-[3/4] rounded-2xl bg-card shadow-xl overflow-hidden p-2 group relative border border-primary/5">
                {reviewMeeting?.paymentProofUrl ? (
                  <img 
                    src={reviewMeeting.paymentProofUrl} 
                    className="w-full h-full object-contain rounded-xl transition-transform hover:scale-105" 
                    alt="Actual Payment Proof" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
                    <Inbox className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {reviewMeeting?.paymentProofUrl && (
                  <a 
                    href={reviewMeeting.paymentProofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute bottom-3 right-3 h-10 w-10 bg-card rounded-lg shadow-xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity border border-primary/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground font-bold italic text-center">Verified Client Document</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
