import { useState } from 'react';
import constants from '../lib/constants';
import axiosInstance from '../api/axiosinstance';


interface RazorpayProps {
  amount: number;

  user: {
    name: string;
    email: string;
    contact: string;
    ownerId : string;
  };
  trip_id: string;
  onSuccess?: (response:any) => void;

}

export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };



  const initiatePayment = async ({ amount, user, trip_id, onSuccess  }: RazorpayProps) => {
if (loading || verifying) return;

    setLoading(true);
    const res = await loadRazorpayScript();

    if (!res) {
      setLoading(false);
      return;
    }

    try {
      const orderResponse = await axiosInstance.post(constants.CREATE_ORDER,{ amount, currency: 'INR', trip_id });
      const orderData = await orderResponse.data.razorpay_order

      if (!orderData || !orderData.id) {
        throw new Error('Order creation failed');
      }

      const options = {
        key: 'rzp_test_RwDKpJOIkszq4g', 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Subscription",
        description: `Plan`,
        order_id: orderData.id,
       handler: async function (response: any) {
  try {
     setVerifying(true)
    const verifyRes = await axiosInstance.post(constants.VERIFY_PAYMENT, {
      ...response,
      owner_id: user.ownerId,
      amount,
      trip_id,
    });

    const verifyData = await verifyRes?.data;

    if (verifyData?.status === 'success') {
      if (onSuccess) onSuccess(response);
    } else {
      console.error("Response of non-success",verifyData);
    }
  } catch (error) {
    console.error("Verify payment error", error);
  } finally {
    setVerifying(false);   
    setLoading(false); 
  }
},
      prefill: {
          name: user.name,
          email: user.email,
          contact: user.contact,
          
        },
        theme: {
          color: '#FB8B05'
        }
      };

      const rzp = new (window as any).Razorpay(options);
  

rzp.on('payment.failed', () => {
  setLoading(false);
  setVerifying(false);
});
    rzp.open();
    } catch (error) {
      console.error(error);
    }
  };

  return { initiatePayment, loading, verifying };
};