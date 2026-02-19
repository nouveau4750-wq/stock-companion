import AppLayout from "@/components/AppLayout";
import KPICard from "@/components/KPICard";
import { Package, TrendingUp, ShoppingCart, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  products,
  recentSales,
  stockAlerts,
  monthlySalesData,
  categoryDistribution,
  formatCurrency,
} from "@/data/mockData";

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 70%, 45%)",
];

const Dashboard = () => {
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  return (
    <AppLayout title="Tableau de bord" subtitle="Vue d'ensemble de votre activité">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Total Produits"
          value={products.length.toString()}
          change="+2 cette semaine"
          changeType="positive"
          icon={Package}
        />
        <KPICard
          title="Valeur du Stock"
          value={formatCurrency(totalValue)}
          change="+8.2% ce mois"
          changeType="positive"
          icon={TrendingUp}
        />
        <KPICard
          title="Ventes du jour"
          value={formatCurrency(467000)}
          change="-3.1% vs hier"
          changeType="negative"
          icon={ShoppingCart}
        />
        <KPICard
          title="Alertes Stock"
          value={stockAlerts.length.toString()}
          change="Seuil critique"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="bg-warning/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Sales Chart */}
        <div className="kpi-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Ventes vs Achats (6 derniers mois)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySalesData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(220, 13%, 91%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="ventes" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Ventes" />
              <Bar dataKey="achats" fill="hsl(220, 15%, 85%)" radius={[4, 4, 0, 0]} name="Achats" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Répartition par catégorie</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {categoryDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {categoryDistribution.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground">Ventes récentes</h3>
            <a href="/ventes" className="text-xs font-medium text-primary hover:underline">Voir tout</a>
          </div>
          <div className="space-y-3">
            {recentSales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{sale.product}</p>
                  <p className="text-xs text-muted-foreground">{sale.client} · {sale.quantity} unités</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-card-foreground">{formatCurrency(sale.total)}</p>
                  <div className="flex items-center gap-0.5 text-success text-xs">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Complété</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground">Alertes de stock critique</h3>
            <a href="/stock" className="text-xs font-medium text-primary hover:underline">Gérer le stock</a>
          </div>
          <div className="space-y-3">
            {stockAlerts.map((alert) => {
              const percentage = Math.round((alert.currentStock / alert.threshold) * 100);
              return (
                <div key={alert.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{alert.product}</p>
                      <p className="text-xs text-muted-foreground">{alert.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                      <ArrowDownRight className="h-3 w-3" />
                      <span>Critique</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {alert.currentStock}/{alert.threshold}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
