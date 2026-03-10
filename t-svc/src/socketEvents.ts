import { Socket } from "socket.io";

export function createSocketHandler(
  socket: Socket,
  eventName: string,
  handler: (payload: any) => Promise<any>
) {
  socket.on(eventName, async (payload) => {
    try {
      const result = await handler(payload);

      socket.emit(eventName + "_response", {
        success: true,
        ...result,
      });
    } catch (err) {
      console.error(`Socket Error (${eventName}):`, err);
      socket.emit(eventName + "_response", {
        success: false,
        message: "Server Error",
      });
    }
  });
}
