/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext, useMemo, useState, useEffect } from "react";
import { UserContext } from "../../../provider/UserProvider";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, Redirect } from "react-router-dom";
import constants from "../../../lib/constants";
import { hasPermission } from "../../../utils/permissions";
import AdminHomeDriver from "./AdminHomeDriver";
import AdminHomeOwner from "./AdminHomeOwner";
import OneWayTrip from "./OneWayTrip";
import PageLayout from "../../common/layout/PageLayout";

export type TabKey = "driver" | "owner" | "oneWayTrip";

interface ApprovalLocationState {
  tab?: TabKey;
}

type TabConfig = {
  key: TabKey;
  label: string;
  component: React.ComponentType<any>;
};

const Approval = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation<ApprovalLocationState>();

  // Permissions
  const canViewUsers = hasPermission(user, "User View");
  const canEditUsers = hasPermission(user, "User Edit");
  const canViewOneWay = hasPermission(user, "One Way Trip");

  // Route-level access: must have User View OR One Way Trip
  const hasAnyApprovalAccess = canViewUsers || canViewOneWay;
  if (!hasAnyApprovalAccess) {
    return <Redirect to={constants.UNAUTHORIZED_PAGE} />;
  }

  // Edit is allowed only if user has both View and Edit
  const canEdit = canViewUsers && canEditUsers;

  // Build tabs based on permissions:
  // - Driver & Owner need User View
  // - OneWayTrip needs One Way Trip
  const tabs: TabConfig[] = useMemo(() => {
    const result: TabConfig[] = [];

    // Case 1: User has User View permission
    if (canViewUsers) {
      result.push(
        { key: "driver", label: t("Driver"), component: AdminHomeDriver },
        { key: "owner", label: t("Owner"), component: AdminHomeOwner },
      );
    }

    // Case 2: User has One Way Trip permission
    if (canViewOneWay) {
      result.push({
        key: "oneWayTrip",
        label: t("One Way Trip"),
        component: OneWayTrip,
      });
    }

    return result;
  }, [t, canViewUsers, canViewOneWay]);

  if (tabs.length === 0) {
    // Should not normally happen because hasAnyApprovalAccess was true,
    // but this is a safety net.
    return <Redirect to={constants.UNAUTHORIZED_PAGE} />;
  }

  // Initial tab from URL (?tab=...), fallback to "driver"
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const params = new URLSearchParams(location.search);
    const tabFromQuery = params.get("tab") as TabKey | null;
    const tabFromState = location.state?.tab as TabKey | undefined;

    return tabFromQuery || tabFromState || "driver";
  });

  // Ensure activeTab and ?tab=... are valid whenever permissions/tabs change
  useEffect(() => {
    if (tabs.length === 0) return;

    const params = new URLSearchParams(location.search);
    const queryTab = params.get("tab") as TabKey | null;

    const currentValid = tabs.some((t) => t.key === activeTab);
    let nextTab: TabKey = activeTab;

    if (!currentValid) {
      nextTab = tabs[0].key; // first available tab
      setActiveTab(nextTab);
    }

    if (queryTab !== nextTab) {
      params.set("tab", nextTab);
      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    }
  }, [tabs, activeTab, location.pathname, location.search, history]);

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);

    const params = new URLSearchParams(location.search);
    params.set("tab", key);
    history.replace({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const ActiveComponent = tabs.find((tab) => tab.key === activeTab)?.component;

  return (
    <PageLayout
      screenName="Approval"
      title={user?.name}
      showNotification
      showBackButton
      backButtonClick={() => history.push("/home")}
    >
      {/* Tab Bar */}
      <div className="flex justify-center align-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className="text-center cursor-pointer py-2 px-4"
            >
              <span
                className={`inline-block ${
                  isActive
                    ? "text-black font-semibold border-b-2 border-black"
                    : "text-gray-400 font-semibold"
                }`}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active tab content */}
      <div className="mt-4">
        {ActiveComponent && <ActiveComponent canEdit={canEdit} />}
      </div>
    </PageLayout>
  );
};

export default Approval;
