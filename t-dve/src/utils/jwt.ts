import get from 'lodash/get';
import isNil from 'lodash/isNil'
import { Buffer } from 'buffer';

const buffer: any = Buffer

const jwt = {

    decryptToken: (value: string) => {
        try {
            const decoded = buffer.from(value, "base64").toString("utf8");
            return JSON.parse(decoded);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return null;
        }
    },
    decodeToken: (token: string) => {

        if (!isNil(token)) {

            const decodedPayload = JSON.parse(buffer.from(token.split('.')[1], 'base64').toString());
            const mobileNumber = get(decodedPayload, 'phone_number', '')
            const created_by = mobileNumber?.substring(3)

            return created_by
        } else {
            return null
        }
    }
}

export default jwt