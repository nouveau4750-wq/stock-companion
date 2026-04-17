import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LineItem {
  produit_id: string;
  quantity: number;
  unit_price: number;
}

const Ventes = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ produit_id: "", quantity: 1, unit_price: 0 }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ventes = [], isLoading } = useQuery({
    queryKey: ["ventes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ventes")
        .select("*, vente_details(*, produits(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: produits = [] } = useQuery({
    queryKey: ["produits-vente-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produits").select("id, name, price, stock").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const validLines = lines.filter(l => l.produit_id && l.quantity > 0);
      if (validLines.length === 0) throw new Error("Ajoutez au moins une ligne");

      const total = validLines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const ref = `VTE-${Date.now()}`;
      const { data: { user } } = await supabase.auth.getUser();

      const { data: vente, error: e1 } = await supabase
        .from("ventes")
        .insert({ ref, client: client || null, total, status: "completee", user_id: user?.id })
        .select()
        .single();
      if (e1) throw e1;

      const details = validLines.map(l => ({
        vente_id: vente.id,
        produit_id: l.produit_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total: l.quantity * l.unit_price,
      }));
      const { error: e2 } = await supabase.from("vente_details").insert(details);
      if (e2) {
        await supabase.from("ventes").delete().eq("id", vente.id);
        throw e2;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventes"] });
      queryClient.invalidateQueries({ queryKey: ["produits"] });
      queryClient.invalidateQueries({ queryKey: ["produits-vente-select"] });
      setDialogOpen(false);
      reset();
      toast({ title: "Vente enregistrée", description: "Le stock a été mis à jour automatiquement" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const reset = () => { setClient(""); setLines([{ produit_id: "", quantity: 1, unit_price: 0 }]); };

  const updateLine = (i: number, field: keyof LineItem, value: any) => {
    const next = [...lines];
    next[i] = { ...next[i], [field]: value };
    if (field === "produit_id") {
      const p = produits.find((p: any) => p.id === value);
      if (p) next[i].unit_price = Number(p.price) || 0;
    }
    setLines(next);
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const viewing = ventes.find((v: any) => v.id === viewOpen);

  return (
    <AppLayout title="Ventes" subtitle={`${ventes.length} ventes`}>
      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nouvelle vente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client (optionnel)" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Produits</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { produit_id: "", quantity: 1, unit_price: 0 }])}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Ligne
                  </Button>
                </div>
                {lines.map((line, i) => {
                  const p = produits.find((p: any) => p.id === line.produit_id);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <Select value={line.produit_id} onValueChange={(v) => updateLine(i, "produit_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Produit" /></SelectTrigger>
                            <SelectContent>
                              {produits.map((pr: any) => (
                                <SelectItem key={pr.id} value={pr.id} disabled={pr.stock === 0}>
                                  {pr.name} (stock: {pr.stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input type="number" min="1" max={p?.stock} value={line.quantity} onChange={(e) => updateLine(i, "quantity", parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-3">
                          <Input type="number" step="0.01" min="0" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-1">
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {p && line.quantity > p.stock && (
                        <p className="text-xs text-destructive">Stock insuffisant (disponible: {p.stock})</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">{total.toFixed(2)} €</span>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer la vente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header px-4 py-3 text-left">Référence</th>
                <th className="table-header px-4 py-3 text-left hidden sm:table-cell">Client</th>
                <th className="table-header px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="table-header px-4 py-3 text-right">Total</th>
                <th className="table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Chargement...</td></tr>
              ) : ventes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Aucune vente</td></tr>
              ) : (
                ventes.map((v: any) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                          <TrendingUp className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-sm font-medium">{v.ref}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{v.client || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{new Date(v.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">{Number(v.total).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOpen(v.id)}><Eye className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewOpen} onOpenChange={(v) => !v && setViewOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Détails {viewing?.ref}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Client: {viewing.client || "—"}</p>
              <div className="border rounded-lg divide-y">
                {viewing.vente_details?.map((d: any) => (
                  <div key={d.id} className="flex justify-between p-3 text-sm">
                    <span>{d.produits?.name} × {d.quantity}</span>
                    <span className="font-medium">{Number(d.total).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 font-semibold">
                <span>Total</span><span>{Number(viewing.total).toFixed(2)} €</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Ventes;
