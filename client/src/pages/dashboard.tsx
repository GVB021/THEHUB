import { memo } from "react";
import { useProductions } from "@/hooks/use-productions";
import { useSessions } from "@/hooks/use-sessions";
import { useStudio } from "@/hooks/use-studios";
import { useStaff } from "@/hooks/use-staff";
import { useStudioRole } from "@/hooks/use-studio-role";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ProductionCard } from "@/components/dashboard/production-card";
import { SessionCard } from "@/components/dashboard/session-card";
import {
  PageSection, PageHeader, StatCard
} from "@/components/ui/design-system";
import { Button } from "@/components/ui/button";
import { Film, Calendar, Users, Activity, Plus, Clock, UserPlus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { pt } from "@/lib/i18n";
import { isSessionVisibleOnDashboard } from "@/lib/session-status";

const Dashboard = memo(function Dashboard({ studioId }: { studioId: string }) {
  const studio = useStudio(studioId);
  const { data: productions } = useProductions(studioId);
  const { data: sessions } = useSessions(studioId);
  const { data: staff } = useStaff(studioId);
  const { canCreateProductions, canCreateSessions, canManageMembers } = useStudioRole(studioId);

  const upcomingSessions = (sessions || []).filter(s =>
    isSessionVisibleOnDashboard(s.scheduledAt, s.durationMinutes ?? 60)
  );

  return (
    <PageSection>
      <PageHeader
        label={studio?.name}
        title={pt.dashboard.title}
        action={
          <div className="flex flex-wrap gap-2">
            {canCreateProductions && (
              <Button size="sm" className="gap-1.5 vhub-btn-sm vhub-btn-primary" asChild data-testid="button-create-production">
                <Link href={`/studio/${studioId}/productions`}>
                  <Plus className="h-3.5 w-3.5" /> {pt.dashboard.production}
                </Link>
              </Button>
            )}
            {canCreateSessions && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild data-testid="button-create-session">
                <Link href={`/studio/${studioId}/sessions`}>
                  <Clock className="h-3.5 w-3.5" /> {pt.dashboard.session}
                </Link>
              </Button>
            )}
            {canManageMembers && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild data-testid="button-manage-members">
                <Link href={`/studio/${studioId}/members`}>
                  <UserPlus className="h-3.5 w-3.5" /> {pt.nav.members}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={pt.dashboard.productions}
          value={productions?.length ?? 0}
          icon={<Film className="h-4 w-4 text-blue-400" />}
          description="Total no estudio"
        />
        <StatCard
          label={pt.dashboard.upcoming}
          value={upcomingSessions.length}
          icon={<Calendar className="h-4 w-4 text-violet-400" />}
          description="Sessoes ativas"
        />
        <StatCard
          label={pt.dashboard.team}
          value={staff?.length ?? 0}
          icon={<Users className="h-4 w-4 text-emerald-400" />}
          description="Membros ativos"
        />
        <StatCard
          label={pt.dashboard.status}
          value={pt.status.active}
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          valueClassName="text-emerald-400"
          description="Sistemas operacionais"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard
          title={pt.dashboard.recentProductions}
          icon={<Film className="h-3.5 w-3.5 text-muted-foreground" />}
          headerAction={
            <Link href={`/studio/${studioId}/productions`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {productions?.slice(0, 6).map(prod => (
              <ProductionCard key={prod.id} production={prod} studioId={studioId} />
            ))}
            {(!productions || productions.length === 0) && (
              <p className="vhub-caption text-center py-6">{pt.dashboard.noProductions}</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title={pt.dashboard.upcomingSessions}
          icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
          headerAction={
            <Link href={`/studio/${studioId}/sessions`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {upcomingSessions.slice(0, 6).map(session => (
              <SessionCard key={session.id} session={session} studioId={studioId} />
            ))}
            {upcomingSessions.length === 0 && (
              <p className="vhub-caption text-center py-6">{pt.dashboard.noSessions}</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </PageSection>
  );
});

export default Dashboard;
