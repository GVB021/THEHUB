import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth-fetch";
import {
  Users, CheckCircle2, XCircle, Loader2, UserPlus, Pencil,
  BarChart3, Film, Calendar, Mic2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PageSection, PageHeader, EmptyState, StatCard, RoleBadge, StatusBadge
} from "@/components/ui/design-system";
import { pt } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useStudioRole } from "@/hooks/use-studio-role";

const STUDIO_ROLES = [
  { value: "studio_admin", label: pt.roles.studio_admin },
  { value: "diretor", label: pt.roles.diretor },
  { value: "engenheiro_audio", label: pt.roles.engenheiro_audio },
  { value: "dublador", label: pt.roles.dublador },
  { value: "aluno", label: "Aluno" },
];

type AdminTab = "overview" | "pending" | "members" | "productions" | "sessions";

const StudioAdmin = memo(function StudioAdmin({ studioId }: { studioId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canManageMembers } = useStudioRole(studioId);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string[]>>({});
  const [editMember, setEditMember] = useState<any | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [createProductionOpen, setCreateProductionOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [newProductionName, setNewProductionName] = useState("");
  const [newProductionDesc, setNewProductionDesc] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionProductionId, setNewSessionProductionId] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionDuration, setNewSessionDuration] = useState("60");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/studios", studioId, "stats"],
    queryFn: () => authFetch(`/api/studios/${studioId}/stats`),
  });

  const { data: pendingMembers, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/studios", studioId, "pending-members"],
    queryFn: () => authFetch(`/api/studios/${studioId}/pending-members`),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/studios", studioId, "members"],
    queryFn: () => authFetch(`/api/studios/${studioId}/members`),
  });

  const { data: productions, isLoading: prodsLoading } = useQuery({
    queryKey: ["/api/studios", studioId, "productions"],
    queryFn: () => authFetch(`/api/studios/${studioId}/productions`),
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/studios", studioId, "sessions"],
    queryFn: () => authFetch(`/api/studios/${studioId}/sessions`),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ membershipId, roles }: { membershipId: string; roles: string[] }) => {
      return authFetch(`/api/studios/${studioId}/members/${membershipId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "stats"] });
      toast({ title: "Membro aprovado com sucesso" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      return authFetch(`/api/studios/${studioId}/members/${membershipId}/reject`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "stats"] });
      toast({ title: "Membro rejeitado" });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ membershipId, roles }: { membershipId: string; roles: string[] }) => {
      return authFetch(`/api/studios/${studioId}/members/${membershipId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "members"] });
      setEditMember(null);
      toast({ title: "Papeis atualizados" });
    },
  });

  const createProductionMutation = useMutation({
    mutationFn: async () => {
      return authFetch(`/api/studios/${studioId}/productions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProductionName, description: newProductionDesc, studioId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "productions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "stats"] });
      setCreateProductionOpen(false);
      setNewProductionName("");
      setNewProductionDesc("");
      toast({ title: "Producao criada" });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return authFetch(`/api/studios/${studioId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSessionTitle,
          productionId: newSessionProductionId,
          studioId,
          scheduledAt: newSessionDate,
          durationMinutes: parseInt(newSessionDuration) || 60,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "stats"] });
      setCreateSessionOpen(false);
      setNewSessionTitle("");
      setNewSessionProductionId("");
      setNewSessionDate("");
      setNewSessionDuration("60");
      toast({ title: "Sessao criada" });
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return authFetch(`/api/studios/${studioId}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios", studioId, "sessions"] });
      toast({ title: "Sessao cancelada" });
    },
  });

  function toggleRole(membershipId: string, role: string) {
    setSelectedRoles(prev => {
      const current = prev[membershipId] || [];
      const updated = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role];
      return { ...prev, [membershipId]: updated };
    });
  }

  const approvedMembers = members?.filter((m: any) => m.status === "approved") || [];

  const tabs: { key: AdminTab; label: string; icon: typeof BarChart3; count?: number }[] = [
    { key: "overview", label: "Visao Geral", icon: BarChart3 },
    { key: "pending", label: "Cadastros Pendentes", icon: UserPlus, count: pendingMembers?.length || 0 },
    { key: "members", label: "Membros Ativos", icon: Users, count: approvedMembers.length },
    { key: "productions", label: "Producoes", icon: Film, count: productions?.length || 0 },
    { key: "sessions", label: "Sessoes", icon: Calendar, count: sessions?.length || 0 },
  ];

  return (
    <PageSection>
      <PageHeader
        label="Administracao"
        title="Painel do Estudio"
        subtitle="Gerencie membros, producoes e sessoes do seu estudio"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0">
          <div className="vhub-card p-2 space-y-0.5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-6 page-enter">
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    label="Membros"
                    value={stats?.members ?? 0}
                    icon={<Users className="w-4 h-4 text-primary" />}
                    data-testid="stat-members"
                  />
                  <StatCard
                    label="Pendentes"
                    value={stats?.pendingMembers ?? 0}
                    icon={<UserPlus className="w-4 h-4 text-amber-500" />}
                    data-testid="stat-pending"
                  />
                  <StatCard
                    label="Producoes"
                    value={stats?.productions ?? 0}
                    icon={<Film className="w-4 h-4 text-violet-500" />}
                    data-testid="stat-productions"
                  />
                  <StatCard
                    label="Sessoes"
                    value={stats?.sessions ?? 0}
                    icon={<Calendar className="w-4 h-4 text-emerald-500" />}
                    data-testid="stat-sessions"
                  />
                  <StatCard
                    label="Takes"
                    value={stats?.takes ?? 0}
                    icon={<Mic2 className="w-4 h-4 text-rose-500" />}
                    data-testid="stat-takes"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="space-y-4 page-enter">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Cadastros Pendentes</h3>
                {(pendingMembers?.length ?? 0) > 0 && (
                  <Badge variant="secondary">{pendingMembers.length}</Badge>
                )}
              </div>
              {pendingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingMembers?.length > 0 ? (
                pendingMembers.map((m: any) => (
                  <div key={m.id} className="vhub-card p-4" data-testid={`pending-member-${m.id}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                          {(m.user?.fullName || m.user?.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {m.user?.fullName || m.user?.displayName || m.user?.email}
                          </h4>
                          <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                          {m.user?.specialty && (
                            <p className="text-xs text-muted-foreground mt-0.5">{m.user.specialty}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pl-14">
                        {STUDIO_ROLES.map(r => (
                          <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox
                              checked={(selectedRoles[m.id] || []).includes(r.value)}
                              onCheckedChange={() => toggleRole(m.id, r.value)}
                              data-testid={`check-role-${m.id}-${r.value}`}
                            />
                            <span className="text-xs text-foreground">{r.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pl-14">
                        <Button
                          size="sm"
                          className="gap-1 text-xs"
                          disabled={!(selectedRoles[m.id]?.length) || approveMutation.isPending}
                          onClick={() => approveMutation.mutate({ membershipId: m.id, roles: selectedRoles[m.id] })}
                          data-testid={`button-approve-${m.id}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs text-destructive"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(m.id)}
                          data-testid={`button-reject-${m.id}`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<UserPlus className="w-5 h-5" />}
                  title="Nenhum cadastro pendente"
                  description="Todos os cadastros foram processados."
                />
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4 page-enter">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">Membros Ativos</h3>
                <Badge variant="secondary">{approvedMembers.length}</Badge>
              </div>
              {membersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : approvedMembers.length > 0 ? (
                <div className="vhub-card overflow-hidden">
                  <div className="vhub-table-header">
                    <span className="vhub-col-label flex-1">Membro</span>
                    <span className="vhub-col-label flex-1">Email</span>
                    <span className="vhub-col-label flex-1">Papeis</span>
                    {canManageMembers && <span className="vhub-col-label w-10"></span>}
                  </div>
                  <div className="divide-y divide-border/40">
                    {approvedMembers.map((m: any) => {
                      const memberRoles: string[] = m.roles || (m.role ? [m.role] : []);
                      return (
                        <div key={m.id} className="vhub-table-row" data-testid={`member-${m.id}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {(m.user?.fullName || m.user?.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">
                              {m.user?.fullName || m.user?.displayName || m.user?.email}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground flex-1">{m.user?.email}</span>
                          <div className="flex flex-wrap gap-1 flex-1">
                            {memberRoles.map(r => <RoleBadge key={r} role={r} />)}
                          </div>
                          {canManageMembers && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setEditMember(m); setEditRoles(memberRoles); }}
                              data-testid={`button-edit-roles-${m.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="Nenhum membro ativo"
                  description=""
                />
              )}
            </div>
          )}

          {activeTab === "productions" && (
            <div className="space-y-4 page-enter">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-semibold text-foreground">Producoes</h3>
                  <Badge variant="secondary">{productions?.length || 0}</Badge>
                </div>
                <Button size="sm" onClick={() => setCreateProductionOpen(true)} data-testid="button-new-production">
                  Nova Producao
                </Button>
              </div>
              {prodsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : productions?.length > 0 ? (
                <div className="vhub-card overflow-hidden">
                  <div className="vhub-table-header">
                    <span className="vhub-col-label flex-1">Nome</span>
                    <span className="vhub-col-label flex-1">Descricao</span>
                    <span className="vhub-col-label">Status</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {productions.map((p: any) => (
                      <div key={p.id} className="vhub-table-row" data-testid={`production-${p.id}`}>
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{p.description || "-"}</span>
                        <StatusBadge status={p.status || "planned"} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Film className="w-5 h-5" />}
                  title="Nenhuma producao"
                  description="Crie sua primeira producao."
                  action={
                    <Button size="sm" onClick={() => setCreateProductionOpen(true)}>
                      Nova Producao
                    </Button>
                  }
                />
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-4 page-enter">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">Sessoes</h3>
                  <Badge variant="secondary">{sessions?.length || 0}</Badge>
                </div>
                <Button size="sm" onClick={() => setCreateSessionOpen(true)} data-testid="button-new-session">
                  Nova Sessao
                </Button>
              </div>
              {sessionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions?.length > 0 ? (
                <div className="vhub-card overflow-hidden">
                  <div className="vhub-table-header">
                    <span className="vhub-col-label flex-1">Titulo</span>
                    <span className="vhub-col-label">Data</span>
                    <span className="vhub-col-label">Duracao</span>
                    <span className="vhub-col-label">Status</span>
                    <span className="vhub-col-label w-20"></span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {sessions.map((s: any) => (
                      <div key={s.id} className="vhub-table-row" data-testid={`session-${s.id}`}>
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{s.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString("pt-BR") : "-"}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.durationMinutes}min</span>
                        <StatusBadge status={s.status || "scheduled"} />
                        {s.status !== "cancelled" && s.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-destructive"
                            disabled={cancelSessionMutation.isPending}
                            onClick={() => cancelSessionMutation.mutate(s.id)}
                            data-testid={`button-cancel-session-${s.id}`}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="Nenhuma sessao"
                  description="Agende sua primeira sessao."
                  action={
                    <Button size="sm" onClick={() => setCreateSessionOpen(true)}>
                      Nova Sessao
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editMember} onOpenChange={v => { if (!v) setEditMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Papeis</DialogTitle>
            <DialogDescription>
              Selecione os papeis de {editMember?.user?.fullName || editMember?.user?.displayName || editMember?.user?.email} neste estudio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {STUDIO_ROLES.map(r => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={editRoles.includes(r.value)}
                  onCheckedChange={() => {
                    setEditRoles(prev =>
                      prev.includes(r.value)
                        ? prev.filter(x => x !== r.value)
                        : [...prev, r.value]
                    );
                  }}
                  data-testid={`check-edit-role-${r.value}`}
                />
                <Label className="cursor-pointer">{r.label}</Label>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancelar</Button>
            <Button
              disabled={editRoles.length === 0 || updateRolesMutation.isPending}
              onClick={() => editMember && updateRolesMutation.mutate({ membershipId: editMember.id, roles: editRoles })}
              data-testid="button-save-roles"
            >
              {updateRolesMutation.isPending ? "Salvando..." : "Salvar Papeis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createProductionOpen} onOpenChange={setCreateProductionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Producao</DialogTitle>
            <DialogDescription>Preencha os dados da nova producao.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="vhub-field">
              <label className="vhub-field-label">Nome</label>
              <Input
                value={newProductionName}
                onChange={e => setNewProductionName(e.target.value)}
                placeholder="Nome da producao"
                data-testid="input-production-name"
              />
            </div>
            <div className="vhub-field">
              <label className="vhub-field-label">Descricao</label>
              <Input
                value={newProductionDesc}
                onChange={e => setNewProductionDesc(e.target.value)}
                placeholder="Descricao (opcional)"
                data-testid="input-production-desc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProductionOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newProductionName.trim() || createProductionMutation.isPending}
              onClick={() => createProductionMutation.mutate()}
              data-testid="button-create-production"
            >
              {createProductionMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sessao</DialogTitle>
            <DialogDescription>Agende uma nova sessao de gravacao.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="vhub-field">
              <label className="vhub-field-label">Titulo</label>
              <Input
                value={newSessionTitle}
                onChange={e => setNewSessionTitle(e.target.value)}
                placeholder="Titulo da sessao"
                data-testid="input-session-title"
              />
            </div>
            <div className="vhub-field">
              <label className="vhub-field-label">Producao</label>
              <Select value={newSessionProductionId} onValueChange={setNewSessionProductionId}>
                <SelectTrigger data-testid="select-session-production">
                  <SelectValue placeholder="Selecionar producao" />
                </SelectTrigger>
                <SelectContent>
                  {(productions || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="vhub-field">
              <label className="vhub-field-label">Data e Hora</label>
              <Input
                type="datetime-local"
                value={newSessionDate}
                onChange={e => setNewSessionDate(e.target.value)}
                data-testid="input-session-date"
              />
            </div>
            <div className="vhub-field">
              <label className="vhub-field-label">Duracao (minutos)</label>
              <Input
                type="number"
                value={newSessionDuration}
                onChange={e => setNewSessionDuration(e.target.value)}
                data-testid="input-session-duration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSessionOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newSessionTitle.trim() || !newSessionProductionId || !newSessionDate || createSessionMutation.isPending}
              onClick={() => createSessionMutation.mutate()}
              data-testid="button-create-session"
            >
              {createSessionMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  );
});

export default StudioAdmin;
