import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Shield, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "gestionnaire" | "caissier" | "directeur";

const ROLES: AppRole[] = ["admin", "gestionnaire", "caissier", "directeur"];

const roleConfig: Record<AppRole, { label: string; className: string; icon: any }> = {
  admin: { label: "Administrateur", className: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert },
  gestionnaire: { label: "Gestionnaire", className: "bg-primary/10 text-primary border-primary/20", icon: ShieldCheck },
  caissier: { label: "Caissier", className: "bg-warning/10 text-warning border-warning/20", icon: Shield },
  directeur: { label: "Directeur", className: "bg-success/10 text-success border-success/20", icon: ShieldCheck },
};

const permissions = [
  { module: "Produits & Stock", admin: "Total", gestionnaire: "Total", caissier: "Lecture", directeur: "Lecture" },
  { module: "Catégories", admin: "Total", gestionnaire: "Total", caissier: "Lecture", directeur: "Lecture" },
  { module: "Fournisseurs", admin: "Total", gestionnaire: "Total", caissier: "Lecture", directeur: "Lecture" },
  { module: "Achats", admin: "Total", gestionnaire: "Total", caissier: "Lecture", directeur: "Lecture" },
  { module: "Ventes", admin: "Total", gestionnaire: "Total", caissier: "Total", directeur: "Lecture" },
  { module: "Rapports", admin: "Total", gestionnaire: "Lecture", caissier: "Aucun", directeur: "Lecture" },
  { module: "Utilisateurs", admin: "Total", gestionnaire: "Aucun", caissier: "Aucun", directeur: "Aucun" },
];

const Utilisateurs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    check();
  }, [user]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;

      return profiles.map((p: any) => ({
        ...p,
        roles: roles.filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role as AppRole),
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, oldRoles }: { userId: string; newRole: AppRole; oldRoles: AppRole[] }) => {
      // Remove all existing roles, then insert new role
      if (oldRoles.length > 0) {
        const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
        if (delError) throw delError;
      }
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Rôle mis à jour" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const filtered = users.filter((u: any) =>
    (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout title="Utilisateurs" subtitle={`${users.length} utilisateurs · Gestion des rôles et permissions`}>
      {!isAdmin && (
        <div className="mb-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          Vous consultez cette page en lecture seule. Seuls les administrateurs peuvent modifier les rôles.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un utilisateur..." className="pl-9 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header px-4 py-3 text-left">Utilisateur</th>
                <th className="table-header px-4 py-3 text-left hidden md:table-cell">Inscrit le</th>
                <th className="table-header px-4 py-3 text-left">Rôle</th>
                <th className="table-header px-4 py-3 text-right">Modifier</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Aucun utilisateur</td></tr>
              ) : (
                filtered.map((u: any) => {
                  const currentRole: AppRole = u.roles[0] || "gestionnaire";
                  const cfg = roleConfig[currentRole];
                  const Icon = cfg.icon;
                  return (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{u.full_name || "Sans nom"}</p>
                            <p className="text-xs text-muted-foreground">ID: {u.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Select
                          value={currentRole}
                          disabled={!isAdmin || u.user_id === user?.id}
                          onValueChange={(newRole: AppRole) =>
                            updateRoleMutation.mutate({ userId: u.user_id, newRole, oldRoles: u.roles })
                          }
                        >
                          <SelectTrigger className="w-40 ml-auto h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-card-foreground">Matrice des permissions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Aperçu des accès accordés à chaque rôle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="table-header px-4 py-3 text-left">Module</th>
                {ROLES.map((r) => (
                  <th key={r} className="table-header px-4 py-3 text-center">{roleConfig[r].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.module} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-card-foreground">{p.module}</td>
                  {ROLES.map((r) => {
                    const val = (p as any)[r];
                    const color = val === "Total" ? "text-success" : val === "Lecture" ? "text-warning" : "text-muted-foreground";
                    return <td key={r} className={`px-4 py-3 text-xs text-center ${color}`}>{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Utilisateurs;
