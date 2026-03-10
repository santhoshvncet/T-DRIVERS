import { registerPlugin } from '@capacitor/core';



export interface ReferrerDetailsInterface {
    referrerUrl: string;
    referrerClickTime: number;
    appInstallTime: number;
    instantExperienceLaunched: boolean;
}
interface InstallReferrerPlugin {

    getReferrerDetails(): Promise<ReferrerDetailsInterface>
}


/**
 * @author Dhurgeshwaran.K
 * Description : Plugin to get UTM data.This is a custom plugin , plugin files are located inside android folder.Custom plugin is registered in the MainActivity file.
 * @reference : [https://capacitorjs.com/docs/android/custom-code] , [https://github.com/dmitry-udod/capacitor-plugin-install-referrer]
 */

const InstallReferrer = registerPlugin<InstallReferrerPlugin>('InstallReferrer', {});

export { InstallReferrer };

