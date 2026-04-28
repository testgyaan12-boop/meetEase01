
"use client"

import { useMemoFirebase, useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Link as LinkIcon, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function HistoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()

  // Query is strictly limited to the current user's UID for security and correctness
  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "meetings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection(meetingsQuery)

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
                  <TableHead className="py-6 pl-8 font-black uppercase text-primary/60 tracking-widest text-[11px]">Consultant</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Date Requested</TableHead>
                  <TableHead className="font-black uppercase text-primary/60 tracking-widest text-[11px]">Status</TableHead>
                  <TableHead className="pr-8 text-right font-black uppercase text-primary/60 tracking-widest text-[11px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{meeting.clientName}</p>
                          <p className="text-xs text-muted-foreground font-medium">{meeting.clientMobile}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                        <Clock className="h-4 w-4 text-primary/60" />
                        {format(new Date(meeting.createdAt), "MMM do, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          meeting.status === 'confirmed' ? 'default' : 
                          meeting.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className="capitalize px-4 py-1 font-black rounded-lg text-[10px] tracking-wide"
                      >
                        {meeting.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      {meeting.status === 'confirmed' && meeting.meetingLink ? (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-10 gap-2" asChild>
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4" /> Join Session
                          </a>
                        </Button>
                      ) : (
                        <p className="text-xs font-bold text-muted-foreground italic">Pending Verification</p>
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
              <p className="text-muted-foreground max-w-xs mx-auto font-medium">You haven't scheduled any professional sessions yet.</p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary rounded-xl h-12 px-8 font-bold">Schedule Now</Button>
          </div>
        )}
      </div>
    </div>
  )
}
