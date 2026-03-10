// AppFooter.tsx
import React, { useMemo } from 'react';
import { IonFooter, IonIcon } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { matchPath } from 'react-router';
import useNavigationHistory from '../../hooks/useNavigationHistory';

type RawTabItem = {
  key: string;
  href: string;
  label: string;
  icon: any;
  activeIcon?: any;
};

export type AppFooterProps = {
  rawTabs: RawTabItem[];
  currentPath: string; // not strictly needed anymore, we use useLocation()
};

function getWavePath(activeIndex: number, tabCount: number) {
  const tabWidth = 100 / tabCount;
  const startX = tabWidth * activeIndex;
  const centerX = startX + tabWidth / 2;
  const cpOffsetY = 40;
  const cpOffsetX = tabWidth * 0.15;

  return `
    M0,0 
    H${startX} 
    C${startX + cpOffsetX},0 ${centerX - cpOffsetX},${cpOffsetY} ${centerX},${cpOffsetY} 
    C${centerX + cpOffsetX},${cpOffsetY} ${startX + tabWidth - cpOffsetX},0 ${startX + tabWidth},0 
    H100 
    V80 
    H0 
    Z
  `;
}

const AppFooter: React.FC<AppFooterProps> = ({ rawTabs }) => {
  const { pushLatest } = useNavigationHistory();
  const location = useLocation();

  const tabItems = useMemo(
    () => rawTabs.map(({ key, href, label, icon, activeIcon }) => ({ key, href, label, icon, activeIcon })),
    [rawTabs]
  );

  // Use prefix matching so nested routes stay inside the tab
  const activeIndex = useMemo(() => {
    const idx = tabItems.findIndex((tab) =>
      matchPath(location.pathname, { path: tab.href, exact: false, strict: false })
    );
    return Math.max(0, idx);
  }, [location.pathname, tabItems]);

  const waveD = useMemo(() => getWavePath(activeIndex, tabItems.length), [activeIndex, tabItems.length]);

  return (
    <IonFooter
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        borderTop: 'none',
        zIndex: 1000, // above transition layers
      }}
    >
      <div style={{ position: 'relative', height: 65 }}>
        {/* Wave SVG */}
        <svg
          width="100%"
          height="70"
          viewBox="0 0 100 80"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: '30px 30px 0 0'
          }}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(0,0,0,0.15)" />
            </filter>
          </defs>
          <path d={waveD.trim()} fill="#141A46" filter="url(#shadow)" />
        </svg>

        {/* Tab Icons */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            zIndex: 3
          }}
        >
          {tabItems.map((tab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={tab.key ?? idx}
                onClick={() => pushLatest(tab.href)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer',
                  zIndex: 4
                }}
              >
                <div className="flex flex-col items-center -mt-2">
                  <div
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#fff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? '0px 4px 12px rgba(0,0,0,0.25)' : 'none',
                      transform: isActive ? 'translateY(-18px)' : 'translateY(0)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <IonIcon
                      icon={isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                      style={{
                        fontSize: 30,
                        color: isActive ? '#FFB703' : '#ffffff',
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: 14,
                      color: isActive ? '#FFB703' : '#ffffff',
                      marginTop: 8,
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </IonFooter>
  );
};

export default AppFooter;
