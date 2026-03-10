import { SafeArea } from 'capacitor-plugin-safe-area';

type Insets = { top: number; right: number; bottom: number; left: number };

function setVars(insets: Insets) {
  const s = document.documentElement.style;
s.setProperty('--safe-area-top', `${insets.top}px`);
  s.setProperty('--safe-area-right', `${insets.right}px`);
  s.setProperty('--safe-area-bottom', `${insets.bottom}px`);
  s.setProperty('--safe-area-left', `${insets.left}px`);

  s.setProperty('--ion-safe-area-top', `${insets.top}px`);
  s.setProperty('--ion-safe-area-bottom', `${insets.bottom}px`);
}

export async function initSafeArea() {
  try {
    const { insets } = await SafeArea.getSafeAreaInsets();
    console.log('safe areas are',JSON.stringify(insets));
    
    setVars(insets);
  } catch {
    //
  }
  const update = () =>
    SafeArea.getSafeAreaInsets()
      .then(({ insets }) => setVars(insets))
      .catch(() => {});
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
}