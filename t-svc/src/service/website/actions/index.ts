import { Router } from "express";
import { getDashboardCounts } from "./getCount";
import { supportMail } from "./emailApi";


const router = Router();

router.get("/dashboard_counts", async (req: any, res: any) => {
  try {
    await getDashboardCounts(req, res);
  } catch (error) {
    console.error("Dashboard Counts Route Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});
router.post("/support_email", async (req: any, res: any) => {
  try {
    await supportMail(req, res);
  } catch (error) {
    console.error("Support Mail Route Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});
export default router;
