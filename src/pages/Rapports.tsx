import AppLayout from "@/components/AppLayout";
import KPICard from "@/components/KPICard";
import { TrendingUp, ShoppingCart, Package, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/data/mockData";

const COLORS = [
  "hsl(220, 70%, 50%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(190, 70%, 45%)",
];

const Rapports = () => {
  const { data: ventes = [] } = useQuery({
    queryKey: ["rapports-ventes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ventes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: achats = [] } = useQuery({
    queryKey: ["rapports-achats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achats").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: topProduits = [] } = useQuery({
    queryKey: ["rapports-top-produits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vente_details")
        .select("produit_id, quantity, total, produits(name)");
      if (error) throw error;
      // Aggregate by product
      const agg: Record<string, { name: string; quantity: number; total: number }> = {};
      (data || []).forEach((d: any) => {
        const key = d.produit_id;
        if (!agg[key]) agg[key] = { name: d.produits?.name || "Inconnu", quantity: 0, total: 0 };
        agg[key].quantity += d.quantity;
        agg[key].total += Number(d.total);
      });
      return Object.values(agg).sort((a, b) => b.total - a.total).slice(0, 6);
    },
  });

  const totalVentes = ventes.reduce((s: number, v: any) => s + Number(v.total), 0);
  const totalAchats = achats.reduce((s: number, a: any) => s + Number(a.total), 0);
  const benefice = totalVentes - totalAchats;

  // Group sales by month for chart
  const monthlyData: Record<string, { month: string; ventes: number; achats: number }> = {};
  ventes.forEach((v: any) => {
    const d = new Date(v.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    if (!monthlyData[key]) monthlyData[key] = { month: label, ventes: 0, achats: 0 };
    monthlyData[key].ventes += Number(v.total);
  });
  achats.forEach((a: any) => {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    if (!monthlyData[key]) monthlyData[key] = { month: label, ventes: 0, achats: 0 };
    monthlyData[key].achats += Number(a.total);
  });
  const chartData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);

  // Daily sales (last 7 days)
  const dailyData: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyData[d.toISOString().split("T")[0]] = 0;
  }
  ventes.forEach((v: any) => {
    const day = v.created_at?.split("T")[0];
    if (day && dailyData[day] !== undefined) dailyData[day] += Number(v.total);
  });
  const dailyChartData = Object.entries(dailyData).map(([date, total]) => ({
    day: new Date(date).toLocaleDateString("fr-FR", { weekday: "short" }),
    total,
  }));

  return (
    <AppLayout title="Rapports" subtitle="Statistiques et analyses">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard title="Total Ventes" value={formatCurrency(totalVentes)} icon={TrendingUp} changeType="positive" change={`${ventes.length} ventes`} />
        <KPICard title="Total Achats" value={formatCurrency(totalAchats)} icon={ShoppingCart} changeType="neutral" change={`${achats.length} achats`} />
        <KPICard title="Bénéfice" value={formatCurrency(benefice)} icon={DollarSign} changeType={benefice >= 0 ? "positive" : "negative"} change={benefice >= 0 ? "Rentable" : "Déficitaire"} />
        <KPICard title="Produits vendus" value={topProduits.reduce((s, p) => s + p.quantity, 0).toString()} icon={Package} changeType="neutral" change="Unités totales" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Monthly */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Ventes vs Achats (mensuel)</h3>
          {chartData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">Aucune donnée disponible</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="ventes" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Ventes" />
                <Bar dataKey="achats" fill="hsl(220, 15%, 85%)" radius={[4, 4, 0, 0]} name="Achats" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Ventes journalières (7 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="total" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="Ventes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Produits les plus vendus</h3>
          {topProduits.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topProduits} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="total" nameKey="name" stroke="none">
                  {topProduits.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1.5">
            {topProduits.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground truncate max-w-[150px]">{p.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{formatCurrency(p.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefice summary */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Résumé financier</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm text-muted-foreground">Chiffre d'affaires</span>
              <span className="text-sm font-semibold text-card-foreground">{formatCurrency(totalVentes)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm text-muted-foreground">Coût des achats</span>
              <span className="text-sm font-semibold text-card-foreground">{formatCurrency(totalAchats)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm text-muted-foreground">Marge brute</span>
              <span className={`text-sm font-bold ${benefice >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(benefice)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Taux de marge</span>
              <span className="text-sm font-semibold text-card-foreground">
                {totalVentes > 0 ? ((benefice / totalVentes) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Rapports;
