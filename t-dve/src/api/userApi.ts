import axiosInstance from './axiosinstance';

export const sendOtpApi = async (phone: string, token: string | null) => {
    try {
      if(!token)return
    
      
        const response = await axiosInstance.post('/auth/send-otp', {phone});
        return response.data;
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
        
    }
};

export const verifyOtpApi = async (phone: string, otp: string) => {
   
    try {
        const response = await axiosInstance.post('/auth/verify-otp', {phone, otp});
        return response.data;
        
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
        
    }
}

export const resendOtpApi = async (phone: string) => {
    try {
        const response = await axiosInstance.post('/resend-otp', {phone});
        return response.data;
        
    } catch (error) {
        console.error('Error resending OTP:', error);
        throw error;
        
    }
}