import type { FormHelperLabels } from "./type";

/** This object is used to validate the input box before clicking submit */
export const FormHelper: Record<FormHelperLabels, { required: string; validation: (value: any) => string | undefined }> = {

};