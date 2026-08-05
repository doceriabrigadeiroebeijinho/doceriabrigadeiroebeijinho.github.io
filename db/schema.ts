import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customerOrders = sqliteTable("customer_orders", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  orderCode: text("order_code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  service: text("service").notNull(),
  address: text("address"),
  itemsJson: text("items_json").notNull(),
  totalCents: integer("total_cents").notNull(),
  paymentMethod: text("payment_method").notNull(),
  inspirationKey: text("inspiration_key"),
  planPaymentMode: text("plan_payment_mode"),
  planTermsAccepted: integer("plan_terms_accepted", { mode: "boolean" })
    .notNull()
    .default(false),
  source: text("source").notNull().default("site"),
});
