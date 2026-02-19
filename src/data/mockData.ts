export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  threshold: number;
  barcode: string;
  supplier: string;
}

export interface Sale {
  id: string;
  date: string;
  product: string;
  quantity: number;
  total: number;
  client: string;
}

export interface StockAlert {
  id: string;
  product: string;
  currentStock: number;
  threshold: number;
  category: string;
}

export const products: Product[] = [
  { id: "P001", name: "Ciment Portland 50kg", category: "Matériaux", price: 8500, cost: 6500, stock: 245, threshold: 50, barcode: "6001234567890", supplier: "CimBénin SA" },
  { id: "P002", name: "Fer à béton 12mm", category: "Métallurgie", price: 4200, cost: 3200, stock: 18, threshold: 30, barcode: "6001234567891", supplier: "AcierPlus" },
  { id: "P003", name: "Peinture Vinylique 20L", category: "Peintures", price: 15000, cost: 11000, stock: 67, threshold: 20, barcode: "6001234567892", supplier: "ColorMax" },
  { id: "P004", name: "Tuyau PVC 110mm", category: "Plomberie", price: 3500, cost: 2400, stock: 8, threshold: 15, barcode: "6001234567893", supplier: "PlombExpert" },
  { id: "P005", name: "Câble électrique 2.5mm²", category: "Électricité", price: 1200, cost: 800, stock: 320, threshold: 100, barcode: "6001234567894", supplier: "ElecPro" },
  { id: "P006", name: "Sable fin (tonne)", category: "Matériaux", price: 25000, cost: 18000, stock: 12, threshold: 5, barcode: "6001234567895", supplier: "CarrièrePlus" },
  { id: "P007", name: "Gravier concassé (tonne)", category: "Matériaux", price: 30000, cost: 22000, stock: 45, threshold: 10, barcode: "6001234567896", supplier: "CarrièrePlus" },
  { id: "P008", name: "Carrelage 40x40 (m²)", category: "Revêtement", price: 5500, cost: 3800, stock: 5, threshold: 20, barcode: "6001234567897", supplier: "CeramAfrique" },
];

export const recentSales: Sale[] = [
  { id: "V001", date: "2026-02-19", product: "Ciment Portland 50kg", quantity: 50, total: 425000, client: "Entreprise ABC" },
  { id: "V002", date: "2026-02-19", product: "Fer à béton 12mm", quantity: 10, total: 42000, client: "Constructeur XYZ" },
  { id: "V003", date: "2026-02-18", product: "Peinture Vinylique 20L", quantity: 5, total: 75000, client: "Décor Plus" },
  { id: "V004", date: "2026-02-18", product: "Câble électrique 2.5mm²", quantity: 100, total: 120000, client: "ElecBâtiment" },
  { id: "V005", date: "2026-02-17", product: "Sable fin (tonne)", quantity: 3, total: 75000, client: "BTP Solutions" },
];

export const stockAlerts: StockAlert[] = [
  { id: "A001", product: "Carrelage 40x40 (m²)", currentStock: 5, threshold: 20, category: "Revêtement" },
  { id: "A002", product: "Tuyau PVC 110mm", currentStock: 8, threshold: 15, category: "Plomberie" },
  { id: "A003", product: "Fer à béton 12mm", currentStock: 18, threshold: 30, category: "Métallurgie" },
];

export const monthlySalesData = [
  { month: "Sep", ventes: 2800000, achats: 1900000 },
  { month: "Oct", ventes: 3200000, achats: 2100000 },
  { month: "Nov", ventes: 2600000, achats: 1700000 },
  { month: "Déc", ventes: 3800000, achats: 2500000 },
  { month: "Jan", ventes: 4100000, achats: 2800000 },
  { month: "Fév", ventes: 3500000, achats: 2300000 },
];

export const categoryDistribution = [
  { name: "Matériaux", value: 38 },
  { name: "Métallurgie", value: 18 },
  { name: "Peintures", value: 14 },
  { name: "Plomberie", value: 12 },
  { name: "Électricité", value: 10 },
  { name: "Revêtement", value: 8 },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};
