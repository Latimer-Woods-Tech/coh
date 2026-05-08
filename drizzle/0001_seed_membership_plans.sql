-- Seed membership_plans with Stripe products + prices created via Phase 0 setup.
-- Idempotent: ON CONFLICT DO NOTHING uses the unique tier constraint.

INSERT INTO "membership_plans" (
  "name", "tier", "description", "monthly_price", "annual_price",
  "stripe_price_id_monthly", "stripe_price_id_annual", "stripe_product_id",
  "benefits", "is_active"
) VALUES (
  'VIP Membership',
  'vip',
  'Early access to The Chair, member-only episodes, 10% off The Vault, monthly community circle.',
  19.00,
  190.00,
  'price_1TUmEEGeq16Y7ZRymmbRvbPZ',
  'price_1TUmEHGeq16Y7ZRyt2dLHMkZ',
  'prod_UTjhOKlWpdrGh1',
  '[
    {"type": "discount", "description": "10% off The Vault", "value": "10"},
    {"type": "access", "description": "Member-only Show episodes", "value": null},
    {"type": "priority", "description": "Early access to booking slots", "value": null},
    {"type": "community", "description": "Monthly community circle (Telnyx RTC)", "value": null}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "membership_plans" (
  "name", "tier", "description", "monthly_price", "annual_price",
  "stripe_price_id_monthly", "stripe_price_id_annual", "stripe_product_id",
  "benefits", "is_active"
) VALUES (
  'Inner Circle Membership',
  'inner_circle',
  'Everything in VIP, plus quarterly 1:1 with the founder, full Academy access, Stage replays, private text channel.',
  49.00,
  490.00,
  'price_1TUmEKGeq16Y7ZRyP9ouaLzO',
  'price_1TUmENGeq16Y7ZRyIsvFZXyu',
  'prod_UTjhLdJp9LMXR2',
  '[
    {"type": "discount", "description": "10% off The Vault", "value": "10"},
    {"type": "access", "description": "All member-only Show episodes + replays", "value": null},
    {"type": "academy", "description": "Full Academy access", "value": null},
    {"type": "consultation", "description": "Quarterly 1:1 with the founder", "value": null},
    {"type": "channel", "description": "Private Inner Circle text channel", "value": null}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;
