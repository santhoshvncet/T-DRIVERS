// src/hooks/useHasUserAccess.ts

import { useContext } from 'react';
import { Permission, hasPermission } from '../utils/permissions';
import { UserContext } from '../provider/UserProvider';

export const useHasUserAccess = (requiredPermission?: Permission | Permission[]) => {
  const { user } = useContext(UserContext);
  return hasPermission(user, requiredPermission);
};