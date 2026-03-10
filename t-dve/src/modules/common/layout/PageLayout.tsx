import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLabel,
  IonProgressBar,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonViewDidEnter,
} from "@ionic/react";
import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { chevronBack, notificationsOutline, search, refresh } from "ionicons/icons";
import util from "../../../utils";
// import '../../../theme/pageLayout.css'
import Refresh from "../../../common/refresh";

interface IPageLayout {
  children: ReactNode;
  title?: string | ReactNode;
  subTitle?: string | ReactNode;
  headerButtons?: ReactNode;
  showBackButton?: boolean;
  ionPadding?: boolean;
  reactNode?: ReactNode;
  progressBar?: {
    visible: boolean;
    value?: number;
    color?:
      | "primary"
      | "secondary"
      | "tertiary"
      | "success"
      | "warning"
      | "danger"
      | "light"
      | "medium"
      | "dark";
  };
  className?: string;
  footer?: ReactNode;
  toolBarColor?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "warning"
    | "danger"
    | "light"
    | "medium"
    | "dark";
  subTitleClassName?: string;
  customBackButton?: ReactNode;
  refetch?: () => void | Promise<void>;
  screenName: string;
  showFilter?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  backButtonClick?: () => void;
  leftContent?: React.ReactNode;
  showStatusToggle?: boolean;
  isActive?: boolean; // value from API
  onStatusToggle?: (value: boolean) => void; // API update caller
  disableStatusToggle?: boolean;
  reload?: boolean;
}

const PageLayout = (props: IPageLayout) => {
  const {
    children,
    showBackButton,
    headerButtons,
    title,
    subTitle,
    ionPadding,
    reactNode,
    className = "",
    progressBar,
    footer,
    toolBarColor,
    subTitleClassName,
    customBackButton,
    refetch,
    screenName,
    showSearch,
    showNotification,
    onNotificationClick,
    onSearchClick,
    backButtonClick,
    showStatusToggle,
    isActive,
    onStatusToggle,
    reload,
    disableStatusToggle,
  } = props;

  const { value: progressBarValue, visible: progressBarVisibility, color: progressBarColor } =
    progressBar || {};

  const showHeader = reactNode || showBackButton || customBackButton || title || headerButtons;

  const { goBack } = useNavigationHistory();

    // ✅ stable controlled toggle state
  const [activeState, setActiveState] = useState<boolean>(!!isActive);

  // ✅ store previous value to ignore mount-only changes
  const prevActiveRef = useRef<boolean>(!!isActive);

  useEffect(() => {
    setActiveState(!!isActive);
    prevActiveRef.current = !!isActive;
  }, [isActive]);

  const handleToggleChange = (checked: boolean) => {
    // ✅ Ignore if same state (mount sync / rerender)
    if (checked === prevActiveRef.current) return;

    // ✅ update refs/state
    prevActiveRef.current = checked;
    setActiveState(checked);

    // ✅ CALL API ALWAYS for user interaction
    onStatusToggle?.(checked);
  };


  // Ref to back button
  const backButtonRef = useRef<HTMLIonButtonElement>(null);

  const handleBack = () => {
    if (backButtonClick) backButtonClick();
    else goBack();
  };

  /* =========================================================
     Back button handling (Web + Android hardware)
  ========================================================= */
useEffect(() => {
  if (window.location.protocol === "capacitor:") return;

  const popstateListener = () => {
    if (backButtonRef.current) backButtonRef.current.click();
    else handleBack();
  };

  window.addEventListener("popstate", popstateListener);

  return () => {
    window.removeEventListener("popstate", popstateListener);
  };
}, [backButtonClick]);


  useIonViewDidEnter(() => {
    util.setPageTitle(screenName);
  });

  // ✅ Safe refresh: do NOT reload page
  const handleRefresh = async () => {
    if (refetch) await refetch();
    else window.location.reload();
  };

  const header = (
   <IonHeader
  mode="md"
  className={`${className} ion-no-border`}
>

      <IonToolbar color={toolBarColor}>
        {reactNode ? reactNode : null}

        <div className="flex items-center justify-between w-full">
          {(showBackButton || customBackButton) && (
            <IonButtons slot="start">
              {customBackButton ? (
                <div onClick={backButtonClick || handleBack}>{customBackButton}</div>
              ) : (
                <IonButton ref={backButtonRef} fill="clear" onClick={backButtonClick || handleBack}>
                  <IonIcon icon={chevronBack} className="text-yellow-400 w-6 h-6 mr-2.5" />
                </IonButton>
              )}
            </IonButtons>
          )}

          {title && (
            <IonTitle className="text-center text-lg">
              <div className={subTitle ? "-mb-2 text-balance" : "text-balance"}>{title}</div>
              {subTitle && (
                <IonLabel mode="md" className={subTitleClassName || "header-subtitle"}>
                  {subTitle}
                </IonLabel>
              )}
            </IonTitle>
          )}

          {showStatusToggle && (
            <div className="flex items-center mx-3 space-x-2">
              <IonLabel
                className={`text-sm font-semibold ${
                  activeState ? "text-green-600" : "text-yellow-500"
                }`}
              >
                {activeState ? "Active" : "InActive"}
              </IonLabel>

              <IonToggle
                checked={activeState}
                disabled={disableStatusToggle}
                color="success"
                onIonChange={(e) => handleToggleChange(e.detail.checked)}
              />
            </div>
          )}
          {reload && (
            <IonIcon
              icon={refresh}
              onClick={handleRefresh}
              className="h-6 w-6 text-gray-600 cursor-pointer mx-2"
            />
          )}
          <div className="flex items-center space-x-2 ml-auto mr-3">
            {showSearch && (
              <button data-tour="search-button" onClick={onSearchClick}>
                <IonIcon icon={search} className="size-6" />
              </button>
            )}

            {showNotification && (
              <div
                data-tour="notification-button"
                className="bg-yellow-400 w-8 h-8 rounded-2xl items-center justify-center flex"
                onClick={onNotificationClick}
              >
                <IonIcon icon={notificationsOutline} className="size-6" />
              </div>
            )}
          </div>
        </div>

        {headerButtons && <IonButtons slot="end">{headerButtons}</IonButtons>}

        {progressBarVisibility && (
          <IonProgressBar value={progressBarValue} color={progressBarColor} />
        )}
      </IonToolbar>
    </IonHeader>
  );

  return (
    <>
      {showHeader && header}

      <IonContent className={`${ionPadding ? "ion-padding" : ""} bg-[#F2F9FB]`}
      >
        {refetch && <Refresh />}
        {children}
      </IonContent>
 {footer && (
  <div>
        {footer}
        </div>
)}

    </>
  );
};

export default PageLayout;
