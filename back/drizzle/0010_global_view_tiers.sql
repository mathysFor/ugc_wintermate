CREATE TABLE "global_view_tiers" (
  "id" serial PRIMARY KEY NOT NULL,
  "views_target" bigint NOT NULL,
  "reward_label" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
