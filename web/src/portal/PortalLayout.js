import React, {useEffect, useState} from "react";
import {Link, Route, Switch, withRouter} from "react-router-dom";
import {Avatar, Button, Card, Dropdown, Layout, Menu} from "antd";
import {
  AppstoreOutlined,
  DesktopOutlined,
  EditOutlined,
  GlobalOutlined,
  LinkOutlined,
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import * as Setting from "../Setting";
import * as Conf from "../Conf";
import * as AuthBackend from "../auth/AuthBackend";
import AccountPage from "../account/AccountPage";
import MfaSetupPage from "../auth/MfaSetupPage";
import OdicDiscoveryPage from "../auth/OidcDiscoveryPage";
import LanguageSelect from "../common/select/LanguageSelect";
import ThemeSelect from "../common/select/ThemeSelect";
import * as RoutePolicy from "../routing/routePolicy";

const {Header, Content, Sider} = Layout;

function PortalHomePage({account, history}) {
  const items = [];

  items.push(
    <Card key="profile" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/profile")}>
      <Card.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title="个人资料"
        description="查看和编辑你的个人信息"
      />
    </Card>
  );

  items.push(
    <Card key="security" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/security")}>
      <Card.Meta
        avatar={<Avatar icon={<SafetyCertificateOutlined />} />}
        title="密码与安全"
        description="修改密码、管理 MFA 设置"
      />
    </Card>
  );

  items.push(
    <Card key="oidc" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/oidc")}>
      <Card.Meta
        avatar={<Avatar icon={<GlobalOutlined />} />}
        title="OIDC 开发者信息"
        description="查看 OAuth/OIDC 配置端点"
      />
    </Card>
  );

  items.push(
    <Card key="identities" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/identities")}>
      <Card.Meta
        avatar={<Avatar icon={<LinkOutlined />} />}
        title="外部身份"
        description="管理你的第三方登录绑定"
      />
    </Card>
  );

  items.push(
    <Card key="sessions" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/sessions")}>
      <Card.Meta
        avatar={<Avatar icon={<DesktopOutlined />} />}
        title="登录设备与会话"
        description="查看和管理活动会话"
      />
    </Card>
  );

  items.push(
    <Card key="applications" hoverable style={{marginBottom: 16}} onClick={() => history.push("/portal/applications")}>
      <Card.Meta
        avatar={<Avatar icon={<AppstoreOutlined />} />}
        title="关联应用"
        description="查看你已授权的应用"
      />
    </Card>
  );

  return (
    <div>
      <h2>欢迎回来，{account?.displayName || account?.name}</h2>
      <p>这是你的个人自助门户，你可以在这里管理自己的账户设置。</p>
      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16}}>
        {items}
      </div>
    </div>
  );
}

function ProfilePage({account, onChangeTheme, ...props}) {
  return <AccountPage account={account} onChangeTheme={onChangeTheme} {...props} />;
}

function SecurityPage({account, onfinish, history}) {
  return (
    <div>
      <h2>密码与安全</h2>
      <Card style={{marginBottom: 16}}>
        <h3>修改密码</h3>
        <p>定期修改密码可以保护账户安全。</p>
      </Card>
      <Card style={{marginBottom: 16}}>
        <h3>双因素认证 (MFA)</h3>
        <MfaSetupPage account={account} onfinish={onfinish} />
      </Card>
    </div>
  );
}

function MfaPage({account, onfinish}) {
  return (
    <div>
      <h2>双因素认证</h2>
      <MfaSetupPage account={account} onfinish={onfinish} />
    </div>
  );
}

function OidcPage({account}) {
  return (
    <div>
      <h2>OIDC 开发者信息</h2>
      <OdicDiscoveryPage />
    </div>
  );
}

function IdentitiesPage({account}) {
  return (
    <div>
      <h2>外部身份</h2>
      <Card>
        <p>在此页面你可以查看和管理已绑定的第三方登录身份。</p>
        <p>（功能开发中...）</p>
      </Card>
    </div>
  );
}

function SessionsPage({account}) {
  return (
    <div>
      <h2>登录设备与会话</h2>
      <Card>
        <p>在此页面你可以查看当前所有活动的登录会话，并可以远程注销。</p>
        <p>（功能开发中...）</p>
      </Card>
    </div>
  );
}

function ApplicationsPage({account}) {
  return (
    <div>
      <h2>关联应用</h2>
      <Card>
        <p>在此页面你可以查看所有已授权的应用及其权限。</p>
        <p>（功能开发中...）</p>
      </Card>
    </div>
  );
}

function PortalLayout({account, ...props}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("portalSiderCollapsed") === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("portalSiderCollapsed", String(next));
  };

  const handleLogout = () => {
    AuthBackend.logout().then((res) => {
      if (res.status === "ok") {
        Setting.showMessage("success", "已成功注销");
        props.setLogoutState();
        if (res.data2) {
          Setting.goToLink(res.data2);
        } else {
          Setting.goToLinkSoft({history: props.history}, "/login");
        }
      }
    });
  };

  const rightDropdownItems = [
    {
      key: "profile",
      icon: <EditOutlined />,
      label: "个人资料",
      onClick: () => props.history.push("/portal/profile"),
    },
    {type: "divider"},
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "注销",
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: "/portal",
      icon: <UserOutlined />,
      label: "首页",
    },
    {
      key: "/portal/profile",
      icon: <EditOutlined />,
      label: "个人资料",
    },
    {
      key: "/portal/security",
      icon: <SafetyCertificateOutlined />,
      label: "密码与安全",
      children: [
        {key: "/portal/security/password", icon: <LockOutlined />, label: "修改密码"},
        {key: "/portal/security/mfa", icon: <SettingOutlined />, label: "双因素认证"},
      ],
    },
    {
      key: "/portal/oidc",
      icon: <GlobalOutlined />,
      label: "OIDC 信息",
    },
    {
      key: "/portal/identities",
      icon: <LinkOutlined />,
      label: "外部身份",
    },
    {
      key: "/portal/sessions",
      icon: <DesktopOutlined />,
      label: "会话管理",
    },
    {
      key: "/portal/applications",
      icon: <AppstoreOutlined />,
      label: "关联应用",
    },
  ];

  if (RoutePolicy.isGlobalAdmin(account)) {
    menuItems.push({type: "divider"});
    menuItems.push({
      key: "/admin",
      icon: <SettingOutlined />,
      label: "进入管理控制台",
    });
  }

  return (
    <Layout style={{minHeight: "100vh"}}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        width={220}
        style={{
          background: Setting.isDarkTheme?.(props.themeAlgorithm) ? "#141414" : "#fff",
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          overflow: "hidden",
        }}>
          <Link to="/portal" style={{display: "flex", alignItems: "center"}}>
            <img
              src={account?.organization?.favicon || Setting.getLogo(props.themeAlgorithm)}
              alt="logo"
              style={{height: 28, maxWidth: 160, objectFit: "contain"}}
            />
            {!collapsed && <span style={{marginLeft: 8, fontWeight: 600, whiteSpace: "nowrap"}}>{Conf.ProductName}</span>}
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[props.location.pathname]}
          openKeys={menuItems.filter(i => i.children?.some(c => props.location.pathname.startsWith(c.key))).map(i => i.key)}
          onOpenChange={() => {}}
          onClick={({key}) => {
            if (key === "/admin") {
              props.history.push(Conf.AdminBasePath);
            } else {
              props.history.push(key);
            }
          }}
          items={menuItems}
          theme={Setting.isDarkTheme?.(props.themeAlgorithm) ? "dark" : "light"}
          style={{borderRight: 0}}
        />
      </Sider>
      <Layout>
        <Header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 16px",
          background: Setting.isDarkTheme?.(props.themeAlgorithm) ? "#000" : "#fff",
          borderBottom: "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 99,
          height: 52,
          lineHeight: "52px",
        }}>
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            <Button type="text" onClick={toggleCollapsed}>
              {collapsed ? "☰" : "⇤"}
            </Button>
            <span style={{fontSize: 16, fontWeight: 500}}>用户自助门户</span>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <ThemeSelect themeAlgorithm={props.themeAlgorithm} onChange={props.setLogoAndThemeAlgorithm} />
            <LanguageSelect languages={Conf.EnabledLanguages} />
            <Dropdown menu={{items: rightDropdownItems}} placement="bottomRight">
              <div style={{cursor: "pointer", display: "flex", alignItems: "center", gap: 8}}>
                <Avatar size="small" src={account?.avatar} icon={<UserOutlined />} />
                <span>{account?.displayName || account?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{margin: 16, padding: 24, background: Setting.isDarkTheme?.(props.themeAlgorithm) ? "#1f1f1f" : "#fff", borderRadius: 8, flex: 1}}>
          <Switch>
            <Route exact path="/portal" render={() => <PortalHomePage account={account} history={props.history} />} />
            <Route path="/portal/profile" render={(rp) => <ProfilePage account={account} onChangeTheme={props.onChangeTheme} {...rp} {...props} />} />
            <Route path="/portal/security/password" render={() => <SecurityPage account={account} onfinish={props.onfinish} history={props.history} />} />
            <Route path="/portal/security/mfa" render={() => <MfaPage account={account} onfinish={props.onfinish} />} />
            <Route path="/portal/security" render={() => <SecurityPage account={account} onfinish={props.onfinish} history={props.history} />} />
            <Route path="/portal/mfa" render={() => <MfaPage account={account} onfinish={props.onfinish} />} />
            <Route path="/portal/oidc" render={() => <OidcPage account={account} />} />
            <Route path="/portal/identities" render={() => <IdentitiesPage account={account} />} />
            <Route path="/portal/sessions" render={() => <SessionsPage account={account} />} />
            <Route path="/portal/applications" render={() => <ApplicationsPage account={account} />} />
          </Switch>
        </Content>
      </Layout>
    </Layout>
  );
}

export default withRouter(PortalLayout);
