import React, { useContext, useEffect } from 'react';
import { IonRouterOutlet, useIonViewDidLeave } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { IonReactRouter } from '@ionic/react-router';
import ProtectedRoute from './lib/auth/ProtectedRoute';
import constants from './lib/constants';
import { UserContext } from './provider/UserProvider';
import { wifi } from 'ionicons/icons';
import { useToast } from './hooks/useToast';
import { Loading } from './common/Loading';
import HomeTab from './provider/HomeTab';
import { NavigationTracker } from './hooks/useNavigationHistory';
import type { IUserContext } from './provider/types/userProvider';
import LoginRoutes from './modules/common/tabs/Login/LoginRoutes';
import UserProfileForm from './modules/users/pages/UserProfileForm';
import CarDetailsForm from './modules/users/pages/CarDetailsForm';
import Login from './pages/Login/login';
import LookingForPage from './pages/Login/LookingForPage';
import DriverProfileForm from './modules/drivers/pages/ProfileForm';
import driverRegistrationForm from './modules/drivers/pages/driverRegistration';
import BankDetailsForm from './modules/drivers/pages/DriverBankDetails';

const {
  HOME_PAGE,
  OFFLINE_EVENT_LISTENER,
  OFFLINE_ERROR_MESSAGE,
  LOGIN_PAGE,
  NETWORK_ERROR_PAGE,
  USER_LANDING_PAGE,
  DRIVER_PROFILE_FORM_PAGE,
  DRIVER_DETAIL_FORM_PAGE,
  DRIVER_BANK_FORM_PAGE,
  OWNER_CAR_DETAIL_FORM_PAGE,
  LOOKING_FOR_PAGE,
  OWNER_PROFILE_FORM_PAGE,
} = constants;

const {
  LOGIN,
  HOME,
  DRIVER_PROFILE_FORM,
  DRIVER_DETAIL_FORM,
  DRIVER_BANK_FORM,
  OWNER_CAR_DETAILS_FORM,
  OWNER_PROFILE_FORM,
  LOOKING_FOR_FORM,
} = USER_LANDING_PAGE;

const Routes: React.FC = () => {
  const { authLoading, page } = useContext<IUserContext>(UserContext);
  const { bottomErrorToast, dismiss } = useToast();

  const homepage = {
    [HOME]: {
      component: HomeTab,
      path: HOME_PAGE,
      exact: true,
      requiredAccess: []
    },
    [DRIVER_PROFILE_FORM]: {
      component: DriverProfileForm,
      path: DRIVER_PROFILE_FORM_PAGE,
      exact: true,
      requiredAccess: []
    },
    [DRIVER_DETAIL_FORM]: {
      component: driverRegistrationForm,
      path: DRIVER_DETAIL_FORM_PAGE,
      exact: true,
      requiredAccess: []
    },
    [DRIVER_BANK_FORM]: {
      component: BankDetailsForm,
      path: DRIVER_BANK_FORM_PAGE,
      exact: true,
      requiredAccess: []
    },
    [OWNER_PROFILE_FORM]: {
      component: UserProfileForm,
      path: OWNER_PROFILE_FORM_PAGE,
      exact: true,
      requiredAccess: []
    },
    [LOGIN]: {
      component: Login,
      path: LOGIN_PAGE,
      exact: true,
      requiredAccess: []
    },
    [OWNER_CAR_DETAILS_FORM]: {
      component: CarDetailsForm,
      path: OWNER_CAR_DETAIL_FORM_PAGE,
      exact: true,
      requiredAccess: []
    },
    [LOOKING_FOR_FORM]: {
      component: LookingForPage,
      path: LOOKING_FOR_PAGE,
      exact: true,
      requiredAccess: []
    },
  };

  const handleNetworkChange = () => {
    if (navigator.onLine) dismiss();
    else bottomErrorToast({ message: OFFLINE_ERROR_MESSAGE, icon: wifi });
  };
  
  useEffect(() => {
    window.addEventListener(OFFLINE_EVENT_LISTENER, handleNetworkChange);
    window.addEventListener('online', handleNetworkChange);
    return () => {
      window.removeEventListener(OFFLINE_EVENT_LISTENER, handleNetworkChange);
      window.removeEventListener('online', handleNetworkChange);
    };
  }, []);

  useIonViewDidLeave(() => {
    window.removeEventListener(OFFLINE_EVENT_LISTENER, handleNetworkChange);
    window.removeEventListener('online', handleNetworkChange);
  });

  if (authLoading) return <Loading />;

  const safePage = page && homepage[page as keyof typeof homepage] ? page : HOME;
  const homepageEntry = homepage[safePage as keyof typeof homepage];
  const componentPath = homepageEntry?.path;
  const Component = homepageEntry?.component;
  // const requiredAccess = homepageEntry?.requiredAccess ?? [];
  
  const token = localStorage.getItem("token");
  const isUnAuthenticated = !token;
  
    const PageRoutes = () => {
        const isNetworkIssue = !navigator.onLine && !page;
        const protectedPath = page !== HOME ? componentPath : undefined;
        return (
            <IonRouterOutlet animated={true}>
                <NavigationTracker />

                {
                    isNetworkIssue ? <Redirect to={NETWORK_ERROR_PAGE} exact /> :
                        <ProtectedRoute component={Component} path={protectedPath} exact={page !== HOME} />
                }
                <Redirect from='/' to={componentPath} exact />
                <Redirect from={'/login'} to={componentPath} exact />
                <Redirect from={'/otp'} to={componentPath} exact />
            </IonRouterOutlet>
        )
    }

    return (
        <IonReactRouter>
            {isUnAuthenticated ? <LoginRoutes /> : <PageRoutes />}
        </IonReactRouter>
    )
};
export default Routes;