// src/hooks/useEditMode.ts
import { useState, useContext } from 'react'
import { UserContext } from '../provider/UserProvider'
import { hasPermission, Permission } from '../utils/permissions'

export const useEditMode = (required: Permission | Permission[]) => {
  const { user } = useContext(UserContext)
  const [isEdit, setIsEdit] = useState(false)

  // if the user cannot edit at all, force view mode
  const canEdit = hasPermission(user, required)
  const toggleEdit = () => setIsEdit(v => !v)

  return {
    isEdit: canEdit && isEdit,   
    toggleEdit,
    canEdit,                    
  }
}