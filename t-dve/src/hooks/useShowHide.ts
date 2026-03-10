import React from 'react'


declare type MetaObject = {
    [key: string]: any
  }
  
export const useShowHide = (initial: MetaObject) => {
  const [visible, setVisible] = React.useState<MetaObject>(initial)
  const onShow = (value: string) => {
    setVisible(prev => ({ ...prev, [value]: true })) 
  }
  const onHide = () => {
    setVisible(initial)
  }
  const onToggle = (value: string) => {
    setVisible(prev => ({ ...prev, [value]: !prev[value] }))
  }
  const onCustomChange = (value: any) => {
    setVisible({ ...visible, ...value })
  }

  return { visible, onShow, onHide, onToggle, onCustomChange }
}
