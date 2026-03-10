const getUserLanguage = async () => {
    const userSettingsRaw = localStorage.getItem('userData');
    if (!userSettingsRaw) return 'en';

    try {
        const userSettings = JSON.parse(userSettingsRaw);
        return userSettings.language || 'en';
    } catch (e) {
        console.error('Error parsing user settings:', e);
        return 'en';
    }
};
export default getUserLanguage;
