
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
  Mail
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
        description: "Administrative privileges required.",
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary">Verifying Clearance...</p>
      </div>
    )
  }

  if (!hasAdminAccess) return null

  const filteredMeetings = meetings?.filter(m => 
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <ShieldCheck className="h-9 w-9 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-headline font-bold text-primary">Admin Control</h1>
                {isSuperAdmin && <Badge className="bg-accent text-white font-black px-3 py-1">SUPER ADMIN</Badge>}
              </div>
              <p className="text-base text-muted-foreground font-medium">Manage requests and availability.</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="requests" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="h-16 bg-white rounded-3xl p-2 shadow-xl border-none">
            <TabsTrigger value="requests" className="rounded-2xl px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="slots" className="rounded-2xl px-8 h-full font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl font-headline font-bold">Request Queue</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search clients..." 
                  className="pl-12 h-14 bg-white rounded-2xl border-none shadow-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isMeetingsLoading ? (
                <div className="p-12 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : filteredMeetings && filteredMeetings.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="border-primary/10">
                      <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Client</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Date</TableHead>
                      <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map((req) => (
                      <TableRow key={req.id} className="border-primary/5">
                        <TableCell className="py-8 pl-8">
                          <div>
                            <p className="font-bold text-lg text-primary">{req.clientName}</p>
                            <p className="text-sm font-medium text-muted-foreground">{req.clientEmail}</p>
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
                            <Clock className="h-4 w-4" />
                            {format(new Date(req.createdAt), "PPP")}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-12 px-6 rounded-xl font-bold">Review</Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2.5rem]">
                              <DialogHeader>
                                <DialogTitle>Review Payment</DialogTitle>
                              </DialogHeader>
                              <div className="aspect-[3/4] rounded-3xl overflow-hidden mt-4">
                                <img src={req.paymentProofUrl} className="object-cover w-full h-full" />
                              </div>
                              <DialogFooter className="pt-8 gap-4">
                                <Button variant="destructive" className="flex-1" onClick={() => handleMeetingAction(req.id, 'rejected')}>REJECT</Button>
                                <Button className="flex-1" onClick={() => handleMeetingAction(req.id, 'confirmed')}>APPROVE</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-32 bg-white/40">
                  <Inbox className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-2xl font-headline font-bold text-muted-foreground/60">No Requests</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold">Schedule Availability</h2>
              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogTrigger asChild>
                  <Button className="h-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-bold gap-2">
                    <Plus className="h-5 w-5" /> New Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem]">
                  <DialogHeader>
                    <DialogTitle>Add Slot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-6">
                    <Calendar 
                      mode="single" 
                      selected={newSlotDate} 
                      onSelect={(d) => d && setNewSlotDate(d)}
                      className="mx-auto"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} />
                      <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter className="pt-8">
                    <Button onClick={handleAddSlot} className="w-full h-16 rounded-2xl">CREATE SLOT</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
              {isSlotsLoading ? (
                <div className="p-12 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <Table>
                  <TableHeader className="bg-primary/5">
                    <TableRow className="border-primary/10">
                      <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Date</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Time Range</TableHead>
                      <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                      <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id} className="border-primary/5">
                        <TableCell className="py-8 pl-8">
                          <span className="font-bold text-lg">{format(new Date(slot.startTime), "PPP")}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-lg">
                            {format(new Date(slot.startTime), "p")} - {format(new Date(slot.endTime), "p")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={slot.isBooked ? "destructive" : "secondary"}>
                            {slot.isBooked ? "Booked" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-32 bg-white/40">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-2xl font-headline font-bold text-muted-foreground/60">No Slots</h3>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
