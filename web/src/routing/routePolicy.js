import * as Setting from "../Setting";
import * as Conf from "../Conf";

export const SAAS_ROUTES = [
  "/product-store",
  "/products",
  "/coupons",
  "/cart",
  "/orders",
  "/payments",
  "/plans",
  "/pricings",
  "/subscriptions",
  "/transactions",
];

export const SAAS_MENU_KEYS = [
  "/product-store",
  "/products",
  "/coupons",
  "/cart",
  "/orders",
  "/payments",
  "/plans",
  "/pricings",
  "/subscriptions",
  "/transactions",
];

export function isSaaSRoute(pathname) {
  return SAAS_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
}

export function isGlobalAdmin(account) {
  return Setting.isGlobalAdminUser(account);
}

export function canAccessAdmin(account) {
  return isGlobalAdmin(account);
}

export function canAccessPortal(account) {
  return account !== undefined && account !== null;
}

export function getRootRedirect(account) {
  if (account === undefined) {
    return null;
  }
  if (account === null) {
    return "/login";
  }
  if (isGlobalAdmin(account)) {
    return Conf.AdminBasePath;
  }
  return Conf.PortalBasePath;
}

export function getPortalRedirect(account, currentPath) {
  if (account === undefined) {
    return null;
  }
  if (account === null) {
    const redirectUrl = encodeURIComponent(currentPath);
    return `/login?returnUrl=${redirectUrl}`;
  }
  return null;
}

export function getAdminRedirect(account, currentPath) {
  if (account === undefined) {
    return null;
  }
  if (account === null) {
    const redirectUrl = encodeURIComponent(currentPath);
    return `/login?returnUrl=${redirectUrl}`;
  }
  if (!isGlobalAdmin(account)) {
    return Conf.PortalBasePath;
  }
  return null;
}

export const LEGACY_ADMIN_ROUTE_MAP = {
  "/organizations": "/admin/organizations",
  "/groups": "/admin/groups",
  "/users": "/admin/users",
  "/invitations": "/admin/invitations",
  "/applications": "/admin/applications",
  "/providers": "/admin/providers",
  "/resources": "/admin/resources",
  "/certs": "/admin/certs",
  "/keys": "/admin/keys",
  "/roles": "/admin/roles",
  "/permissions": "/admin/permissions",
  "/models": "/admin/models",
  "/adapters": "/admin/adapters",
  "/enforcers": "/admin/enforcers",
  "/agents": "/admin/agents",
  "/servers": "/admin/servers",
  "/server-store": "/admin/server-store",
  "/entries": "/admin/entries",
  "/sites": "/admin/sites",
  "/rules": "/admin/rules",
  "/sessions": "/admin/sessions",
  "/records": "/admin/records",
  "/tokens": "/admin/tokens",
  "/verifications": "/admin/verifications",
  "/sysinfo": "/admin/sysinfo",
  "/forms": "/admin/forms",
  "/syncers": "/admin/syncers",
  "/webhooks": "/admin/webhooks",
  "/webhook-events": "/admin/webhook-events",
  "/tickets": "/admin/tickets",
  "/transactions": "/admin/transactions",
  "/ldap": "/admin/ldap",
};

export const PORTAL_ROUTE_MAP = {
  "/account": "/portal/profile",
};
