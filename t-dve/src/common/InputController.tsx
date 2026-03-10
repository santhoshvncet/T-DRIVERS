import { IonInput } from '@ionic/react';
import { useEffect, useRef, useState, type JSXElementConstructor, type ReactElement } from 'react';
import { Controller, type Control, type Validate } from 'react-hook-form';
import type { FormHelperLabels } from './type';
import { FormHelper } from './FormHelper';
import util from '../utils';

interface Props {
    /** Hook form control */
    control: Control<any, any>
    /** Field Name. Access this field value from this name */
    name: string
    /** Field Label */
    label?: string;
    /** Field Placeholder */
    placeholder?: string;
    /** Field is required or optional */
    required?: boolean;
    /** Field validation function */
    validate?: Validate<any, any>;
    /** Field character capitalisation */
    autocapitalize?: "off" | "none" | "on" | "sentences" | "words" | "characters"
    /** To trigger focus and enable keyboard */
    autofocus?: boolean
    /** Clear Input box */
    clearInput?: boolean
    /** Field Disable */
    disabled?: boolean
    /** Ion Input style */
    fill?: "outline" | "solid" | "default"
    /** Field Helper message */
    helperText?: string
    /** Onchange callback function */
    handleChange?: any
    /** Field type */
    type?: "date" | "datetime-local" | "email" | "month" | "number" | "password" | "search" | "tel" | "text" | "time" | "url" | "week"
    /** Custom Icon Ion not supporting set icon it's kind of workaround here */
    icon?: ReactElement<any, string | JSXElementConstructor<any>> | string
    /** Custom click handler */
    handleClick?: React.MouseEventHandler<HTMLIonInputElement>
    /** Label Placement by default set to floating */
    labelPlacement?: "fixed" | "start" | "end" | "floating" | "stacked"
    /**Callback function to handle input focus */
    handleFocus?: () => void
    /**Callback function to handle input blur */
    handleBlur?: () => void
    id?: string
    value?: string | number
    /** Handles MaxLength of the field , works only with strings */
    maxlength?: number;
    /** Error message to be printed for required fields */
    errorMessage?: string,
    /* Start icon for the input , pass react node */
    startIcon?: React.ReactNode,

    endIcon? : React.ReactNode,
    /** Input custome css names */
    className?: string
    /** Auto completed */
    autocomplete?: 'on' | 'off'
    /** user can't edit */
    readonly?:boolean
    /** Handle which keypad open for user in mobile*/
    inputMode?: "search" | "text" | "none" | "email" | "tel" | "url" | "numeric" | "decimal" | undefined 
 /** Handles the valus where user cannot select the past date for pg booking*/
     min?: string;
// handles the value where user cannot book the furture dates lyk after 6 months 
     max?: string;
}

/**
 * The error text will not be displayed unless the `ion-invalid` and `ion-touched` classes are added to the `ion-input`
 * Input fill "solid" or "outline" inputs can be used on iOS by setting Input's mode to md
 * inputs that use fill should not be used in ion-item
 * @param props refer Props
 * @returns IonInput with controller
 */
const InputController: React.FC<Props> = (props) => {
    const {
        control,
        name,
        label,
        placeholder,
        required,
        icon,
        validate,
        handleChange,
        autocapitalize,
        autofocus,
        clearInput,
        disabled,
        fill = "outline",
        helperText,
        type = "text",
        handleClick,
        labelPlacement = "floating",
        handleBlur,
        handleFocus,
        id,
        value,
        maxlength,
        errorMessage,
        startIcon,
        endIcon,
        className,
        autocomplete = 'off',
        readonly = false,
        inputMode,
        min,
        max,
    } = props

    const [isTouched, setIsTouched] = useState(true);
    const inputRef = useRef<any>(null);

    useEffect(() => {
        if (autofocus) {
            setTimeout(() => inputRef?.current?.setFocus(), 100);
        }
    },[])

    const markBlur = () => {
        setIsTouched(true);
        if (handleBlur) {
            handleBlur()
        }
    };
    const markFocus = () => {
        setIsTouched(false);
        if (handleFocus) {
            handleFocus()
        }
    };
    
    const validateInput = (value: string, name: FormHelperLabels)=>{
        const validationResult = value ? FormHelper[name||'']?.validation(value) : ''        
        if(validationResult){
            return validationResult
        }
        else{
            return ''
        }
    }

    const getStyle = (value: string, label: FormHelperLabels)=>{
        const validationResult = value ? FormHelper[label||'']?.validation(value) : ''        
        if(validationResult){
            return 'customHelperText'
        }
        else{
            return ''
        }
    }

    return (
        <div className="relative" id={id}>
            <Controller
                control={control}
                name={name}
                
                defaultValue={value ? value : ''}
                rules={{
                    required: required ? errorMessage || `${util.firstLetterCaps(name)}  is required` : false,
                    ...(validate ? { validate } : {}),   
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => {           
                    const is_error = error !== undefined
                    const _filed = { ...field, ...(handleClick ? { value: value ?? "" } : {}) }
                    return (<IonInput
                        {..._filed}
                        onIonInput={handleChange ? ({ target: { value } }) => {
                            handleChange(value, onChange)
                        } : onChange}
                        onIonBlur={markBlur}
                        onFocus={markFocus}
                        
                        onClick={handleClick}
                        ref={inputRef}
                        value={value ? value : ''}
                        autocapitalize={autocapitalize}
                        autofocus={autofocus}
                        autocomplete={autocomplete}
                        type={type}
                        clearInput={clearInput}
                        disabled={disabled}
                        fill={fill === 'default' ? undefined : fill}
                        label={label}
                        inputMode={inputMode}
                        placeholder={placeholder}
                        labelPlacement={labelPlacement}
                        errorText={error?.message || ""}
                        helperText={name in FormHelper ? validateInput(value, name): helperText}
                        className={`ion-margin-bottom w-full  ${is_error||validateInput(value, name) ? "ion-invalid" : ""} ${isTouched ? "ion-touched" : ""} ${className || ''} ${getStyle(value, name)}`}
                        mode="md"
                        min={min} 
                        max={max} 
                        maxlength={maxlength}
                        color={validateInput(value, name) ? 'danger' : 'primary'}
                        readonly={readonly}
                        style={{ backgroundColor: 'transparent', textAlign: 'left' }}
                    >
                        {startIcon ? (<div slot='start'>{startIcon}</div>) : null}
                        {endIcon ? <div slot="end">{endIcon}</div> : null}
                    </IonInput>)
                }}
            />
            {/* Icon is kind of workaround, try to avoid. no proper solution in ionic */}
            {icon ? (
                <div className="absolute z-10 right-1 top-5 text-typo-icon w-8 flex justify-center items-center">
                    {icon}
                </div>
            ) : null}
        </div>
    );
};

export default InputController;
