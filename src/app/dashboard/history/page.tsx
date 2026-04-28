"use client"

import { useMemoFirebase, useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Link as LinkIcon, Inbox, Mail, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isPast } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Meeting } from "@/lib/types"

export default function HistoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "meetings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection<Meeting>(meetingsQuery)

  if (isUserLoading || isMeetingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="rounded-[2rem] border bg-white/50 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const getMeetingStatusBadge = (meeting: Meeting) => {
    if (meeting.status === 'done') return <Badge variant="outline" className="px-3 font-black text-[9px] uppercase tracking-widest border-primary/20 text-primary">Completed</Badge>
    if (meeting.status === 'confirmed' && meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))) {
      return <Badge variant="secondary" className="px-3 font-black text-[9px] uppercase tracking-widest bg-primary/5 text-primary/70">Past Session</Badge>
    }
    
    const variants: Record<string, string> = {
      pending: 'secondary',
      confirmed: 'default',
      rejected: 'destructive',
    }
    
    return (
      <Badge 
        variant={variants[meeting.status] as any}
        className="capitalize px-4 py-1 font-black rounded-lg text-[10px] tracking-wide"
      >
        {meeting.status}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Your History</h2>
        <p className="text-muted-foreground font-medium">Manage and track your professional consultations.</p>
      </div>

      <div className="rounded-[2.5rem] border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
        {meetings && meetings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent border-primary/10">
                  <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Details</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Date Requested</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status & Remarks</TableHead>
                  <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{meeting.clientName}</p>
                          <p className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">{meeting.clientEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                        <Clock className="h-4 w-4 text-primary/60" />
                        {format(new Date(meeting.createdAt), "MMM do, p")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getMeetingStatusBadge(meeting)}
                        {meeting.status === 'rejected' && meeting.adminNotes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-destructive/5 text-destructive border border-destructive/10 max-w-[200px]">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold leading-tight">{meeting.adminNotes}</p>
                          </div>
                        )}
                        {(meeting.status === 'done' || (meeting.status === 'confirmed' && meeting.slotEndTime && isPast(new Date(meeting.slotEndTime)))) && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary/50">
                            <CheckCircle2 className="h-3 w-3" /> Automatically Completed
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      {meeting.status === 'confirmed' && meeting.meetingLink && (!meeting.slotEndTime || !isPast(new Date(meeting.slotEndTime))) ? (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-10 gap-2 shadow-lg shadow-primary/20" asChild>
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4" /> Join
                          </a>
                        </Button>
                      ) : meeting.status === 'confirmed' && isPast(new Date(meeting.slotEndTime || "")) ? (
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg inline-block">Session Ended</p>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-muted-foreground/60">
                           <Info className="h-3.5 w-3.5" />
                           <p className="text-xs font-bold italic">Awaiting Action</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 bg-white/40">
            <div className="h-20 w-20 rounded-3xl bg-muted/20 mx-auto flex items-center justify-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-headline font-bold text-muted-foreground">Empty History</h3>
              <p className="text-muted-foreground max-w-xs mx-auto font-medium">You haven't scheduled any sessions yet.</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary rounded-xl h-12 px-8 font-bold">Book Now</Button>
          </div>
        )}
      </div>
    </div>
  )
}
