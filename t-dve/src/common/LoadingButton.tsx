import { IonButton, IonIcon, IonSpinner } from "@ionic/react";

interface Props {
  loading?: boolean
  handleButtonClick?: any
  label?: string
  fill?: 'clear'|'default'|'outline'|'solid'
  color?: string
  size?: 'small' | 'default' | 'large'
  disable?: boolean
  className?:string
  id?:string
  type?:"submit" | "reset" | "button" 
  buttonType?: 'button' | 'reset' | 'submit'
  loadingText?: string
  textColour?: string
  icon?: string
  mode?: "ios" | "md"
  expand?: 'block'|'full'
  form?: string
  slots?: 'start'|'end'
  textstyles?: string
  iconClassName?:string
}

export const LoadingButton = (props: Props) => {
  const {
    loading,
    id,
    handleButtonClick,
    label,
    color,
    disable,
    className,
    size,
    type,
    buttonType,
    loadingText,
    icon,
    fill,
    mode,
    expand,
    form,
    slots,
    iconClassName
  } = props
  const defaultColor = disable ? "medium" :  color || "primary"
  return (
    <div className="flex items-center">
      <IonButton
        id={id}
        mode={mode}
        expand={expand}
        slot={slots}
        fill={fill == 'default'? undefined : fill}
        color={defaultColor}
        className={`${className || ''} rounded-3xl normal-case`}
        onClick={handleButtonClick}
        disabled={disable}
        size={size}
        form={form}
        type={buttonType||type?type:'button'}
        style={{
        '--padding-top': '10px',
        '--padding-bottom': '10px',
        '--padding-start': '50px',
        '--padding-end': '50px',
        height: '100%',
        }}
      >
        {loading ? (
         <><IonSpinner color={`${disable ? 'dark' : 'light'}`} name="crescent"></IonSpinner>{loadingText && loadingText}</>
         ):<>{icon && <IonIcon icon={icon} slot="start" className={iconClassName} />}<div>{label}</div></>}
      </IonButton>
    </div>
  )
}
