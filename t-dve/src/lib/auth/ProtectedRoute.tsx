import React, { useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { hasPermission, Permission } from '../../utils/permissions';
import constants from '../constants';
import { UserContext } from '../../provider/UserProvider';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  requiredAccess?: Permission | Permission[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, requiredAccess, ...rest }) => {
  const { user } = useContext(UserContext)

  const hasAccess =
    !requiredAccess || (Array.isArray(requiredAccess) && requiredAccess.length === 0)
      ? true : hasPermission(user, requiredAccess);

  if (!hasAccess) return <Redirect to={constants.UNAUTHORIZED_PAGE} />;

  return (
    <Route
      {...rest}
      render={(props) =>
        user?.page === "" ? <Redirect to={"/login"} /> : <Component {...props} />
      }
    />
  );
};

export default ProtectedRoute;
