// Copyright 2021 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {Component, Suspense, lazy} from "react";
import "./App.less";
import {Helmet} from "react-helmet";
import * as Setting from "./Setting";
import {setOrgIsTourVisible, setTourLogo} from "./TourConfig";
import {StyleProvider, legacyLogicalPropertiesTransformer} from "@ant-design/cssinjs";
import {GithubOutlined, InfoCircleFilled, ShareAltOutlined} from "@ant-design/icons";
import {Alert, Button, ConfigProvider, Drawer, FloatButton, Layout, Result, Tooltip} from "antd";
import {AiDots} from "./common/Loading";
import {Redirect, Route, Switch, withRouter} from "react-router-dom";
import CustomHead from "./basic/CustomHead";
import * as Conf from "./Conf";
import {shadcnDarkThemeComponents, shadcnDarkThemeToken, shadcnThemeComponents, shadcnThemeToken} from "./shadcnTheme";

import * as Auth from "./auth/Auth";
import EntryPage from "./EntryPage";
import * as AuthBackend from "./auth/AuthBackend";
import AuthCallback from "./auth/AuthCallback";
import SamlCallback from "./auth/SamlCallback";
import TelegramLogin from "./auth/TelegramLogin";
import i18next from "i18next";
import {withTranslation} from "react-i18next";
const ManagementPage = lazy(() => import("./ManagementPage"));
const PortalLayout = lazy(() => import("./portal/PortalLayout"));
const AdminEntry = lazy(() => import("./admin/AdminEntry"));
const DisabledFeaturePage = lazy(() => import("./admin/DisabledFeaturePage"));
const {Footer, Content} = Layout;

import {setTwoToneColor} from "@ant-design/icons";
import * as ApplicationBackend from "./backend/ApplicationBackend";
import * as Cookie from "cookie";
import * as RoutePolicy from "./routing/routePolicy";
import * as Guards from "./routing/Guards";

// Ant Design locale imports - Leon's Testfield: only zh and en
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

setTwoToneColor("rgb(87,52,211)");

function getAntdLocale(language) {
  const localeMap = {
    "en": enUS,
    "zh": zhCN,
  };
  return localeMap[language] || zhCN;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.setThemeAlgorithm();
    let storageThemeAlgorithm = [];
    try {
      storageThemeAlgorithm = localStorage.getItem("themeAlgorithm") ? JSON.parse(localStorage.getItem("themeAlgorithm")) : ["default"];
    } catch {
      storageThemeAlgorithm = ["default"];
    }
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      accessToken: undefined,
      uri: null,
      themeAlgorithm: storageThemeAlgorithm,
      themeData: Conf.ThemeDefault,
      logo: this.getLogo(storageThemeAlgorithm),
      requiredEnableMfa: false,
      isAiAssistantOpen: false,
      application: undefined,
    };
    Setting.initServerUrl();
    Setting.initWebConfig();
    Auth.initAuthWithConfig({
      serverUrl: Setting.ServerUrl,
      appName: Conf.DefaultApplication, // the application used in Casdoor root path: "/"
    });
  }

  UNSAFE_componentWillMount() {
    this.updateMenuKey();
    this.getAccount();
    this.getApplication();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const uri = location.pathname;
    if (this.state.uri !== uri) {
      this.updateMenuKey();
    }

    if (this.state.account !== prevState.account) {
      const requiredEnableMfa = Setting.isRequiredEnableMfa(this.state.account, this.state.account?.organization);
      this.setState({
        requiredEnableMfa: requiredEnableMfa,
      });

      if (requiredEnableMfa === true) {
        const mfaType = Setting.getMfaItemsByRules(this.state.account, this.state.account?.organization, [Setting.MfaRuleRequired])
          .find((item) => item.rule === Setting.MfaRuleRequired)?.name;
        if (mfaType !== undefined) {
          this.props.history.push(`/mfa/setup?mfaType=${mfaType}`, {from: "/login"});
        }
      }
    }
  }

  shouldFlattenMenu(uri) {
    const organization = this.state.account?.organization;
    const navItems = Setting.isLocalAdminUser(this.state.account) ? organization?.navItems : (organization?.userNavItems ?? []);

    // If navItems is "all" or not configured, don't flatten
    if (!Array.isArray(navItems) || navItems?.includes("all")) {
      return false;
    }

    // Count how many valid menu items would be visible (excluding SaaS routes)
    const validMenuItems = [
      "/", "/shortcuts", "/apps", // Home group
      "/organizations", "/groups", "/users", "/invitations", // User Management
      "/applications", "/providers", "/resources", "/certs", "/keys", // Identity
      "/roles", "/permissions", "/models", "/adapters", "/enforcers", // Authorization
      "/agents", "/servers", "/server-store", "/entries", "/sites", "/rules", // LLM AI
      "/sessions", "/records", "/tokens", "/verifications", // Auditing
      "/sysinfo", "/forms", "/syncers", "/webhooks", "/webhook-events", "/tickets", // Admin
    ];

    const count = navItems.filter(item => validMenuItems.includes(item)).length;
    return count <= Conf.MaxItemsForFlatMenu;
  }

  getSelectedMenuKeyForFlatMenu(uri) {
    // For flattened menu, return the actual child path instead of parent group
    if (uri === "/" || uri.includes("/shortcuts") || uri.includes("/apps")) {
      if (uri === "/") {
        return "/";
      } else if (uri.includes("/shortcuts")) {
        return "/shortcuts";
      } else if (uri.includes("/apps")) {
        return "/apps";
      }
    } else if (uri.includes("/organizations") || uri.includes("/trees") || uri.includes("/groups") || uri.includes("/users") || uri.includes("/invitations")) {
      if (uri.includes("/organizations")) {
        return "/organizations";
      } else if (uri.includes("/groups")) {
        return "/groups";
      } else if (uri.includes("/users")) {
        return "/users";
      } else if (uri.includes("/invitations")) {
        return "/invitations";
      }
    } else if (uri.includes("/applications") || uri.includes("/providers") || uri.includes("/resources") || uri.includes("/certs")) {
      if (uri.includes("/applications")) {
        return "/applications";
      } else if (uri.includes("/providers")) {
        return "/providers";
      } else if (uri.includes("/resources")) {
        return "/resources";
      } else if (uri.includes("/certs")) {
        return "/certs";
      }
    } else if (uri.includes("/keys")) {
      return "/keys";
    } else if (uri.includes("/agents") || uri.includes("/servers") || uri.includes("/entries") || uri.includes("/sites") || uri.includes("/rules")) {
      if (uri.includes("/agents")) {
        return "/agents";
      } else if (uri.includes("/servers")) {
        return "/servers";
      } else if (uri.includes("/server-store")) {
        return "/server-store";
      } else if (uri.includes("/entries")) {
        return "/entries";
      } else if (uri.includes("/sites")) {
        return "/sites";
      } else if (uri.includes("/rules")) {
        return "/rules";
      }
    } else if (uri.includes("/roles") || uri.includes("/permissions") || uri.includes("/models") || uri.includes("/adapters") || uri.includes("/enforcers")) {
      if (uri.includes("/roles")) {
        return "/roles";
      } else if (uri.includes("/permissions")) {
        return "/permissions";
      } else if (uri.includes("/models")) {
        return "/models";
      } else if (uri.includes("/adapters")) {
        return "/adapters";
      } else if (uri.includes("/enforcers")) {
        return "/enforcers";
      }
    } else if (uri.includes("/records") || uri.includes("/tokens") || uri.includes("/sessions") || uri.includes("/verifications")) {
      if (uri.includes("/sessions")) {
        return "/sessions";
      } else if (uri.includes("/records")) {
        return "/records";
      } else if (uri.includes("/tokens")) {
        return "/tokens";
      } else if (uri.includes("/verifications")) {
        return "/verifications";
      }
    } else if (uri.includes("/products") || uri.includes("/orders") || uri.includes("/payments") || uri.includes("/plans") || uri.includes("/pricings") || uri.includes("/subscriptions") || uri.includes("/transactions")) {
      if (uri.includes("/products")) {
        return "/products";
      } else if (uri.includes("/orders")) {
        return "/orders";
      } else if (uri.includes("/payments")) {
        return "/payments";
      } else if (uri.includes("/plans")) {
        return "/plans";
      } else if (uri.includes("/pricings")) {
        return "/pricings";
      } else if (uri.includes("/subscriptions")) {
        return "/subscriptions";
      } else if (uri.includes("/transactions")) {
        return "/transactions";
      }
    } else if (uri.includes("/sysinfo") || uri.includes("/forms") || uri.includes("/syncers") || uri.includes("/webhooks") || uri.includes("/webhook-events") || uri.includes("/tickets")) {
      if (uri.includes("/sysinfo")) {
        return "/sysinfo";
      } else if (uri.includes("/forms")) {
        return "/forms";
      } else if (uri.includes("/syncers")) {
        return "/syncers";
      } else if (uri.includes("/webhook-events")) {
        return "/webhook-events";
      } else if (uri.includes("/webhooks") || uri.includes("/webhook-events")) {
        return "/webhooks";
      } else if (uri.includes("/tickets")) {
        return "/tickets";
      }
    } else if (uri.includes("/signup")) {
      return "/signup";
    } else if (uri.includes("/login")) {
      return "/login";
    } else if (uri.includes("/result")) {
      return "/result";
    }
    return -1;
  }

  updateMenuKey() {
    const uri = location.pathname;
    this.setState({
      uri: uri,
    });

    // Strip /admin and /portal prefixes for menu key matching
    const normalizedUri = uri.replace(/^\/admin/, "").replace(/^\/portal/, "") || "/";

    // Check if menu should be flattened and use appropriate key selection
    if (this.shouldFlattenMenu(normalizedUri)) {
      const selectedKey = this.getSelectedMenuKeyForFlatMenu(normalizedUri);
      this.setState({selectedMenuKey: selectedKey});
      return;
    }

    // Original logic for grouped menu
    if (normalizedUri === "/" || normalizedUri.includes("/shortcuts") || normalizedUri.includes("/apps")) {
      this.setState({selectedMenuKey: "/home"});
    } else if (normalizedUri.includes("/organizations") || normalizedUri.includes("/trees") || normalizedUri.includes("/groups") || normalizedUri.includes("/users") || normalizedUri.includes("/invitations")) {
      this.setState({selectedMenuKey: "/orgs"});
    } else if (normalizedUri.includes("/applications") || normalizedUri.includes("/providers") || normalizedUri.includes("/resources") || normalizedUri.includes("/certs") || normalizedUri.includes("/keys")) {
      this.setState({selectedMenuKey: "/identity"});
    } else if (normalizedUri.includes("/agents") || normalizedUri.includes("/servers") || normalizedUri.includes("/server-store") || normalizedUri.includes("/entries") || normalizedUri.includes("/sites") || normalizedUri.includes("/rules")) {
      this.setState({selectedMenuKey: "/gateway"});
    } else if (normalizedUri.includes("/roles") || normalizedUri.includes("/permissions") || normalizedUri.includes("/models") || normalizedUri.includes("/adapters") || normalizedUri.includes("/enforcers")) {
      this.setState({selectedMenuKey: "/auth"});
    } else if (normalizedUri.includes("/records") || normalizedUri.includes("/tokens") || normalizedUri.includes("/sessions") || normalizedUri.includes("/verifications")) {
      this.setState({selectedMenuKey: "/logs"});
    } else if (normalizedUri.includes("/product-store") || normalizedUri.includes("/products") || normalizedUri.includes("/orders") || normalizedUri.includes("/payments") || normalizedUri.includes("/plans") || normalizedUri.includes("/pricings") || normalizedUri.includes("/subscriptions") || normalizedUri.includes("/transactions")) {
      this.setState({selectedMenuKey: "/business"});
    } else if (normalizedUri.includes("/sysinfo") || normalizedUri.includes("/forms") || normalizedUri.includes("/syncers") || normalizedUri.includes("/webhooks") || normalizedUri.includes("/webhook-events") || normalizedUri.includes("/tickets")) {
      this.setState({selectedMenuKey: "/admin"});
    } else if (normalizedUri.includes("/signup")) {
      this.setState({selectedMenuKey: "/signup"});
    } else if (normalizedUri.includes("/login")) {
      this.setState({selectedMenuKey: "/login"});
    } else if (normalizedUri.includes("/result")) {
      this.setState({selectedMenuKey: "/result"});
    } else {
      this.setState({selectedMenuKey: -1});
    }
  }

  getAccessTokenParam(params) {
    // "/page?access_token=123"
    const accessToken = params.get("access_token");
    return accessToken === null ? "" : `?accessToken=${accessToken}`;
  }

  getCredentialParams(params) {
    // "/page?username=abc&password=123"
    if (params.get("username") === null || params.get("password") === null) {
      return "";
    }
    return `?username=${params.get("username")}&password=${params.get("password")}`;
  }

  getUrlWithoutQuery() {
    return window.location.toString().replace(window.location.search, "");
  }

  getLanguageParam(params) {
    // "/page?language=en"
    const language = params.get("language");
    if (language !== null) {
      Setting.setLanguage(language);
      return `language=${language}`;
    }
    return "";
  }

  getLogo(themes) {
    return Setting.getLogo(themes);
  }

  setThemeAlgorithm() {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const themeType = url.searchParams.get("theme");
    if (themeType === "dark" || themeType === "default") {
      localStorage.setItem("themeAlgorithm", JSON.stringify([themeType]));
    }
  }

  setLanguage(account) {
    const language = account?.language;
    if (language !== null && language !== "" && language !== i18next.language) {
      Setting.setLanguage(language);
    }
  }

  setTheme = (theme, initThemeAlgorithm) => {
    this.setState({
      themeData: theme,
    });

    if (initThemeAlgorithm) {
      if (localStorage.getItem("themeAlgorithm")) {
        let storageThemeAlgorithm = [];
        try {
          storageThemeAlgorithm = JSON.parse(localStorage.getItem("themeAlgorithm"));
        } catch {
          storageThemeAlgorithm = ["default"];
        }
        this.setState({
          logo: this.getLogo(storageThemeAlgorithm),
          themeAlgorithm: storageThemeAlgorithm,
        });
        return;
      }
      this.setState({
        logo: this.getLogo(Setting.getAlgorithmNames(theme)),
        themeAlgorithm: Setting.getAlgorithmNames(theme),
      });
    }
  };

  getApplication() {
    const applicationName = localStorage.getItem("applicationName");
    if (!applicationName) {
      return;
    }
    ApplicationBackend.getApplication("admin", applicationName)
      .then((res) => {
        if (res.status === "error") {
          Setting.showMessage("error", res.msg);
          return;
        }

        this.setState({
          application: res.data,
        });
      });
  }

  getAccount() {
    const params = new URLSearchParams(this.props.location.search);

    let query = this.getAccessTokenParam(params);
    if (query === "") {
      query = this.getCredentialParams(params);
    }

    const query2 = this.getLanguageParam(params);
    if (query2 !== "") {
      const url = window.location.toString().replace(new RegExp(`[?&]${query2}`), "");
      window.history.replaceState({}, document.title, url);
    }

    if (query !== "") {
      const returnUrl = params.get("returnUrl");

      let newUrl;
      if (returnUrl) {
        const newParams = new URLSearchParams();
        newParams.set("returnUrl", returnUrl);
        newUrl = window.location.pathname + "?" + newParams.toString();
      } else {
        newUrl = this.getUrlWithoutQuery();
      }
      window.history.replaceState({}, document.title, newUrl);
    }

    AuthBackend.getAccount(query)
      .then((res) => {
        let account = null;
        let accessToken = null;
        if (res.status === "ok") {
          account = res.data;
          account.organization = res.data2;
          accessToken = res.data.accessToken;

          if (!localStorage.getItem("language")) {
            this.setLanguage(account);
          }
          this.setTheme(Setting.getThemeData(account.organization), Conf.InitThemeAlgorithm);
          setTourLogo(account.organization.logo);
          setOrgIsTourVisible(account.organization.enableTour);
        } else {
          if (res.data !== "Please login first") {
            Setting.showMessage("error", `${i18next.t("application:Failed to sign in")}: ${res.msg}`);
          }
        }

        this.setState({
          account: account,
          accessToken: accessToken,
        });
      });
  }

  onUpdateAccount(account) {
    this.setState({
      account: account,
    });
  }

  renderFooter(logo, footerHtml) {
    logo = logo ?? this.state.logo;
    footerHtml = footerHtml ?? this.state.application?.footerHtml;
    return (
      <React.Fragment>
        {!this.state.account ? null : <div style={{display: "none"}} id="CasdoorApplicationName" value={this.state.account.signupApplication} />}
        {!this.state.account ? null : <div style={{display: "none"}} id="CasdoorAccessToken" value={this.state.accessToken} />}
        <Footer id="footer" style={
          {
            textAlign: "center",
          }
        }>
          {
            footerHtml && footerHtml !== "" ?
              <React.Fragment>
                <div dangerouslySetInnerHTML={{__html: footerHtml}} />
              </React.Fragment>
              : (
                Conf.CustomFooter !== null ? Conf.CustomFooter : (
                  <React.Fragment>
                    Powered by <a target="_blank" href="https://casdoor.org" rel="noreferrer"><img style={{paddingBottom: "3px"}} height={"20px"} alt={"Casdoor"} src={logo} /></a>
                  </React.Fragment>
                )
              )
          }
        </Footer>
      </React.Fragment>
    );
  }

  renderAiAssistant() {
    return (
      <Drawer
        title={
          <React.Fragment>
            <Tooltip title="Want to deploy your own AI assistant? Click to learn more!">
              <a target="_blank" rel="noreferrer" href={"https://casdoor.com"}>
                <img style={{width: "20px", marginRight: "10px", marginBottom: "2px"}} alt="help" src="https://casbin.org/img/casbin.svg" />
                AI Assistant
              </a>
            </Tooltip>
            <a className="custom-link" style={{float: "right", marginTop: "2px"}} target="_blank" rel="noreferrer" href={`${Conf.AiAssistantUrl}`}>
              <ShareAltOutlined className="custom-link" style={{fontSize: "20px", color: "rgb(140,140,140)"}} />
            </a>
            <a className="custom-link" style={{float: "right", marginRight: "30px", marginTop: "2px"}} target="_blank" rel="noreferrer" href={"https://github.com/casibase/casibase"}>
              <GithubOutlined className="custom-link" style={{fontSize: "20px", color: "rgb(140,140,140)"}} />
            </a>
          </React.Fragment>
        }
        placement="right"
        width={500}
        mask={false}
        onClose={() => {
          this.setState({
            isAiAssistantOpen: false,
          });
        }}
        open={this.state.isAiAssistantOpen}
      >
        <iframe id="iframeHelper" title={"iframeHelper"} src={`${Conf.AiAssistantUrl}/?isRaw=1`} width="100%" height="100%" scrolling="no" frameBorder="no" />
      </Drawer>
    );
  }

  isDoorPages() {
    return this.isEntryPages() ||
      window.location.pathname.startsWith("/callback") ||
      window.location.pathname.startsWith("/telegram-login");
  }

  isEntryPages() {
    return window.location.pathname.startsWith("/signup") ||
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/forget") ||
      window.location.pathname.startsWith("/prompt") ||
      window.location.pathname.startsWith("/result") ||
      window.location.pathname.startsWith("/cas") ||
      window.location.pathname.startsWith("/select-plan") ||
      window.location.pathname.startsWith("/buy-plan") ||
      window.location.pathname.startsWith("/qrcode") ||
      window.location.pathname.startsWith("/consent") ||
      window.location.pathname.startsWith("/captcha");
  }

  onClick = ({key}) => {
    if (key !== "/swagger" && key !== "/records") {
      if (this.state.requiredEnableMfa) {
        Setting.showMessage("info", "Please enable MFA first!");
      } else {
        this.props.history.push(key);
      }
    }
  };

  onLoginSuccess(redirectUrl) {
    window.google?.accounts?.id?.cancel();
    if (redirectUrl) {
      localStorage.setItem("mfaRedirectUrl", redirectUrl);
    }
    this.getAccount();
  }

  renderPage() {
    if (this.isDoorPages()) {
      let themeData = this.state.themeData;
      let logo = this.state.logo;
      let footerHtml = null;
      if (this.state.organization === undefined) {
        const curCookie = Cookie.parse(document.cookie);
        if (curCookie["organizationTheme"] && curCookie["organizationTheme"] !== "null") {
          themeData = JSON.parse(curCookie["organizationTheme"]);
        }
        if (curCookie["organizationLogo"] && curCookie["organizationLogo"] !== "") {
          logo = curCookie["organizationLogo"];
        }
        if (curCookie["organizationFootHtml"] && curCookie["organizationFootHtml"] !== "") {
          footerHtml = curCookie["organizationFootHtml"];
        }
      }

      return (
        <ConfigProvider
          locale={getAntdLocale(Setting.getLanguage())}
          spin={{indicator: <AiDots />}}
          theme={{
            token: {
              ...(Setting.isDarkTheme(this.state.themeAlgorithm) ? shadcnDarkThemeToken : shadcnThemeToken),
              colorPrimary: themeData.colorPrimary,
              borderRadius: themeData.borderRadius,
            },
            components: Setting.isDarkTheme(this.state.themeAlgorithm) ? shadcnDarkThemeComponents : shadcnThemeComponents,
            algorithm: Setting.getAlgorithm(this.state.themeAlgorithm),
          }}>
          <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
            <Layout id="parent-area">
              <CustomHead id="page" headerHtml={this.state.application?.pageHtml} />
              <Content style={{display: "flex", justifyContent: "center"}}>
                {
                  this.isEntryPages() ?
                    <EntryPage
                      account={this.state.account}
                      theme={this.state.themeData}
                      themeAlgorithm={this.state.themeAlgorithm}
                      requiredEnableMfa={this.state.requiredEnableMfa}
                      updateApplication={(application) => {
                        this.setState({
                          application: application,
                        });
                      }}
                      onLoginSuccess={(redirectUrl) => {this.onLoginSuccess(redirectUrl);}}
                      onUpdateAccount={(account) => this.onUpdateAccount(account)}
                      updataThemeData={this.setTheme}
                    /> :
                    <Switch>
                      <Route exact path="/callback" render={(props) => <AuthCallback {...props} {...this.props} application={this.state.application} onLoginSuccess={(redirectUrl) => {this.onLoginSuccess(redirectUrl);}} />} />
                      <Route exact path="/callback/saml" render={(props) => <SamlCallback {...props} {...this.props} application={this.state.application} onLoginSuccess={(redirectUrl) => {this.onLoginSuccess(redirectUrl);}} />} />
                      <Route exact path="/telegram-login" render={(props) => <TelegramLogin {...props} {...this.props} />} />
                      <Route path="" render={() => <Result status="404" title="404 NOT FOUND" subTitle={i18next.t("general:Sorry, the page you visited does not exist.")}
                        extra={<a href="/"><Button type="primary">{i18next.t("general:Back Home")}</Button></a>} />} />
                    </Switch>
                }
              </Content>
              {
                this.renderFooter(logo, footerHtml)
              }
              {
                this.renderAiAssistant()
              }
            </Layout>
          </StyleProvider>
        </ConfigProvider>
      );
    }
    return (
      <React.Fragment>
        <FloatButton.BackTop />
        {
          <Suspense fallback={null}>
            <Layout id="parent-area">
              <Switch>
                {/* Root redirect - only for "/" path */}
                <Route exact path="/" render={() => {
                  const redirectPath = RoutePolicy.getRootRedirect(this.state.account);
                  return redirectPath ? <Redirect to={redirectPath} /> : null;
                }} />

                {/* Portal routes */}
                <Route path="/portal" render={(rp) =>
                  <Guards.PortalGuard account={this.state.account} location={rp.location}>
                    <PortalLayout
                      account={this.state.account}
                      application={this.state.application}
                      uri={this.state.uri}
                      themeData={this.state.themeData}
                      themeAlgorithm={this.state.themeAlgorithm}
                      requiredEnableMfa={this.state.requiredEnableMfa}
                      logo={this.state.logo}
                      onChangeTheme={this.setTheme}
                      onClick={this.onClick}
                      onfinish={() => {
                        this.setState({requiredEnableMfa: false});
                      }}
                      setLogoAndThemeAlgorithm={(nextThemeAlgorithm) => {
                        this.setState({
                          themeAlgorithm: nextThemeAlgorithm,
                          logo: this.getLogo(nextThemeAlgorithm),
                        });
                        localStorage.setItem("themeAlgorithm", JSON.stringify(nextThemeAlgorithm));
                      }}
                      setLogoutState={() => {
                        this.setState({account: null});
                      }}
                      history={rp.history}
                      location={rp.location}
                    />
                  </Guards.PortalGuard>
                } />

                {/* Admin routes */}
                <Route path="/admin" render={(rp) =>
                  <Guards.AdminGuard account={this.state.account} location={rp.location}>
                    <AdminEntry
                      account={this.state.account}
                      application={this.state.application}
                      uri={this.state.uri}
                      themeData={this.state.themeData}
                      themeAlgorithm={this.state.themeAlgorithm}
                      selectedMenuKey={this.state.selectedMenuKey}
                      requiredEnableMfa={this.state.requiredEnableMfa}
                      menuVisible={this.state.menuVisible}
                      logo={this.state.logo}
                      onChangeTheme={this.setTheme}
                      onClick={this.onClick}
                      onfinish={() => {
                        this.setState({requiredEnableMfa: false});
                      }}
                      openAiAssistant={() => {
                        this.setState({isAiAssistantOpen: true});
                      }}
                      setLogoAndThemeAlgorithm={(nextThemeAlgorithm) => {
                        this.setState({
                          themeAlgorithm: nextThemeAlgorithm,
                          logo: this.getLogo(nextThemeAlgorithm),
                        });
                        localStorage.setItem("themeAlgorithm", JSON.stringify(nextThemeAlgorithm));
                      }}
                      setLogoutState={() => {
                        this.setState({account: null});
                      }}
                      history={rp.history}
                      location={rp.location}
                    />
                  </Guards.AdminGuard>
                } />

                {/* SaaS disabled routes */}
                {RoutePolicy.SAAS_ROUTES.map(route => (
                  <Route key={route} path={route} render={() =>
                    <DisabledFeaturePage account={this.state.account} history={this.props.history} />
                  } />
                ))}

                {/* Legacy admin route redirects */}
                {Object.entries(RoutePolicy.LEGACY_ADMIN_ROUTE_MAP).map(([oldPath, newPath]) => (
                  <Route key={oldPath} exact path={oldPath} render={() => {
                    if (!this.state.account) {
                      const redirectUrl = encodeURIComponent(oldPath);
                      return <Redirect to={`/login?returnUrl=${redirectUrl}`} />;
                    }
                    if (!RoutePolicy.isGlobalAdmin(this.state.account)) {
                      return <Redirect to={Conf.PortalBasePath} />;
                    }
                    return <Redirect to={newPath} />;
                  }} />
                ))}

                {/* Fallback to original ManagementPage for non-prefixed paths */}
                <Route path="" render={() =>
                  <ManagementPage
                    account={this.state.account}
                    application={this.state.application}
                    uri={this.state.uri}
                    themeData={this.state.themeData}
                    themeAlgorithm={this.state.themeAlgorithm}
                    selectedMenuKey={this.state.selectedMenuKey}
                    requiredEnableMfa={this.state.requiredEnableMfa}
                    menuVisible={this.state.menuVisible}
                    logo={this.state.logo}
                    onChangeTheme={this.setTheme}
                    onClick={this.onClick}
                    onfinish={() => {
                      this.setState({requiredEnableMfa: false});
                    }}
                    openAiAssistant={() => {
                      this.setState({isAiAssistantOpen: true});
                    }}
                    setLogoAndThemeAlgorithm={(nextThemeAlgorithm) => {
                      this.setState({
                        themeAlgorithm: nextThemeAlgorithm,
                        logo: this.getLogo(nextThemeAlgorithm),
                      });
                      localStorage.setItem("themeAlgorithm", JSON.stringify(nextThemeAlgorithm));
                    }}
                    setLogoutState={() => {
                      this.setState({account: null});
                    }}
                  />
                } />
              </Switch>
            </Layout>
          </Suspense>
        }
      </React.Fragment>
    );
  }

  renderBanner() {
    if (!Conf.IsDemoMode) {
      return null;
    }

    const language = Setting.getLanguage();
    if (language === "en" || language === "zh") {
      return null;
    }

    return (
      <Alert type="info" banner showIcon={false} closable message={
        <div style={{textAlign: "center"}}>
          <InfoCircleFilled style={{color: "rgb(87,52,211)"}} />
          &nbsp;&nbsp;
          {i18next.t("general:Found some texts still not translated? Please help us translate at")}
          &nbsp;
          <a target="_blank" rel="noreferrer" href={"https://crowdin.com/project/casdoor-site"}>
            Crowdin
          </a>
          &nbsp;!&nbsp;🙏
        </div>
      } />
    );
  }

  render() {
    return (
      <React.Fragment>
        {(this.state.account === undefined || this.state.account === null) ?
          <Helmet>
            <title>{Conf.ProductName}</title>
            <link rel="icon" href={"https://cdn.casdoor.com/static/favicon.png"} />
          </Helmet> :
          <Helmet>
            <title>{Conf.ProductName}</title>
            <link rel="icon" href={this.state.account.organization?.favicon} />
          </Helmet>
        }
        <ConfigProvider
          locale={getAntdLocale(Setting.getLanguage())}
          spin={{indicator: <AiDots />}}
          theme={{
            token: {
              ...(Setting.isDarkTheme(this.state.themeAlgorithm) ? shadcnDarkThemeToken : shadcnThemeToken),
              colorPrimary: this.state.themeData.colorPrimary,
              colorInfo: this.state.themeData.colorPrimary,
              borderRadius: this.state.themeData.borderRadius,
            },
            components: Setting.isDarkTheme(this.state.themeAlgorithm) ? shadcnDarkThemeComponents : shadcnThemeComponents,
            algorithm: Setting.getAlgorithm(this.state.themeAlgorithm),
          }}>
          <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
            {
              this.renderPage()
            }
          </StyleProvider>
        </ConfigProvider>
      </React.Fragment>
    );
  }
}

export default withRouter(withTranslation()(App));
