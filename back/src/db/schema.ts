import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  bigint,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'deleted',
]);

export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'accepted',
  'refused',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'uploaded',
  'paid',
]);

export const referralCommissionStatusEnum = pgEnum('referral_commission_status', [
  'pending',
  'available',
  'withdrawn',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'invoice',
  'gift_card',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'submission_accepted',
  'submission_refused',
  'invoice_uploaded',
  'invoice_paid',
  'milestone_reached',
  'campaign_update',
  'campaign_published',
  'campaign_published_brand',
  'new_creator_registered',
  'new_creator_tiktok',
  'new_submission',
  'referral_new_referee',
  'referral_commission_earned',
  'referral_invoice_uploaded',
  'referral_invoice_paid',
]);

// ============================================
// TABLES
// ============================================

/**
 * Table des utilisateurs
 * Un utilisateur peut être créateur ET/OU marque
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  firstName: varchar('first_name', { length: 256 }).notNull(),
  lastName: varchar('last_name', { length: 256 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  isCreator: boolean('is_creator').notNull().default(false),
  isBrand: boolean('is_brand').notNull().default(false),
  // Parrainage
  referralCode: varchar('referral_code', { length: 6 }).unique(),
  referralPercentage: integer('referral_percentage').notNull().default(10),
  referredById: integer('referred_by_id'),
  // TikTok multi-app support
  new_20: boolean('new_20').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Tokens de réinitialisation de mot de passe (un par demande, expiration 1h)
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Comptes TikTok connectés par les créateurs
 * Un créateur peut connecter plusieurs comptes
 */
export const tiktokAccounts = pgTable('tiktok_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tiktokUserId: varchar('tiktok_user_id', { length: 256 }).notNull(),
  username: varchar('username', { length: 256 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isValid: boolean('is_valid').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Profils des marques
 * Un utilisateur avec isBrand=true doit avoir un profil marque
 */
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 256 }).notNull(),
  sector: varchar('sector', { length: 256 }).notNull(),
  website: text('website'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Campagnes créées par les marques
 */
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 512 }).notNull(),
  description: text('description').notNull(),
  coverImageUrl: text('cover_image_url'),
  youtubeUrl: text('youtube_url'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Paliers de récompense pour les campagnes
 */
export const campaignRewards = pgTable('campaign_rewards', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  viewsTarget: bigint('views_target', { mode: 'number' }).notNull(),
  amountEur: integer('amount_eur').notNull(), // Stocké en centimes
  allowMultipleVideos: boolean('allow_multiple_videos').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Soumissions de vidéos par les créateurs
 */
export const campaignSubmissions = pgTable('campaign_submissions', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  tiktokAccountId: integer('tiktok_account_id')
    .notNull()
    .references(() => tiktokAccounts.id, { onDelete: 'cascade' }),
  tiktokVideoId: varchar('tiktok_video_id', { length: 256 }).notNull(),
  coverImageUrl: text('cover_image_url'), // Miniature de la vidéo TikTok
  status: submissionStatusEnum('status').notNull().default('pending'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  validatedAt: timestamp('validated_at'),
  refuseReason: text('refuse_reason'),
  adsCode: text('ads_code'), // Code d'ads TikTok (requis pour soumettre une facture)
  visibleInCommunity: boolean('visible_in_community').notNull().default(true), // Afficher dans les vidéos de la communauté
});

/**
 * Stats actuelles des vidéos soumises (relation 1:1 avec submissions)
 */
export const videoStatsCurrent = pgTable('video_stats_current', {
  submissionId: integer('submission_id')
    .primaryKey()
    .references(() => campaignSubmissions.id, { onDelete: 'cascade' }),
  views: bigint('views', { mode: 'number' }).notNull().default(0),
  likes: bigint('likes', { mode: 'number' }).notNull().default(0),
  comments: bigint('comments', { mode: 'number' }).notNull().default(0),
  shares: bigint('shares', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Historique des stats (pour tracking évolution)
 */
export const videoStatsHistory = pgTable('video_stats_history', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => campaignSubmissions.id, { onDelete: 'cascade' }),
  statsJson: jsonb('stats_json').notNull(),
  capturedAt: timestamp('captured_at').notNull().defaultNow(),
});

/**
 * Factures déposées par les créateurs
 */
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => campaignSubmissions.id, { onDelete: 'cascade' }),
  rewardId: integer('reward_id')
    .notNull()
    .references(() => campaignRewards.id, { onDelete: 'cascade' }),
  pdfUrl: text('pdf_url'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('invoice'),
  status: invoiceStatusEnum('status').notNull().default('uploaded'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
});

/**
 * Notifications in-app
 */
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Commissions de parrainage gagnées par les parrains
 */
export const referralCommissions = pgTable('referral_commissions', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refereeId: integer('referee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  amountEur: integer('amount_eur').notNull(), // Stocké en centimes
  status: referralCommissionStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Factures de retrait des commissions de parrainage
 */
export const referralInvoices = pgTable('referral_invoices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pdfUrl: text('pdf_url'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('invoice'),
  amountEur: integer('amount_eur').notNull(), // Stocké en centimes
  status: invoiceStatusEnum('status').notNull().default('uploaded'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  tiktokAccounts: many(tiktokAccounts),
  brand: one(brands),
  notifications: many(notifications),
  // Parrainage
  referrer: one(users, {
    fields: [users.referredById],
    references: [users.id],
    relationName: 'referral',
  }),
  referees: many(users, { relationName: 'referral' }),
  referralCommissionsAsReferrer: many(referralCommissions, { relationName: 'referrer' }),
  referralCommissionsAsReferee: many(referralCommissions, { relationName: 'referee' }),
  referralInvoices: many(referralInvoices),
}));

export const tiktokAccountsRelations = relations(tiktokAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [tiktokAccounts.userId],
    references: [users.id],
  }),
  submissions: many(campaignSubmissions),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  user: one(users, {
    fields: [brands.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, {
    fields: [campaigns.brandId],
    references: [brands.id],
  }),
  rewards: many(campaignRewards),
  submissions: many(campaignSubmissions),
}));

export const campaignRewardsRelations = relations(campaignRewards, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignRewards.campaignId],
    references: [campaigns.id],
  }),
  invoices: many(invoices),
}));

export const campaignSubmissionsRelations = relations(campaignSubmissions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignSubmissions.campaignId],
    references: [campaigns.id],
  }),
  tiktokAccount: one(tiktokAccounts, {
    fields: [campaignSubmissions.tiktokAccountId],
    references: [tiktokAccounts.id],
  }),
  currentStats: one(videoStatsCurrent, {
    fields: [campaignSubmissions.id],
    references: [videoStatsCurrent.submissionId],
  }),
}));

export const videoStatsCurrentRelations = relations(videoStatsCurrent, ({ one }) => ({
  submission: one(campaignSubmissions, {
    fields: [videoStatsCurrent.submissionId],
    references: [campaignSubmissions.id],
  }),
}));

export const videoStatsHistoryRelations = relations(videoStatsHistory, ({ one }) => ({
  submission: one(campaignSubmissions, {
    fields: [videoStatsHistory.submissionId],
    references: [campaignSubmissions.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  submission: one(campaignSubmissions, {
    fields: [invoices.submissionId],
    references: [campaignSubmissions.id],
  }),
  reward: one(campaignRewards, {
    fields: [invoices.rewardId],
    references: [campaignRewards.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const referralCommissionsRelations = relations(referralCommissions, ({ one }) => ({
  referrer: one(users, {
    fields: [referralCommissions.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referee: one(users, {
    fields: [referralCommissions.refereeId],
    references: [users.id],
    relationName: 'referee',
  }),
  invoice: one(invoices, {
    fields: [referralCommissions.invoiceId],
    references: [invoices.id],
  }),
}));

export const referralInvoicesRelations = relations(referralInvoices, ({ one }) => ({
  user: one(users, {
    fields: [referralInvoices.userId],
    references: [users.id],
  }),
}));
