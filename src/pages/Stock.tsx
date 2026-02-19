import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/data/mockData";

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: produits = [], isLoading } = useQuery({
    queryKey: ["stock-produits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produits")
        .select("*, categories(name), fournisseurs(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*, produits(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= threshold * 0.3) return { label: "Critique", className: "bg-destructive/10 text-destructive border-destructive/20" };
    if (stock <= threshold) return { label: "Bas", className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Normal", className: "bg-success/10 text-success border-success/20" };
  };

  const filtered = produits.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ref.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alertCount = produits.filter((p: any) => p.stock <= p.threshold).length;

  return (
    <AppLayout title="Gestion du Stock" subtitle={`${produits.length} produits · ${alertCount} alertes`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." className="pl-9 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock table */}
        <div className="lg:col-span-2 rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-header px-4 py-3 text-left">Produit</th>
                  <th className="table-header px-4 py-3 text-right">Stock</th>
                  <th className="table-header px-4 py-3 text-right hidden sm:table-cell">Seuil</th>
                  <th className="table-header px-4 py-3 text-center">Statut</th>
                  <th className="table-header px-4 py-3 text-right hidden md:table-cell">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Aucun produit</td></tr>
                ) : (
                  filtered.map((p: any) => {
                    const status = getStockStatus(p.stock, p.threshold);
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.ref} · {(p.categories as any)?.name || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-card-foreground">{p.stock}</td>
                        <td className="px-4 py-3 text-sm text-right text-muted-foreground hidden sm:table-cell">{p.threshold}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`status-badge ${status.className}`}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-card-foreground hidden md:table-cell">
                          {formatCurrency(p.stock * Number(p.price))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent movements */}
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">Mouvements récents</h3>
          </div>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun mouvement</p>
            ) : (
              movements.slice(0, 10).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {m.type === "entree" ? (
                      <ArrowDownRight className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-card-foreground">{(m.produits as any)?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.reason || m.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${m.type === "entree" ? "text-success" : "text-destructive"}`}>
                    {m.type === "entree" ? "+" : "-"}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Stock;
