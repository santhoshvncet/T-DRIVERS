import axios from "axios";
import { pool, withTransaction } from "../../db";

/* ------------------------------------------------------------------ */
/* OneSignal Config                                                    */
/* ------------------------------------------------------------------ */

const ONE_SIGNAL_API_URL = "https://api.onesignal.com/notifications";
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID!;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY!;
const CHANNEL_ID = process.env.ONE_SIGNAL_CHANNEL_ID!;

console.log("API KEY exists:", !!ONE_SIGNAL_API_KEY);
console.log("APP ID:", ONE_SIGNAL_APP_ID);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type NotificationRole = "Driver" | "Owner" | "ALL";

export interface CreateNotificationInput {
  title: string;
  message: string;
  userIds?: number[];
  role?: NotificationRole;
  imageUrl?: string;
  launchUrl?: string;
  expiryAt?: Date;
}

/* ------------------------------------------------------------------ */
/* OneSignal Push Sender                                               */
/* ------------------------------------------------------------------ */

async function sendPushNotification(params: {
  externalIds: string[];
  heading: string;
  content: string;
  imageUrl?: string;
  launchUrl?: string;
}) {
  const requestBody: any = {
    app_id: ONE_SIGNAL_APP_ID,
    include_aliases: { external_id: params.externalIds },
    target_channel: "push",
    android_channel_id: CHANNEL_ID,
    android_sound: "default",
    priority: 10,
    headings: { en: params.heading },
    contents: { en: params.content },
    apns: {
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10",
      },
      payload: {
        aps: {
          alert: { title: params.heading, body: params.content },
          sound: "default",
          "interruption-level": "time-sensitive",
          "relevance-score": 1,
        },
      },
    },
  };

  if (params.externalIds.length) {
    requestBody.include_aliases = { external_id: params.externalIds };
  } else {
    console.warn("No valid external IDs. Sending notification to all users as fallback.");
    requestBody.include_segments = ["All"];
  }

  if (params.launchUrl) requestBody.url = params.launchUrl;
  if (params.imageUrl) requestBody.big_picture = params.imageUrl;

  console.log("OneSignal requestBody:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(ONE_SIGNAL_API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONE_SIGNAL_API_KEY}`,
      },
    });

    console.log("OneSignal response:", response.data);
    return response.data;

  } catch (err: any) {
    console.log("❌ OneSignal ERROR:", JSON.stringify(err?.response?.data, null, 2));
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Create + Send Notification (COMMON FUNCTION)                        */
/* ------------------------------------------------------------------ */

export async function createAndSendNotification(
  input: CreateNotificationInput
) {
  let notificationId: number | null = null;
  let externalIds: string[] = [];

  try {
    await withTransaction(async (client) => {

      /* ---------------- Insert Notification ---------------- */
      const notificationResult = await client.query(
        `INSERT INTO notifications (title, message, expiry_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [input.title, input.message, input.expiryAt || null]
      );

      notificationId = notificationResult.rows[0].id;
      console.log("Notification input:", input);

      /* ---------------- Targets + External IDs ---------------- */
      if (input.userIds?.length) {
        for (const userId of input.userIds) {
          await client.query(
            `INSERT INTO notification_targets
             (notification_id, target_type, target_value)
             VALUES ($1, 'USER', $2)`,
            [notificationId, userId.toString()]
          );
          externalIds.push(`tdrivers_user_${userId}`);
        }
      } else if (input.role) {
        await client.query(
          `INSERT INTO notification_targets
           (notification_id, target_type, target_value)
           VALUES ($1, $2, $3)`,
          [
            notificationId,
            input.role === "ALL" ? "ALL" : "ROLE",
            input.role === "ALL" ? null : input.role,
          ]
        );

        const usersResult = await client.query(
          `SELECT id FROM users WHERE role = $1`,
          [input.role]
        );

        externalIds = usersResult.rows.map(
          (u: { id: any }) => `tdrivers_user_${u.id}`
        );
      } else if (input.role === "ALL") {
        await client.query(
          `INSERT INTO notification_targets
           (notification_id, target_type)
           VALUES ($1, 'ALL')`,
          [notificationId]
        );
      }
    });

    console.log("Sending notification to external IDs:", externalIds);
    console.log("Inserted notification ID:", notificationId);

    /* ---------------- Send Push AFTER COMMIT ---------------- */
    if (externalIds.length) {
      await sendPushNotification({
        externalIds,
        heading: input.title,
        content: input.message,
        imageUrl: input.imageUrl,
        launchUrl: input.launchUrl,
      });
    }

    return {
      success: true,
      notificationId,
    };

  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Get Notifications for User (UNCHANGED)                              */
/* ------------------------------------------------------------------ */

export async function getUserNotifications(userId: number, role: string) {
  const result = await pool.query(
    `
    SELECT n.id, n.title, n.message, n.icon_url, n.nav_url, n.nav_page,
           n.created_at, un.read_at
    FROM notifications n
    JOIN notification_targets nt ON nt.notification_id = n.id
    LEFT JOIN user_notifications un
      ON un.notification_id = n.id AND un.user_id = $1
    WHERE n.deleted_at IS NULL
      AND (n.expiry_at IS NULL OR n.expiry_at > NOW())
      AND un.read_at IS NULL
      AND (
        nt.target_type = 'ALL'
        OR (nt.target_type = 'ROLE' AND nt.target_value = $2)
        OR (nt.target_type = 'USER' AND nt.target_value = $1::text)
      )
    ORDER BY n.created_at DESC
    `,
    [userId, role]
  );

  return result.rows;
}

/* ------------------------------------------------------------------ */
/* Mark Notification as Read (UNCHANGED)                               */
/* ------------------------------------------------------------------ */

export async function markAllNotificationsAsRead(userId: number, role: string) {
  await pool.query(
    `
    INSERT INTO user_notifications (user_id, notification_id, read_at)
    SELECT $1, n.id, NOW()
    FROM notifications n
    JOIN notification_targets nt ON nt.notification_id = n.id
    LEFT JOIN user_notifications un
      ON un.notification_id = n.id AND un.user_id = $1
    WHERE n.deleted_at IS NULL
      AND (n.expiry_at IS NULL OR n.expiry_at > NOW())
      AND un.read_at IS NULL
      AND (
        nt.target_type = 'ALL'
        OR (nt.target_type = 'ROLE' AND nt.target_value = $2)
        OR (nt.target_type = 'USER' AND nt.target_value = $1::text)
      )
    ON CONFLICT (user_id, notification_id)
    DO UPDATE SET read_at = NOW()
    WHERE user_notifications.read_at IS NULL
    `,
    [userId, role]
  );

  return { success: true };
}
