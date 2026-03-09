import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { memoryHook, memorySearchHook } from "@/lib/memory-router";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/login"));
const StudioSelect = lazy(() => import("@/pages/studio-select"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Productions = lazy(() => import("@/pages/productions"));
const Sessions = lazy(() => import("@/pages/sessions"));
const RecordingRoom = lazy(() => import("@/pages/room"));
const Staff = lazy(() => import("@/pages/staff"));
const Admin = lazy(() => import("@/pages/admin"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Members = lazy(() => import("@/pages/members"));
const StudioAdmin = lazy(() => import("@/pages/studio-admin"));
const Takes = lazy(() => import("@/pages/takes"));
const Profile = lazy(() => import("@/pages/profile"));

import { StudioLayout } from "@/components/layout/studio-layout";

function ProtectedRoute({ component: Component, requireStudio = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  if (requireStudio) {
    const studioId = rest.params?.studioId as string;
    return (
      <StudioLayout studioId={studioId}>
        <ErrorBoundary>
          <Component studioId={studioId} {...rest} />
        </ErrorBoundary>
      </StudioLayout>
    );
  }

  return (
    <ErrorBoundary>
      <Component {...rest} />
    </ErrorBoundary>
  );
}

function StudioSelectRoute() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return <StudioSelect />;
}

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <Switch>
        <Route path="/" component={() => <Redirect to="/studios" />} />
        <Route path="/login" component={Login} />
        <Route path="/studios" component={StudioSelectRoute} />

        <Route path="/admin">
          {() => <ProtectedRoute component={Admin} />}
        </Route>

        <Route path="/profile">
          {() => <ProtectedRoute component={Profile} />}
        </Route>

        <Route path="/studio/:studioId/dashboard">
          {params => <ProtectedRoute component={Dashboard} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/productions">
          {params => <ProtectedRoute component={Productions} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/sessions">
          {params => <ProtectedRoute component={Sessions} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/staff">
          {params => <ProtectedRoute component={Staff} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/members">
          {params => <ProtectedRoute component={Members} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/notifications">
          {params => <ProtectedRoute component={Notifications} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/takes">
          {params => <ProtectedRoute component={Takes} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/admin">
          {params => <ProtectedRoute component={StudioAdmin} requireStudio params={params} />}
        </Route>

        <Route path="/studio/:studioId/sessions/:sessionId/room">
          {params => <ProtectedRoute component={RecordingRoom} params={params} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter hook={memoryHook} searchHook={memorySearchHook}>
            <Toaster />
            <Router />
          </WouterRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
