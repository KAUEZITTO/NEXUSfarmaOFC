
import { getProducts, getAllPatients, getAllDispensations, getUnits, getOrders, getStockMovements } from "@/lib/data";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
    const [products, patients, dispensations, units, orders, stockMovements] = await Promise.all([
        getProducts(),
        getAllPatients(),
        getAllDispensations(),
        getUnits(),
        getOrders(),
        getStockMovements(),
    ]);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const lowStockItems = products.filter(p => p.status === 'Baixo Estoque').length;
  const expiringSoonItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  }).length;
  
  const totalStockAlerts = lowStockItems + expiringSoonItems;

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemsDispensedThisMonth = dispensations
    .filter(d => new Date(d.date) >= firstDayOfMonth)
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const itemsDispensedLastMonth = dispensations
    .filter(d => {
        const dDate = new Date(d.date);
        return dDate >= firstDayOfLastMonth && dDate <= lastDayOfLastMonth;
    })
    .reduce((total, d) => total + d.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  
  let monthlyChangePercentage = 0;
  if (itemsDispensedLastMonth > 0) {
    monthlyChangePercentage = ((itemsDispensedThisMonth - itemsDispensedLastMonth) / itemsDispensedLastMonth) * 100;
  } else if (itemsDispensedThisMonth > 0) {
    monthlyChangePercentage = 100;
  }
  
  const judicialPatients = patients.filter(p => p.demandItems?.includes('Itens Judiciais')).length;


  return (
    <ReportsClient 
        products={products}
        patients={patients}
        dispensations={dispensations}
        units={units}
        orders={orders}
        stockMovements={stockMovements}
        reportStats={{
            itemsDispensedThisMonth,
            monthlyChangePercentage,
            judicialPatients,
            totalStockAlerts,
            lowStockItems,
            expiringSoonItems
        }}
    />
  );
}
