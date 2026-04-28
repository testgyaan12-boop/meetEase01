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
  Check,
  X,
  AlertTriangle
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
      toast({ title: "Error", description: "Meeting link is required.", variant: "destructive" })
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
      toast({ title: "Error", description: "Reason required for rejection.", variant: "destructive" })
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

    // Check for duplicates
    const isDuplicate = slots?.some(s => s.startTime === startTime && s.endTime === endTime)
    if (isDuplicate) {
      toast({ title: "Conflict", description: "A slot with this time already exists.", variant: "destructive" })
      return
    }

    addDocumentNonBlocking(collection(firestore, "availableSlots"), {
      startTime,
      endTime,
      isBooked: false,
      isActive: true,
    })

    toast({ title: "Slot Created" })
    setIsAddSlotOpen(false)
  }

  const toggleSlotActive = (slot: AvailableSlot) => {
    if (!firestore) return
    const slotRef = doc(firestore, "availableSlots", slot.id)
    updateDocumentNonBlocking(slotRef, { isActive: !slot.isActive })
    toast({ title: `Slot ${!slot.isActive ? 'Activated' : 'Deactivated'}` })
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-700 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="h-10 w-10 rounded-xl bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-headline font-bold text-primary flex items-center gap-2">
              Admin Center
              {isSuperAdmin && <Badge className="bg-accent text-[8px]">SUPER</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground">Management Panel</p>
          </div>
        </header>

        {/* Responsive Summary Cards: Forced into 3 columns on mobile */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "Total", value: meetings?.length || 0, icon: Users, color: "bg-blue-600" },
            { title: "Pending", value: meetings?.filter(m => m.status === 'pending').length || 0, icon: Activity, color: "bg-orange-500" },
            { title: "Slots", value: slots?.filter(s => !s.isBooked && s.isActive).length || 0, icon: CalendarDays, color: "bg-green-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="p-3 flex flex-col items-center gap-1">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-white", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">{stat.title}</p>
                  <p className="text-lg font-headline font-bold text-primary">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 rounded-lg px-6 font-bold text-xs">Requests</TabsTrigger>
            <TabsTrigger value="slots" className="flex-1 rounded-lg px-6 font-bold text-xs">Slots Table</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-headline font-bold">Meeting Queue</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter client..." 
                  className="pl-10 h-10 bg-white rounded-xl border-none shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-lg overflow-hidden border border-primary/5">
              {isMeetingsLoading ? (
                <div className="p-8 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase pl-6">Client</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="pl-6">
                          <p className="font-bold text-sm">{req.clientName}</p>
                          <p className="text-[10px] text-muted-foreground">{req.clientEmail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={req.status === 'pending' ? 'secondary' : 'default'} className="text-[9px] uppercase font-black">
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-lg text-xs font-bold"
                            onClick={() => setReviewMeeting(req)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20"><Inbox className="mx-auto h-12 w-12 text-muted/20" /></div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-headline font-bold">Availability Table</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 rounded-xl bg-primary font-bold text-xs"><Plus className="mr-2 h-4 w-4" /> New Slot</Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-sm">
                  <DialogHeader><DialogTitle>Create Slot</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input type="date" value={newSlotDateStr} onChange={(e) => setNewSlotDateStr(e.target.value)} className="h-12 rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-12 rounded-xl" />
                      <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter className="pt-4"><Button onClick={handleAddSlot} className="w-full h-12 rounded-xl font-bold">SAVE SLOT</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-2xl bg-white shadow-lg overflow-hidden border border-primary/5">
              {isSlotsLoading ? (
                <div className="p-8"><Skeleton className="h-20 w-full" /></div>
              ) : slots && slots.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase pl-6">Time Info</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Active</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Booked</TableHead>
                      <TableHead className="font-black text-[10px] uppercase pr-6 text-right">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="pl-6">
                          <p className="font-bold text-sm">{format(new Date(slot.startTime), "MMM d, yyyy")}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}</p>
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={slot.isActive} 
                            onCheckedChange={() => toggleSlotActive(slot)} 
                            disabled={slot.isBooked}
                          />
                        </TableCell>
                        <TableCell>
                          {slot.isBooked ? <Badge className="bg-destructive text-[8px] uppercase">Occupied</Badge> : <Badge variant="secondary" className="text-[8px] uppercase">Open</Badge>}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSlotToDelete(slot.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20"><CalendarIcon className="mx-auto h-12 w-12 text-muted/20" /></div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!slotToDelete} onOpenChange={() => setSlotToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" /> Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this time slot? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSlot} className="bg-destructive rounded-xl">Delete Slot</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog with Always-On Proof */}
      <Dialog open={!!reviewMeeting} onOpenChange={(open) => !open && setReviewMeeting(null)}>
        <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">Verify Request</DialogTitle>
                <DialogDescription>Validate payment and provide meeting details.</DialogDescription>
              </DialogHeader>
              <div className="p-4 rounded-xl bg-muted/20 border text-sm italic font-medium leading-relaxed">"{reviewMeeting?.description}"</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary/60">Meeting Link (Approval)</label>
                  <Input placeholder="https://meet.google.com/..." className="h-12 rounded-xl" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary/60">Remarks (Rejection)</label>
                  <Textarea placeholder="Reason for rejection..." className="min-h-[80px] rounded-xl" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="destructive" className="flex-1 h-12 rounded-xl font-bold" onClick={handleReject} disabled={isProcessing}>Reject</Button>
                <Button className="flex-1 h-12 rounded-xl font-bold bg-primary" onClick={handleApprove} disabled={isProcessing}>Approve</Button>
              </div>
            </div>
            {/* Proof Sidebar */}
            <div className="w-full md:w-[320px] bg-muted/10 p-6 border-l flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-4">Payment Receipt</p>
              <div className="w-full aspect-[3/4] rounded-2xl bg-white shadow-xl overflow-hidden p-2">
                <img src={reviewMeeting?.paymentProofUrl} className="w-full h-full object-contain" alt="Proof" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}