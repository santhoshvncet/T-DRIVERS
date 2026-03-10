import React from 'react';
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { matchPath } from 'react-router-dom';
import useNavigationHistory from '../hooks/useNavigationHistory';

type RawTabItem = {
  key: string;
  href: string;
  label: string;
  icon: any;
  activeIcon?: any;
  visible?: boolean;
};

export type AppFooterProps = {
  rawTabs: RawTabItem[];
  currentPath: string;
};

const AppFooter: React.FC<AppFooterProps> = ({ rawTabs, currentPath }) => {
  const { pushLatest } = useNavigationHistory();

  return (
    <IonTabBar slot="bottom">
      {rawTabs
        .filter(tab => tab.visible !== false)
        .map(tab => {
          const isActive =
            !!matchPath(currentPath, {
              path: tab.href,
              exact: false,
              strict: false,
            }) ||
            (tab.key === 'home' && currentPath.startsWith('/approval'));

          return (
            <IonTabButton
              key={tab.key}
              tab={tab.key}
              href={tab.href}
              onClick={(e) => {
                e.preventDefault();
                pushLatest(tab.href);
              }}
            >
              <IonIcon icon={isActive ? tab.activeIcon ?? tab.icon : tab.icon} />
              <IonLabel>{tab.label}</IonLabel>
            </IonTabButton>
          );
        })}
    </IonTabBar>
  );
};

export default AppFooter;
