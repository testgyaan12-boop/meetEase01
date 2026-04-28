
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-96 mx-auto rounded-lg" />
      </div>

      <Card className="max-w-2xl mx-auto border-none shadow-xl bg-white/50">
        <CardHeader className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </CardContent>
      </Card>
    </div>
  );
}
