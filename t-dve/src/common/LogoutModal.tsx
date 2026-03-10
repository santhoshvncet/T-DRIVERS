import { IonAlert } from "@ionic/react";
import { useTranslation } from "react-i18next";
import common from "../utils/common";

interface ILogoutModal {
    visible: boolean;
    onHide: any;
    title?: string;
    okText?:string;
    cancelText?:string
}

function LogoutModal(props: ILogoutModal) {

    const { visible, onHide } = props
    
    
    const { t } = useTranslation()
    const onClickLogout = async () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('phone')
        await common.logoutOneSignal()
        window.location.reload()
    }

    return (     
       <IonAlert
            isOpen={visible}
            onDidDismiss={onHide}
            header={t('logOutTitle')}
            buttons={[
                {
                    text: t('no'),
                    role: 'cancel',
                    handler: onHide,
                },
                {
                    text: t('yesLogout'),
                    role: 'confirm',
                    handler: () => {
                onClickLogout()            },
                },
            ]}
        />
    );
}

export default LogoutModal;