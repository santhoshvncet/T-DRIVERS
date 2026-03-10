import { Express , Router } from "express";
import  { suportMail } from "./contactUs";



const router = Router();

router.post("/support",suportMail)

export default router;