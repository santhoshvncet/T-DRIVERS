// import express from "express";
// import brevo from  '@getbrevo/brevo'
// import {emailCredentials} from "../../config/env";
// import { sendEmail } from "../../config/emailConfig";
import {Request , Response} from 'express'

import { pool, withTransaction } from "../db";
import { sendEmail } from '../../config/emailConfig';


export const contactSupport=(name:string,
email:string,
message:string
)=>{

try {
    if(!name || !email || !message){
        throw new Error("All fields are required");
    }

    return sendEmail({
        to:[{email:email, name:name}],
        subject:"Contact Support",
        htmlContent: `
      <html>
   <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
     <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

       <!-- Header -->
       <tr>
         <td style="text-align: center;">
           <h2 style="color: #333; margin-bottom: 5px;">📩 New Contact Support Request</h2>
           <p style="color: #777; font-size: 14px; margin-top: 0;">
             A new support message has been sent from your app.
           </p>
           <hr style="border: none; height: 1px; background-color: #ddd; margin-top: 15px;">
         </td>
       </tr>

       <!-- User Info Section -->
       <tr>
         <td style="padding: 10px 0;">
           <h3 style="color: #444; margin-bottom: 10px;">👤 Sender Details</h3>
           <p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Phone:</strong> ${message}</p>
         </td>
       </tr>
       <!-- Message Content -->
       <tr>
         <td style="padding: 10px 0;">
           <h3 style="color: #444; margin-bottom: 10px;">📝 Message</h3>
           <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; color: #333; line-height: 1.5;">
             ${message}
           </div>
         </td>
       </tr>
       <!-- Footer -->
       <tr>
         <td style="padding-top: 25px; text-align: center; font-size: 13px; color: #888;">
           <hr style="border: none; height: 1px; background-color: #ddd;">
           <p>If you want to reply directly, respond to <strong>{{email}}</strong></p>
           <p style="font-size: 12px; color: #aaa;">
             — This email was sent automatically from your Driver App Support System —
           </p>
         </td>
       </tr>
     </table>
   </body>
 </html> 
       `,
        textContent:message,
    })
} catch (error) {
    console.error("Email error:", error);
}

}



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


export const supportQuery = async (
  name?: string,
  email?: string,
  message?: string,
  driverId?: number,
  user_id?: number
) => {

  const query = `
    INSERT INTO ticket(name, email, driver_id, user_id, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [name, email, driverId, user_id, message];

  const result = await withTransaction(async (client) => {
  const result = await client.query(query, values);
  return result
  });


  return result.rows[0];
};


export const suportMail=async(req:any ,res:any)=>{
    const {email,name,message , driverId , user_id}=req.body;
    try {
    if(!name || !email || !message){
        return res.status(400).json({success:false,message:"All fields are required"});
    }
    const response= await supportQuery(name,email,message,driverId,user_id);
    res.status(200).json({success:true,message:"Support request sent successfully",data:response})
    } catch (error) {
        res.status(500).json({success:false,message:"Error sending support request",error})
    }
}