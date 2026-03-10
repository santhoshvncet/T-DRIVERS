import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const useBackButtonHandler = (pathname: string) => {
    const history = useHistory();    

    useEffect(() => {
        const handleBackButton = (event: any) => {
            if (history?.location?.pathname === pathname) {
                event.detail.register(0, async () => {
                    try {
                        await App.exitApp();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        // Handle errors or use default behavior
                        history.goBack();
                    }
                });
            }
        };

        document.addEventListener('ionBackButton', handleBackButton);

        return () => {
            document.removeEventListener('ionBackButton', handleBackButton);
        };
    }, [history]);
};

export default useBackButtonHandler;
