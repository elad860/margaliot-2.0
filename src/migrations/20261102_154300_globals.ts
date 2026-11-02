import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigation_header_items_type" AS ENUM('group', 'page');
  CREATE TYPE "public"."enum_navigation_header_items_group" AS ENUM('trips', 'activities', 'learning');
  CREATE TYPE "public"."enum_navigation_header_items_page" AS ENUM('about', 'contact');
  CREATE TABLE "site_settings_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"number" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organisation_name" varchar,
  	"tagline" varchar,
  	"next_trip_id" integer,
  	"default_seo_image_id" integer,
  	"whatsapp_number" varchar,
  	"default_whatsapp_message" varchar,
  	"email" varchar,
  	"office_hours" varchar,
  	"socials_instagram" varchar,
  	"socials_tiktok" varchar,
  	"socials_youtube" varchar,
  	"socials_whatsapp_community" varchar,
  	"accessibility_coordinator_name" varchar,
  	"accessibility_coordinator_phone" varchar,
  	"accessibility_coordinator_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_header_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_navigation_header_items_type" NOT NULL,
  	"group" "enum_navigation_header_items_group",
  	"page" "enum_navigation_header_items_page"
  );
  
  CREATE TABLE "navigation_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_labels_trips" varchar DEFAULT 'מסעות',
  	"group_labels_activities" varchar DEFAULT 'פעילויות',
  	"group_labels_learning" varchar DEFAULT 'לימוד והתחזקות',
  	"tab_descriptions_about" varchar,
  	"tab_descriptions_consultation" varchar,
  	"tab_descriptions_next_trip" varchar,
  	"tab_descriptions_uman_trips" varchar,
  	"tab_descriptions_tzadikim_israel" varchar,
  	"tab_descriptions_womens_evenings" varchar,
  	"tab_descriptions_channeling" varchar,
  	"tab_descriptions_tools_course" varchar,
  	"tab_descriptions_parasha" varchar,
  	"tab_descriptions_online_classes" varchar,
  	"tab_descriptions_contact" varchar,
  	"header_cta_label" varchar DEFAULT 'למסע הקרוב',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "site_settings_phones" ADD CONSTRAINT "site_settings_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_next_trip_id_trips_id_fk" FOREIGN KEY ("next_trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_seo_image_id_media_id_fk" FOREIGN KEY ("default_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_links" ADD CONSTRAINT "navigation_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_phones_order_idx" ON "site_settings_phones" USING btree ("_order");
  CREATE INDEX "site_settings_phones_parent_id_idx" ON "site_settings_phones" USING btree ("_parent_id");
  CREATE INDEX "site_settings_next_trip_idx" ON "site_settings" USING btree ("next_trip_id");
  CREATE INDEX "site_settings_default_seo_image_idx" ON "site_settings" USING btree ("default_seo_image_id");
  CREATE INDEX "navigation_header_items_order_idx" ON "navigation_header_items" USING btree ("_order");
  CREATE INDEX "navigation_header_items_parent_id_idx" ON "navigation_header_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_links_order_idx" ON "navigation_footer_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_links_parent_id_idx" ON "navigation_footer_links" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_phones" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "navigation_header_items" CASCADE;
  DROP TABLE "navigation_footer_links" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."enum_navigation_header_items_type";
  DROP TYPE "public"."enum_navigation_header_items_group";
  DROP TYPE "public"."enum_navigation_header_items_page";`)
}
