import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download } from "lucide-react";
import { products, formatCurrency } from "@/data/mockData";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= threshold * 0.3)
      return { label: "Critique", className: "bg-destructive/10 text-destructive border-destructive/20" };
    if (stock <= threshold)
      return { label: "Bas", className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Normal", className: "bg-success/10 text-success border-success/20" };
  };

  return (
    <AppLayout title="Produits" subtitle={`${products.length} produits enregistrés`}>
      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtrer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header px-4 py-3 text-left">Réf.</th>
                <th className="table-header px-4 py-3 text-left">Produit</th>
                <th className="table-header px-4 py-3 text-left">Catégorie</th>
                <th className="table-header px-4 py-3 text-right">Prix vente</th>
                <th className="table-header px-4 py-3 text-right">Coût</th>
                <th className="table-header px-4 py-3 text-right">Stock</th>
                <th className="table-header px-4 py-3 text-center">Statut</th>
                <th className="table-header px-4 py-3 text-left">Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = getStockStatus(product.stock, product.threshold);
                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{product.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-card-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.barcode}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-card-foreground">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-card-foreground">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`status-badge ${status.className}`}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{product.supplier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Affichage de {filtered.length} sur {products.length} produits
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Précédent</Button>
            <Button variant="outline" size="sm" disabled>Suivant</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Products;
