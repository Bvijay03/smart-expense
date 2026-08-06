import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from "expo-server-sdk";

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export interface SendPushNotificationParams {
  to: string | string[]; // ExpoPushToken(s)
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
}

export const notificationService = {
  /**
   * Sends a push notification to one or more devices
   */
  async sendPushNotification({ to, title, body, data, sound = "default" }: SendPushNotificationParams) {
    const tokens = Array.isArray(to) ? to : [to];
    
    // Filter out invalid tokens
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound,
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    // Send the chunks to the Expo push notification service
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notifications chunk", error);
      }
    }

    // In a real app, you would want to handle receipt validation later, 
    // but for our purposes, sending the tickets is enough.
    return tickets;
  }
};
