import { memo, useState } from "react";
import { useProductions } from "@studio/hooks/use-productions";
import { useSessions } from "@studio/hooks/use-sessions";
import { useStudio } from "@studio/hooks/use-studios";
import { useStaff } from "@studio/hooks/use-staff";
import { useStudioRole } from "@studio/hooks/use-studio-role";
import { DashboardCard } from "@studio/components/dashboard/dashboard-card";
import { ProductionCard } from "@studio/components/dashboard/production-card";
import { SessionCard } from "@studio/components/dashboard/session-card";
import {
  PageSection, PageHeader, StatCard
} from "@studio/components/ui/design-system";
import { Button } from "@studio/components/ui/button";
import { Film, Calendar, Users, Activity, Plus, Clock, UserPlus, ArrowRight, History, PlayCircle, ToggleRight, ToggleLeft } from "lucide-react";
import { Link } from "wouter";
import { pt } from "@studio/lib/i18n";
import { isSessionVisibleOnDashboard } from "@studio/lib/session-status";
import { cn } from "@studio/lib/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ptBR } from "date-fns/locale";

const Dashboard = memo(function Dashboard({ studioId }: { studioId: string }) {
  const studio = useStudio(studioId);
  const { data: productions } = useProductions(studioId);
  const { data: sessions } = useSessions(studioId);
  const { canCreateProductions, canCreateSessions, canManageMembers } = useStudioRole(studioId);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const upcomingSessions = (sessions || []).filter(s =>
    isSessionVisibleOnDashboard(s.scheduledAt, s.durationMinutes ?? 60)
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Find current or next session
  const now = new Date();
  const currentOrNextSession = upcomingSessions.find(s => {
    const start = new Date(s.scheduledAt);
    const end = new Date(start.getTime() + (s.durationMinutes || 60) * 60000);
    return end > now;
  });

  // Find current production based on session
  const currentProduction = currentOrNextSession 
    ? productions?.find(p => p.id === currentOrNextSession.productionId)
    : null;

  const recentProductions = productions?.slice(0, 5) || [];
  const recentSessions = sessions?.filter(s => new Date(s.scheduledAt) < now).slice(0, 5) || [];

  const sessionsOnSelectedDate = upcomingSessions.filter(s => 
    selectedDate && new Date(s.scheduledAt).toDateString() === selectedDate.toDateString()
  );

  return (
    <PageSection className={cn("max-w-[1600px] mx-auto", animationsEnabled ? "animate-in fade-in duration-700" : "")}>
      <div className="flex flex-col gap-8">
        {/* Header with Animation Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {studio?.name || pt.dashboard.title}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              {animationsEnabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
              {animationsEnabled ? "Animações ON" : "Animações OFF"}
            </button>

            <div className="flex gap-2">
              {canCreateProductions && (
                <Button size="sm" className="gap-1.5 vhub-btn-sm vhub-btn-primary shadow-lg shadow-primary/20" asChild>
                  <Link href={`/hub-dub/studio/${studioId}/productions`}>
                    <Plus className="h-3.5 w-3.5" /> {pt.dashboard.production}
                  </Link>
                </Button>
              )}
              {canCreateSessions && (
                <Button size="sm" variant="outline" className="gap-1.5 border-white/10 hover:bg-white/5" asChild>
                  <Link href={`/hub-dub/studio/${studioId}/sessions`}>
                    <Clock className="h-3.5 w-3.5" /> {pt.dashboard.session}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section: Current/Next Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Production Card (Poster Style) */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-[16/9] lg:aspect-auto flex flex-col justify-end",
            animationsEnabled && "transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 group"
          )}>
            {/* @ts-ignore */}
            {currentProduction?.posterUrl ? (
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                /* @ts-ignore */
                style={{ backgroundImage: `url(${currentProduction.posterUrl})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                <Film className="w-24 h-24 text-white/5" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            
            <div className="relative z-10 p-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                  Produção em Destaque
                </span>
              </div>
              
              <div className="space-y-1">
                {currentProduction ? (
                  <>
                    <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
                      {currentProduction.name}
                    </h2>
                    {currentOrNextSession && (
                      <p className="text-white/80 text-lg font-medium drop-shadow-md">
                        {currentOrNextSession.title}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-white">Sem produção ativa</h2>
                    <p className="text-white/60">Nenhuma sessão agendada para hoje.</p>
                  </>
                )}
              </div>

              {currentOrNextSession && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white shadow-lg">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {new Date(currentOrNextSession.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white shadow-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {new Date(currentOrNextSession.scheduledAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar & Sessions */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col md:flex-row gap-6",
            animationsEnabled && "transition-all duration-300 hover:border-white/20"
          )}>
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="p-0 m-0"
                modifiers={{
                  hasSession: (date) => upcomingSessions.some(s => new Date(s.scheduledAt).toDateString() === date.toDateString())
                }}
                modifiersStyles={{
                  hasSession: { fontWeight: 'bold', color: 'hsl(var(--primary))', textDecoration: 'underline' }
                }}
                styles={{
                  caption: { color: 'white' },
                  head_cell: { color: 'rgba(255,255,255,0.5)' },
                  day: { color: 'white' },
                  nav_button: { color: 'white' },
                }}
              />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  Sessões
                </h3>
                <Link href={`/hub-dub/studio/${studioId}/sessions`} className="text-xs text-primary hover:underline">
                  Ver agenda completa
                </Link>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                {sessionsOnSelectedDate.length > 0 ? (
                  sessionsOnSelectedDate.map(session => (
                    <SessionCard key={session.id} session={session} studioId={studioId} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 text-white/40">
                    <Calendar className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma sessão para este dia</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/80 border-b border-white/10 pb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Histórico Recente</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Productions (Non-clickable) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Últimas Produções</h3>
              <div className="space-y-2">
                {recentProductions.length > 0 ? (
                  recentProductions.map(prod => (
                    <div 
                      key={prod.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]",
                        animationsEnabled && "transition-all hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Film className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{prod.name}</p>
                        <p className="text-xs text-white/40 truncate">
                          Produção
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-medium border",
                          prod.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          prod.status === 'completed' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-white/5 text-white/40 border-white/10"
                        )}>
                          {prod.status === 'active' ? 'Ativo' : prod.status === 'completed' ? 'Concluído' : 'Arquivado'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">Nenhuma produção recente.</p>
                )}
              </div>
            </div>

            {/* Recent Sessions (Clickable) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Últimas Sessões Realizadas</h3>
              <div className="space-y-2">
                {recentSessions.length > 0 ? (
                  recentSessions.map(session => (
                    <Link 
                      key={session.id} 
                      href={`/hub-dub/studio/${studioId}/sessions/${session.id}/room`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] group",
                        animationsEnabled && "transition-all hover:bg-white/[0.04] hover:border-primary/20 hover:translate-x-1"
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                        <Clock className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate group-hover:text-primary transition-colors">{session.title}</p>
                        <p className="text-xs text-white/40 truncate">
                          {new Date(session.scheduledAt).toLocaleDateString()} • Sessão
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">Nenhuma sessão realizada recentemente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
});

export default Dashboard;
