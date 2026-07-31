import React from "react";
import {Button, Result} from "antd";
import {withRouter} from "react-router-dom";
import * as Conf from "../Conf";

function DisabledFeaturePage({account, history}) {
  const handleBack = () => {
    if (account && account.owner === "built-in") {
      history.push(Conf.AdminBasePath);
    } else {
      history.push(Conf.PortalBasePath);
    }
  };

  return (
    <Result
      status="info"
      title="此功能已禁用"
      subTitle="SaaS Management 功能在本部署中已被禁用。"
      extra={[
        <Button type="primary" key="back" onClick={handleBack}>
          返回
        </Button>,
      ]}
    />
  );
}

export default withRouter(DisabledFeaturePage);
