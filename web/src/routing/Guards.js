import React from "react";
import {Redirect} from "react-router-dom";
import * as Conf from "../Conf";
import * as RoutePolicy from "./routePolicy";

export function RootRedirect({account, children, location}) {
  if (account === undefined) {
    return null;
  }

  const redirectPath = RoutePolicy.getRootRedirect(account);
  if (redirectPath) {
    return <Redirect to={redirectPath} />;
  }

  return children;
}

export function PortalGuard({account, children, location}) {
  if (account === undefined) {
    return null;
  }

  if (account === null) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Redirect to={`/login?returnUrl=${redirectUrl}`} />;
  }

  return children;
}

export function AdminGuard({account, children, location}) {
  if (account === undefined) {
    return null;
  }

  if (account === null) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Redirect to={`/login?returnUrl=${redirectUrl}`} />;
  }

  if (!RoutePolicy.canAccessAdmin(account)) {
    return <Redirect to={Conf.PortalBasePath} />;
  }

  return children;
}

export function LegacyAdminRedirect({account, location}) {
  const pathname = location.pathname;

  if (RoutePolicy.isSaaSRoute(pathname)) {
    if (account && RoutePolicy.canAccessAdmin(account)) {
      return <Redirect to={Conf.AdminBasePath} />;
    }
    return <Redirect to={Conf.PortalBasePath} />;
  }

  const newPath = RoutePolicy.LEGACY_ADMIN_ROUTE_MAP[pathname];
  if (newPath) {
    if (!account) {
      const redirectUrl = encodeURIComponent(pathname + location.search);
      return <Redirect to={`/login?returnUrl=${redirectUrl}`} />;
    }
    if (!RoutePolicy.canAccessAdmin(account)) {
      return <Redirect to={Conf.PortalBasePath} />;
    }
    const newUrl = newPath + (location.search || "");
    return <Redirect to={newUrl} />;
  }

  return null;
}
