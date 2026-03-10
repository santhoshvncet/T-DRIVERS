import { pool } from "../../../db"


const GET_OWNER_FOR_REFUND = `
SELECT
  p.razorpay_payment_id        AS razorpay_payment_id,
  p.trip_id   AS trip_id,
  t.owner_id  AS owner_id,
  o.full_name AS owner_name,
  o.email     AS owner_email
FROM payment_details p
JOIN trip t  ON t.id = p.trip_id
JOIN owner o ON o.id = t.owner_id
WHERE p.razorpay_payment_id = $1;
 `
  
export const getUserDetailsForRefund = async (razorpay_payment_id: string) => {
  console.log("here is the payment id", razorpay_payment_id)
console.log("type:", typeof razorpay_payment_id);

  const result = await pool.query(GET_OWNER_FOR_REFUND, [razorpay_payment_id]);


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
