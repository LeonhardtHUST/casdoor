import React from "react";
import ManagementPage from "../ManagementPage";
import * as Conf from "../Conf";

function AdminEntry(props) {
  return <ManagementPage {...props} basePath={Conf.AdminBasePath} />;
}

export default AdminEntry;
