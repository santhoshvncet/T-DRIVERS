import { pool } from "../../db";

export async function getReportById(id: any, type: string) {
  try {
    // Decide which column to filter by
    let whereColumn: string;

    switch (type) {
      case "driver":
        whereColumn = "t.driver_id";
        break;
      case "owner":
        whereColumn = "t.owner_id";
        break;
      case "trip":
        whereColumn = "t.id";
        break;
      default:
        throw new Error("Invalid type. Should be 'driver', 'owner', or 'trip'.");
    }

    // Base query template; only WHERE column is dynamic
    const getBaseQuery = (whereCol: string) => `
      SELECT
        t.id,
        t.driver_id,
        t.owner_id,
        t.origin_id,
        t.dest_id,
        t.fare_amount,
        t.started_at,
        t.completed_at,
        t.status,

        c1.area       AS origin_area,
        c1.city_name  AS origin_city_name,
        c1.state      AS origin_state_name,
        c2.area       AS dest_area,
        c2.city_name  AS dest_city_name,
        c2.state      AS dest_state_name,

        du.name      AS driver_name,
        ou.name      AS owner_name,

        COALESCE(w.total_wallet_amount,   0) AS total_wallet_amount,
        COALESCE(w.driver_wallet_amount,  0) AS driver_wallet_amount,
        COALESCE(w.company_wallet_amount, 0) AS company_wallet_amount

      FROM trip t
      LEFT JOIN city   c1 ON t.origin_id = c1.id
      LEFT JOIN city   c2 ON t.dest_id   = c2.id
      LEFT JOIN driver d  ON t.driver_id = d.id
      LEFT JOIN users du   ON d.user_id = du.id
      LEFT JOIN owner  o  ON t.owner_id = o.id
      LEFT JOIN users ou   ON o.users_id = ou.id

      -- aggregate wallet_ledger by trip
      LEFT JOIN LATERAL (
        SELECT
          SUM(wl.amount) AS total_wallet_amount,
          SUM(
            CASE WHEN wl.wallet_owner = 'DRIVER' THEN wl.amount ELSE 0 END
          ) AS driver_wallet_amount,
          SUM(
            CASE WHEN wl.wallet_owner = 'COMPANY' THEN wl.amount ELSE 0 END
          ) AS company_wallet_amount
        FROM wallet_ledger wl
        WHERE wl.trip_id = t.id
        -- AND wl.direction = 'CREDIT'   -- uncomment if you only want credits
      ) w ON TRUE

      WHERE ${whereCol} = $1;
    `;

    const query = getBaseQuery(whereColumn);
    const { rows } = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return {
        message: "No Reports Available",
        reportData: [],
      };
    }

    // helper: paise -> rupees
    const paiseToRupees = (value: any) => Number(value || 0) / 100;

    const formattedData = rows.map((row) => {
      const totalAmountPaise   = row.total_wallet_amount;
      const driverAmountPaise  = row.driver_wallet_amount;
      const companyAmountPaise = row.company_wallet_amount;

      const totalAmount   = paiseToRupees(totalAmountPaise);
      const driverAmount  = paiseToRupees(driverAmountPaise);
      const companyAmount = paiseToRupees(companyAmountPaise);

      return {
        tripId: row.id,
      
        driverId: row.driver_id,
        ownerId: row.owner_id,
        driverName: row.driver_name,
        ownerName: row.owner_name,
      
        tripDetails: {
          from: {
            areaName:  row.origin_area,
            cityName:  row.origin_city_name,
            stateName: row.origin_state_name,
          },
          to: {
            areaName:  row.dest_area,
            cityName:  row.dest_city_name,
            stateName: row.dest_state_name,
          },
          startDate: row.started_at,
          endDate:   row.completed_at,
          status:    row.status,
        },

        amountDetails: {
          totalAmount,
          driverAmount,
          companyAmount,
        },
      };
    });

    // Summary totals in rupees
    const summary = formattedData?.reduce(
      (acc, item) => {
        acc.totalAmount   += item.amountDetails?.totalAmount;
        acc.driverAmount  += item.amountDetails?.driverAmount;
        acc.companyAmount += item.amountDetails?.companyAmount;
        return acc;
      },
      {
        totalAmount: 0,
        driverAmount: 0,
        companyAmount: 0,
      }
    );

    const first = rows[0];

    return {
      driverId: first.driver_id,
      ownerId:  first.owner_id,
      driverName: first.driver_name,
      ownerName:  first.owner_name,

      amount: {
        totalAmount:   summary.totalAmount,
        driverAmount:  summary.driverAmount,
        companyAmount: summary.companyAmount,
      },

      reportData: formattedData,
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    throw error;
  }
}