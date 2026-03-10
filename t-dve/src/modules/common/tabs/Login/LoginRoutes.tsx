import { IonRouterOutlet } from '@ionic/react'
import { Redirect, Route } from 'react-router-dom'
import constants from '../../../../lib/constants'
import Otp from './Otp'
import Login from '../../../../pages/Login/login'

const LoginRoutes = () => {
    const { LOGIN_PAGE, OTP_PAGE      } = constants

    return (
        <IonRouterOutlet animated={true}>
            <Route exact path={LOGIN_PAGE} component={Login} />

            <Route exact path={OTP_PAGE} component={Otp} />
            <Redirect to={LOGIN_PAGE} />

        </IonRouterOutlet>
    )
}

export default LoginRoutes

