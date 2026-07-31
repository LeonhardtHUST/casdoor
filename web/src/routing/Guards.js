import React from "react";
import {Redirect} from "react-router-dom";
import * as Conf from "../Conf";
import * as RoutePolicy from "./routePolicy";

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
