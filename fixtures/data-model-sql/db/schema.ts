import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  unsubscribed: boolean("unsubscribed").default(false),
  api_key: text("api_key"),
});
