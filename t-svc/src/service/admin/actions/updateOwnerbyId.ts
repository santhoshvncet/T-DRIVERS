import { withTransaction } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

export async function updateOwnerByIdWithFiles(ownerId: any, data: any) {
  try {
    const [
      frontImageUrl,
      backImageUrl,
      leftImageUrl,
      rightImageUrl,
      carInsuranceUrl,
      rcUrl,
      profilePhotoUrl,
      passbookFrontImageUrl,
    ] = await Promise.all([
      data.front ? uploadBufferToS3(data.front, "car/front") : null,
      data.back ? uploadBufferToS3(data.back, "car/back") : null,
      data.left ? uploadBufferToS3(data.left, "car/left") : null,
      data.right ? uploadBufferToS3(data.right, "car/right") : null,
      data.car_insurance ? uploadBufferToS3(data.car_insurance, "car/insurance") : null,
      data.rc ? uploadBufferToS3(data.rc, "car/rc") : null,
      data.profile_photo ? uploadBufferToS3(data.profile_photo, "profile") : null,
      data.passbook_front_image ? uploadBufferToS3(data.passbook_front_image, "bank/passbook") : null,
    ]);

    return await withTransaction(async (client) => {
      // 2️⃣ Verify user exists
      const userRes = await client.query(
        `SELECT id, city_id FROM users WHERE id = $1`,
        [ownerId]
      );
      if (userRes.rows.length === 0) throw new Error("Owner user not found");
      const currentCityId: number | null = userRes.rows[0].city_id ?? null;

      // 3️⃣ Update USERS table dynamically
      const userUpdates: Record<string, any> = {
        name: data.full_name || data.fullName || data.name,
        phone: data.phone || data.phoneNumber,
        age: data.age,
        email: data.email,
        address: data.address || data.area,
        profile_url: profilePhotoUrl,
      };

      const userFields: string[] = [];
      const userValues: any[] = [];
      let idx = 1;
      for (const [col, val] of Object.entries(userUpdates)) {
        if (val !== undefined && val !== null && val !== "") {
          userFields.push(`${col} = $${idx}`);
          userValues.push(val);
          idx++;
        }
      }
      if (userFields.length > 0) {
        userValues.push(ownerId);
        await client.query(
          `UPDATE users SET ${userFields.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
          userValues
        );
      }

      // 4️⃣ Update CITY if provided
      if (data.cityName && data.stateName) {
        let newCityId = currentCityId;

        const cityRes = await client.query(
          `SELECT id FROM city WHERE city_name = $1 AND state = $2 LIMIT 1`,
          [data.cityName, data.stateName]
        );

        if (cityRes.rows.length > 0) {
          newCityId = cityRes.rows[0].id;
        } else {
          const insertCity = await client.query(
            `INSERT INTO city (city_name, state, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
            [data.cityName, data.stateName]
          );
          newCityId = insertCity.rows[0].id;
        }

        if (newCityId !== currentCityId) {
          await client.query(`UPDATE users SET city_id = $1 WHERE id = $2`, [
            newCityId,
            ownerId,
          ]);
        }
      }

      // 5️⃣ Update or insert CAR
      if (data.car_id) {
        const carUpdates: Record<string, any> = {};
        if (frontImageUrl) carUpdates.front_image_url = frontImageUrl;
        if (backImageUrl) carUpdates.back_image_url = backImageUrl;
        if (leftImageUrl) carUpdates.left_image_url = leftImageUrl;
        if (rightImageUrl) carUpdates.right_image_url = rightImageUrl;
        if (carInsuranceUrl) carUpdates.car_insurance = carInsuranceUrl;
        if (rcUrl) carUpdates.rc = rcUrl;
        if (data.transmission !== undefined) carUpdates.transmission = data.transmission;
        if (data.boardType !== undefined || data.board_type !== undefined)
          carUpdates.board_type = data.boardType || data.board_type;
        if (data.model_id !== undefined) carUpdates.model_id = parseInt(data.model_id, 10);

        const fields: string[] = [];
        const values: any[] = [];
        let param = 1;
        for (const [col, val] of Object.entries(carUpdates)) {
          fields.push(`${col} = $${param}`);
          values.push(val);
          param++;
        }

        if (fields.length > 0) {
          values.push(data.car_id, ownerId);
          await client.query(
            `UPDATE car SET ${fields.join(", ")}, updated_at = NOW()
             WHERE id = $${param} AND owner_id = $${param + 1} AND deleted_at IS NULL`,
            values
          );
        }
      } else if (data.model_id) {
        await client.query(
          `INSERT INTO car (
            front_image_url, back_image_url, left_image_url, right_image_url,
            car_insurance, rc, transmission, board_type, model_id,
            owner_id, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
          [
            frontImageUrl || null,
            backImageUrl || null,
            leftImageUrl || null,
            rightImageUrl || null,
            carInsuranceUrl || null,
            rcUrl || null,
            data.transmission || "manual",
            data.boardType || data.board_type || "whiteboard",
            parseInt(data.model_id, 10),
            ownerId,
          ]
        );
      }

      // 6️⃣ Bank account upsert
      if (data.accountHolderName || data.bankName || data.ifsc || passbookFrontImageUrl) {
        await client.query(
          `INSERT INTO bank_account (
            user_id, account_holder, bank_name, ifsc, passbook_front_image,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            account_holder = COALESCE(EXCLUDED.account_holder, bank_account.account_holder),
            bank_name = COALESCE(EXCLUDED.bank_name, bank_account.bank_name),
            ifsc = COALESCE(EXCLUDED.ifsc, bank_account.ifsc),
            passbook_front_image = COALESCE(EXCLUDED.passbook_front_image, bank_account.passbook_front_image),
            updated_at = NOW()`,
          [
            ownerId,
            data.accountHolderName || null,
            data.bankName || null,
            data.ifsc || null,
            passbookFrontImageUrl || null,
          ]
        );
      }

      // 7️⃣ Return updated data
      const selectRes = await client.query(
        `SELECT  
          u.id, u.name, u.phone, u.age, u.email, u.address, u.profile_url,
          c.city_name AS "cityName",
          c.state AS "stateName",
          COALESCE(
            (
              SELECT json_agg(car_data)
              FROM (
                SELECT 
                  id,
                  front_image_url AS "frontImageUrl",
                  back_image_url AS "backImageUrl",
                  left_image_url AS "leftImageUrl",
                  right_image_url AS "rightImageUrl",
                  car_insurance AS "carInsurance",
                  rc,
                  car_status_id AS "carStatusId",
                  created_at AS "createdAt",
                  updated_at AS "updatedAt",
                  deleted_at AS "deletedAt",
                  transmission,
                  board_type AS "boardType",
                  model_id AS "modelId",
                  owner_id AS "ownerId"
                FROM car
                WHERE owner_id = u.id AND deleted_at IS NULL
              ) car_data
            ), '[]'::json
          ) AS cars
        FROM users u
        LEFT JOIN city c ON u.city_id = c.id
        WHERE u.id = $1`,
        [ownerId]
      );

      return selectRes.rows[0] || null;
    });
  } catch (error) {
    console.error("🔥 Error updating owner:", error);
    throw error;
  }
}