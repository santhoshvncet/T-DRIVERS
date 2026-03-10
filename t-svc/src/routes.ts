 // src/routes.ts
import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import { generateToken } from "./utils/jwt";
import { authenticateJWT } from "./middleware/authMiddleware";
// import service from "./service/users/index";
import service from "./service/users/index"; 
import auth from "./service/auth";
import drivers from "./service/drivers/index";
import emailService from './service/email/index'
import admin from "./service/admin/index";
import website from './service/website/actions/index'

const router = Router(); 
const razorpay = new Razorpay({ 
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_RDRGLqYfCxf3ci", 
    key_secret: process.env.RAZORPAY_KEY_SECRET || "p7JGKjaQKGIa2E8uMzpnNYAR"
  });

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "Service running fine " });
});
router.use('/users', service)
router.use("/auth", auth);
router.use('/drivers', drivers)
router.use('/website', website)
router.use('/mail',emailService)
router.use('/admin', admin)
router.get("/token", (_req: Request, res: Response) => {
  const token = generateToken({
    userId: 1,
    email: "test@example.com",
    phone: "9999999999",
    role: "user",
  });
  res.json({ token });
});
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "your@email.com" && password === "yourpassword") {
    return res.json({
      token: "example-jwt-token-12345",
    });
  }
  res.status(401).json({ message: "Invalid credentials" });
});


// router.post("/create-order", authenticateJWT, async (req: Request, res: Response) => {
//   const { amount, currency } = req.body;

//   if (!amount || !currency) {
//     return res.status(400).json({ error: "Amount and currency are required" });
//   }

//   const options = {
//     amount: amount * 100,
//     currency,
//     receipt: `receipt_${Date.now()}`,
//   };
//   try {
//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (error) {
//     console.error("Razorpay error:", error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

export default router;
