export type TakipioNavItem = {
  title: string;
  href: string;
  icon?: string;
  permission?: string;
};

export const takipioNavItems: TakipioNavItem[] = [
  { title: "Dashboard", href: "/app", icon: "LayoutDashboard", permission: "can_view_dashboard" },
  { title: "İşletme", href: "/app/settings", icon: "Building2", permission: "can_manage_settings" },
  { title: "Siparişler", href: "/app/orders", icon: "ShoppingCart", permission: "can_manage_orders" },
  { title: "Kargo", href: "/app/shipments", icon: "Truck", permission: "can_manage_shipments" },
  { title: "Müşteriler", href: "/app/customers", icon: "Users", permission: "can_manage_customers" },
  { title: "Fatura", href: "/app/invoices", icon: "FileText", permission: "can_manage_invoices" },
  { title: "Raporlar", href: "/app/reports", icon: "BarChart3", permission: "can_view_dashboard" },
  { title: "Bildirimler", href: "/app/notifications", icon: "Bell", permission: "can_view_dashboard" },
  { title: "Entegrasyonlar", href: "/app/integrations", icon: "Plug", permission: "can_manage_integrations" },
  { title: "Abonelik", href: "/app/billing", icon: "CreditCard", permission: "can_manage_billing" },
];

export function canShowNavItem(item: TakipioNavItem, member: Record<string, unknown> | null | undefined, isOwner?: boolean) {
  if (isOwner) return true;
  if (!item.permission) return true;
  if (!member) return false;
  return Boolean(member[item.permission]);
}
