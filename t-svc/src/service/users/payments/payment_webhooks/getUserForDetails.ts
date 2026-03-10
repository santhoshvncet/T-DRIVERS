import { pool } from "../../../db"


 const GET_OWNER = `
SELECT
  t.id              AS trip_id,
  o.id              AS owner_id,
  u.name            AS owner_name,
  u.email           AS owner_email,
  u.phone           AS owner_phone
FROM payment_orders ord
JOIN trip t     ON t.id = ord.trip_id
JOIN owner o    ON o.id = t.owner_id
JOIN users u    ON u.id = o.users_id
WHERE ord.razorpay_order_id = $1;
 `
  
export const getUserDetails = async (razorpay_payment_id: string) => {

 const result = await pool.query(GET_OWNER, [razorpay_payment_id]);

  // if (!rows.length) {
  //   return console.log("User not found")
  // };

  return {
    // owner: {
    //   id: rows[0].owner_id,
    //   name: rows[0].owner_name,
    //   email: rows[0].owner_email
    // }
    data:result.rows[0]
  };
};
