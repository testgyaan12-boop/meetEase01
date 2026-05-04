
"use client"

import { useMemoFirebase, useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Link as LinkIcon, Inbox, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isPast } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Meeting } from "@/lib/types"
import { useMemo } from "react"

export default function HistoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "meetings"),
      where("userId", "==", user.uid)
    )
  }, [firestore, user])

  const { data: rawMeetings, isLoading: isMeetingsLoading } = useCollection<Meeting>(meetingsQuery)

  const meetings = useMemo(() => {
    if (!rawMeetings) return []
    return [...rawMeetings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [rawMeetings])

  if (isUserLoading || isMeetingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-2xl border bg-white/50 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const getMeetingStatusBadge = (meeting: Meeting) => {
    if (meeting.status === 'done') return <Badge variant="outline" className="px-3">Completed</Badge>
    if (meeting.status === 'confirmed' && meeting.slotEndTime && isPast(new Date(meeting.slotEndTime))) {
      return <Badge variant="secondary" className="px-3">Past Session</Badge>
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Meeting History</h2>
        <p className="text-sm md:text-base text-muted-foreground font-medium">Track your requested and confirmed consultations.</p>
      </div>

      <div className="rounded-2xl md:rounded-[2.5rem] border-none shadow-2xl bg-white/80 dark:bg-card/40 backdrop-blur-md overflow-hidden">
        {meetings && meetings.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent border-primary/10">
                  <TableHead className="py-4 md:py-6 pl-4 md:pl-8 font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Client Details</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Request Date</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Status & Remarks</TableHead>
                  <TableHead className="pr-4 md:pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[9px] md:text-[11px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell className="py-4 md:py-6 pl-4 md:pl-8">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm md:text-base truncate">{meeting.clientName}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{meeting.clientEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-bold text-foreground/80 whitespace-nowrap">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary/60" />
                        {format(new Date(meeting.createdAt), "MMM d, p")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getMeetingStatusBadge(meeting)}
                        {meeting.status === 'rejected' && meeting.adminNotes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-destructive/5 text-destructive border border-destructive/10 max-w-[140px] md:max-w-[200px]">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] font-bold leading-tight">{meeting.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 md:pr-8 text-right">
                      {meeting.status === 'confirmed' && meeting.meetingLink && (!meeting.slotEndTime || !isPast(new Date(meeting.slotEndTime))) ? (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-lg md:rounded-xl h-8 md:h-10 gap-1.5 md:gap-2 shadow-lg shadow-primary/20" asChild>
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Join</span>
                          </a>
                        </Button>
                      ) : (
                        <span className="text-[10px] md:text-xs text-muted-foreground italic font-medium">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 md:py-24 text-center space-y-4 md:space-y-6 bg-white/40 dark:bg-transparent">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-muted/20 mx-auto flex items-center justify-center">
              <Inbox className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xl md:text-2xl font-headline font-bold text-muted-foreground">No History</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-xs mx-auto font-medium">You haven't requested any meetings yet.</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary rounded-xl h-10 md:h-12 px-6 md:px-8 font-bold">Schedule Now</Button>
          </div>
        )}
      </div>
    </div>
  )
}
