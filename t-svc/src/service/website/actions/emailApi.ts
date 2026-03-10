import {Request , Response} from 'express'

import { pool } from '../../db';
import { sendContactFormEmail } from '../../../config/emailConfig';

export const contactSupport = async (
  name: string,
  email: string,
  message: string
) => {
  try {
    if (!name || !email || !message) {
      throw new Error("All fields are required");
    }

    // ✅ ONLY forward the 3 values
    return await sendContactFormEmail(name, email, message);
  } catch (error) {
    console.error("Email error:", error);
    throw error; // IMPORTANT
  }
};




export const supportMail=async(req:Request ,res:Response)=>{
    const {name,email,message}=req.body;
    try {
        await contactSupport(name,email,message);
        return res.status(200).json({success:true,message:"Support request sent successfully"})
    } catch (error) {
        console.error("Support Mail Error:", error);
        return res.status(500).json({success:false,message:"Error sending support request",error})
    }
}