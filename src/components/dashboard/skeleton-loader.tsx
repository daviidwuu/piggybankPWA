import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonLoader() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px]">
        <main className="flex-1 p-4 space-y-4 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-2/4" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex justify-between items-baseline">
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-center pt-1">
                 <Skeleton className="h-4 w-8" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-52 mt-1" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="px-6 pt-0 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div className="flex items-center space-x-4" key={i}>
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <div className="flex-1 flex items-center space-x-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                         <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
