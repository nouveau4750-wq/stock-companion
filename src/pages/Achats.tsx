import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LineItem {
  produit_id: string;
  quantity: number;
  unit_price: number;
}

const Achats = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string>("");
  const [lines, setLines] = useState<LineItem[]>([{ produit_id: "", quantity: 1, unit_price: 0 }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achats = [], isLoading } = useQuery({
    queryKey: ["achats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achats")
        .select("*, fournisseurs(name), achat_details(*, produits(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: produits = [] } = useQuery({
    queryKey: ["produits-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produits").select("id, name, cost").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: fournisseurs = [] } = useQuery({
    queryKey: ["fournisseurs-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fournisseurs").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const validLines = lines.filter(l => l.produit_id && l.quantity > 0);
      if (validLines.length === 0) throw new Error("Ajoutez au moins une ligne");

      const total = validLines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const ref = `ACH-${Date.now()}`;
      const { data: { user } } = await supabase.auth.getUser();

      const { data: achat, error: e1 } = await supabase
        .from("achats")
        .insert({ ref, fournisseur_id: fournisseurId || null, total, status: "complete", user_id: user?.id })
        .select()
        .single();
      if (e1) throw e1;

      const details = validLines.map(l => ({
        achat_id: achat.id,
        produit_id: l.produit_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total: l.quantity * l.unit_price,
      }));
      const { error: e2 } = await supabase.from("achat_details").insert(details);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achats"] });
      queryClient.invalidateQueries({ queryKey: ["produits"] });
      setDialogOpen(false);
      reset();
      toast({ title: "Achat enregistré", description: "Le stock a été mis à jour automatiquement" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const reset = () => { setFournisseurId(""); setLines([{ produit_id: "", quantity: 1, unit_price: 0 }]); };

  const updateLine = (i: number, field: keyof LineItem, value: any) => {
    const next = [...lines];
    next[i] = { ...next[i], [field]: value };
    if (field === "produit_id") {
      const p = produits.find((p: any) => p.id === value);
      if (p) next[i].unit_price = Number(p.cost) || 0;
    }
    setLines(next);
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const viewing = achats.find((a: any) => a.id === viewOpen);

  return (
    <AppLayout title="Achats" subtitle={`${achats.length} commandes`}>
      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nouvel achat</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouvel achat</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Fournisseur</Label>
                <Select value={fournisseurId} onValueChange={setFournisseurId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Produits</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { produit_id: "", quantity: 1, unit_price: 0 }])}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Ligne
                  </Button>
                </div>
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <Select value={line.produit_id} onValueChange={(v) => updateLine(i, "produit_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Produit" /></SelectTrigger>
                        <SelectContent>
                          {produits.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", parseInt(e.target.value) || 0)} />
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
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">{total.toFixed(2)} €</span>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer l'achat"}
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
                <th className="table-header px-4 py-3 text-left hidden sm:table-cell">Fournisseur</th>
                <th className="table-header px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="table-header px-4 py-3 text-right">Total</th>
                <th className="table-header px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Chargement...</td></tr>
              ) : achats.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Aucun achat</td></tr>
              ) : (
                achats.map((a: any) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{a.ref}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{a.fournisseurs?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{new Date(a.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">{Number(a.total).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOpen(a.id)}><Eye className="h-3.5 w-3.5" /></Button>
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
              <p className="text-sm text-muted-foreground">Fournisseur: {viewing.fournisseurs?.name || "—"}</p>
              <div className="border rounded-lg divide-y">
                {viewing.achat_details?.map((d: any) => (
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

export default Achats;
