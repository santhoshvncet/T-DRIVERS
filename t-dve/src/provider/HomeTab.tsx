/* eslint-disable @typescript-eslint/no-unused-vars */
 

import React, { useContext, useMemo } from 'react';
import {
  IonTabs,
  IonRouterOutlet,
} from '@ionic/react';
import { Route, useLocation } from 'react-router-dom';
import { matchPath, Redirect } from 'react-router';
import { useTranslation } from 'react-i18next';
import constants from '../lib/constants';
import Login from '../pages/Login/login';
import Unauthorized from '../pages/Unauthorized/Unauthorized'; // Import the component
import { UserContext } from './UserProvider';
import DriverHomePage from '../modules/drivers/pages/Home/DriverHomePage';
import DriverBooking from '../modules/drivers/tabs/profile/booking/DriverBooking';
import DriverPaymentWithdrawPage from '../modules/drivers/tabs/profile/driverPayment/AfterDriverPaymentPage/DriverPaymentWithDrawPage';
import Payment from '../modules/drivers/tabs/profile/driverPayment/DriverPaymentPage';
import Profile from '../modules/drivers/tabs/profile/Profile';
import DriverBookingViewPage from '../modules/drivers/tabs/profile/booking/view/DriverBookingView';
import AccountDetailsPage from '../modules/drivers/pages/AccountDetailsPage';
import BookingHistoryPage from '../modules/drivers/pages/BookingHistorypage';
import CarDetailsForm from '../modules/users/pages/CarDetailsForm';

import {
  barChart,
  barChartOutline,
  bus,
  busOutline,
  cog,
  cogOutline,
  home,
  homeOutline,
  man,
  manOutline,
  peopleCircle,
  peopleCircleOutline,
  pricetag,
  pricetagsOutline,
} from 'ionicons/icons';

import RentYourDriver from '../modules/users/tabs/booking/RentYourDriver';
import TripTestingPage from '../modules/users/tabs/Home/TripPage';
import InterestedDrivers from '../modules/users/pages/InterestedDrivers';

import OwnerProfilePage from '../modules/users/tabs/profile/Profile';
import ManageCarDetails from '../modules/users/pages/ManageCarDetails';
import BankDetailsForm from '../modules/drivers/pages/DriverBankDetails';
import OwnerPaymentHistory from '../modules/users/pages/OwnerPaymnetHistory';
import AdminHome from '../modules/admin/tabs/AdminHome';
import Report from '../modules/admin/tabs/Report';
import Roles from '../modules/admin/tabs/Roles';
import Configure from '../modules/admin/tabs/Configure';
import TripStatusPage from '../modules/users/tabs/booking/TripStatusPage';
import OwnerBookingHistory from '../modules/users/pages/OwnerBookingHistory';
import OwneraccountDetailsPage from '../modules/users/pages/OwnerAccountDetails';
import OwnerPaymentDetailsPage from '../modules/users/pages/PaymentDetailspage';
import DriverBookingAcceptPage from '../modules/drivers/tabs/profile/booking/accept/Driver_accept_page';
import PaymentSuccess from '../modules/drivers/tabs/profile/driverPayment/AfterDriverPaymentPage/Driver_payment_complete';
import AdminDetailsView from '../common/AdminDetailsView';
import Approval from '../modules/admin/tabs/Approval';
import TripCompletedPage from '../modules/drivers/pages/Home/DriverTripPaymentSummary';
import DriverProfilePage from '../modules/drivers/pages/DriverProfilePage';
import DriverSearch from '../modules/users/pages/SearchDrivers';
import ProtectedRoute from '../lib/auth/ProtectedRoute';
import { useHasUserAccess } from '../hooks/useHasUserAccess';
import ReportDetailsView from '../common/ReportDetailsView';
import DeleteAccount from '../common/DeleteAccount';
import Trips from '../modules/admin/tabs/Trips';
import AppFooter from '../common/AppFooter';


const {
  LOGIN_PAGE,
  ACCOUNT_DETAILS_PAGE,
  MANAGE_CAR_DETAILS,
  OWNER_PAYMENT_HISTORY_PAGE,
  OWNER_ACCOUNT_DETAILS_PAGE,
  DRIVER_BANK_FORM_PAGE,
  DRIVER_BOOKING_HISTORY_PAGE,
  BOOKING_HISTORY_PAGE,
  OWNER_CAR_DETAIL_FORM_PAGE,
  DRIVER_BOOKING_VIEW_PAGE,
  DRIVER_PAYMENT_WITHDRAW_PAGE,
  INTERESTED_DRIVER_PAGE,
  DRIVER_PAYMENT_WITHDRAW_COMPLETE_PAGE,
  DRIVER_BOOKING_ACCEPT_PAGE,
  CREATE_TRIP_PAGE,
  OWNER_PAYMENT_DETAILS_PAGE,
  ADMIN_INDIVIDUAL_DRIVER_PAGE,
  ADMIN_INDIVIDUAL_OWNER_PAGE,
  DRIVER_PAYMENT_DONE_PAGE,
  DRIVER_TRIP_PAYMENT_SUMMARY_PAGE,
  DRIVER_PROFILE_PAGE,
  UNAUTHORIZED_PAGE, 
  SEARCH_DRIVER_RANGE_BASED_PAGE,
  ADMIN_REPORT_DETAILS_VIEW,
  DELETE_ACCOUNT_PAGE,
  ADMIN_TRIPS_PAGE
} = constants;

const HomeTab: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useContext(UserContext);

  const is_driver = user?.role === constants.USER_ROLES.DRIVER;
  const is_admin = user?.role === constants.USER_ROLES.ADMIN;
  const is_superAdmin = user?.role === constants.USER_ROLES.SUPERADMIN;

  const canViewApproval = useHasUserAccess(['User Edit', 'User View', 'One Way Trip']);
  const canViewConfigure = useHasUserAccess(['Configure View', 'Configure Edit']);
  const canViewReport = useHasUserAccess('Report View');
  const canViewUsers = useHasUserAccess('User View');


  const driverTabs =  [
      {
        key: 'home',
        href: constants.HOME_PAGE,
        label: t('Home'),
        icon: homeOutline,
        activeIcon: home,
        component: DriverHomePage,
        requiredAccess: [],
        visible: is_driver,
      },
      {
        key: 'booking',
        href: constants.BOOKING_PAGE,
        label: t('Booking'),
        icon: busOutline,
        activeIcon: bus,
        component: DriverBooking,
        requiredAccess: [],
        visible: is_driver,
      },
      {
        key: 'payment',
        href: constants.DRIVER_PAYMENT_PAGE,
        label: t('Payment'),
        icon: pricetagsOutline,
        activeIcon: pricetag,
        component: Payment,
        requiredAccess: [],
        visible: is_driver,
      },
      {
        key: 'profile',
        href: constants.PROFILE_PAGE,
        label: t('Profile'),
        icon: manOutline,
        activeIcon: man,
        component: Profile,
        requiredAccess: [],
        visible: is_driver,
      },
    ]

  
  const adminTabs = [
      {
        key: 'home',
        href: constants.HOME_PAGE,
        label: t('Home'),
        icon: homeOutline,
        activeIcon: home,
        component: AdminHome,
        requiredAccess: [],
        visible: true,
      },
      {
        key: 'approval',
        href: constants.ADMIN_APPROVAL_PAGE,
        label: t('Approval'),
        icon: peopleCircleOutline,
        activeIcon: peopleCircle,
        component: Approval,
        requiredAccess: ['User Edit', 'User View', 'One Way Trip'],
        visible: canViewApproval, 
      },
      {
        key: 'configure',
        href: constants.ADMIN_CONFIGURE_PAGE,
        label: t('Configure'),
        icon: cogOutline,
        activeIcon: cog,
        component: Configure,
        requiredAccess: ['Configure View', 'Configure Edit'],
        visible: canViewConfigure,
      },
      {
        key: 'report',
        href: constants.ADMIN_REPORT_PAGE,
        label: t('Report'),
        icon: barChartOutline,
        activeIcon: barChart,
        component: Report,
        requiredAccess: ['Report View'],
        visible: canViewReport,
      },
      {
        key: 'roles',
        href: constants.ADMIN_ROLES_PAGE,
        label: t('Roles'),
        icon: peopleCircleOutline,
        activeIcon: peopleCircle,
        component: Roles,
        requiredAccess: [],
        visible: true,
      },
    ]

  const carOwnerTabs = [
      {
        key: 'home',
        href: constants.HOME_PAGE,
        label: t('Home'),
        icon: homeOutline,
        activeIcon: home,
        component: TripTestingPage,
        requiredAccess: [],
        visible: !is_driver && !is_admin && !is_superAdmin,
      },
      {
        key: 'booking',
        href: constants.BOOKING_PAGE,
        label: t('Booking'),
        icon: busOutline,
        activeIcon: bus,
        component: TripStatusPage,
        requiredAccess: [],
        visible:  !is_admin && !is_superAdmin,
      },
      {
        key: 'profile',
        href: constants.OWNER_PROFILE_PAGE,
        label: t('Profile'),
        icon: manOutline,
        activeIcon: man,
        component: OwnerProfilePage,
        requiredAccess: [],
        visible: !is_driver && !is_admin && !is_superAdmin,
      },
    ]



  const additionalRoutes = [
    { href: LOGIN_PAGE, component: Login, requiredAccess: [], visible: true },
    { href: ACCOUNT_DETAILS_PAGE, component: AccountDetailsPage, requiredAccess: [], visible: is_driver },
    { href: BOOKING_HISTORY_PAGE, component: OwnerBookingHistory, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: MANAGE_CAR_DETAILS, component: ManageCarDetails, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: OWNER_PAYMENT_HISTORY_PAGE, component: OwnerPaymentHistory, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: OWNER_ACCOUNT_DETAILS_PAGE, component: OwneraccountDetailsPage, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: DRIVER_BOOKING_VIEW_PAGE, component: DriverBookingViewPage, requiredAccess: [], visible: is_driver },
    { href: OWNER_CAR_DETAIL_FORM_PAGE, component: CarDetailsForm, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: DRIVER_PAYMENT_WITHDRAW_PAGE, component: DriverPaymentWithdrawPage, requiredAccess: [], visible: is_driver },
    { href: DRIVER_BOOKING_HISTORY_PAGE, component: BookingHistoryPage, requiredAccess: [], visible: is_driver },
    { href: DRIVER_BANK_FORM_PAGE, component: BankDetailsForm, requiredAccess: [], visible: is_driver },
    { href: INTERESTED_DRIVER_PAGE, component: InterestedDrivers, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: CREATE_TRIP_PAGE, component: RentYourDriver, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: OWNER_PAYMENT_DETAILS_PAGE, component: OwnerPaymentDetailsPage, requiredAccess: [], visible: !is_driver && !is_admin && !is_superAdmin },
    { href: DRIVER_BOOKING_ACCEPT_PAGE, component: DriverBookingAcceptPage, requiredAccess: [], visible: is_driver },
    { href: ADMIN_INDIVIDUAL_DRIVER_PAGE, component: AdminDetailsView, requiredAccess: ['User View'], visible: canViewUsers },
    { href: ADMIN_INDIVIDUAL_OWNER_PAGE, component: AdminDetailsView, requiredAccess: ['User View'], visible: canViewUsers },
    { href: DRIVER_TRIP_PAYMENT_SUMMARY_PAGE, component: TripCompletedPage, requiredAccess: [], visible: is_driver },
    { href: DRIVER_PAYMENT_DONE_PAGE, component: PaymentSuccess, requiredAccess: [], visible: true },
    { href: ADMIN_TRIPS_PAGE, component: Trips, requiredAccess: ['Trips'], visible: is_admin || is_superAdmin },

    { href: UNAUTHORIZED_PAGE, component: Unauthorized, requiredAccess: [], visible: true },
    { href:DRIVER_PROFILE_PAGE ,component:DriverProfilePage, requiredAccess: [], visible: true  },
    { href:SEARCH_DRIVER_RANGE_BASED_PAGE ,component:DriverSearch, requiredAccess: [], visible: true },
    { href:ADMIN_REPORT_DETAILS_VIEW ,component: ReportDetailsView, requiredAccess: [], visible: true },
    { href: DELETE_ACCOUNT_PAGE, component: DeleteAccount, requiredAccess: [], visible:   !is_admin && !is_superAdmin },
  ]

  const currentPath = location?.pathname;

  const currentTabs = is_driver ? driverTabs : (is_admin || is_superAdmin) ? adminTabs : carOwnerTabs;


  const allTabPaths = currentTabs.map(currentTabs => currentTabs?.href);

  const shouldShowFooter = allTabPaths.some(path =>
    matchPath(currentPath, { path, exact: false, strict: false })
  );

  const shouldShowTabBar = useMemo(() => {
  const matchesMainTab = allTabPaths.some(path =>
    matchPath(currentPath, { path, exact: false, strict: false })
  );

  const adminTripsPage = matchPath(currentPath, { path: ADMIN_TRIPS_PAGE, exact: false, strict: false });

  return matchesMainTab || adminTripsPage;
}, [currentPath, allTabPaths]);

  return (
      <IonTabs>
      <IonRouterOutlet>
        {currentTabs.map((tab) => (
          <Route key={tab.key} exact path={tab.href} component={tab.component} />
        ))}
        {additionalRoutes.map((r, idx) => (
          <Route key={`r-${idx}`} path={r.href} component={r.component} />
        ))}
      </IonRouterOutlet>
        <AppFooter rawTabs={currentTabs} currentPath={currentPath} />
    </IonTabs>
  );
};

export default HomeTab;