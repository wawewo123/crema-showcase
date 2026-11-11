-- Sourced grinder catalog. NULL means the source page does not state the field.
INSERT INTO grinders (
  id, brand, model, category, burr_type, burr_size_mm, adjustment, steps,
  espresso_range, filter_range, espresso_suitable, filter_suitable, source_url, source_title
) VALUES
(
  'niche-zero', 'Niche', 'Zero', 'home', 'conical', 63, 'stepless', NULL,
  NULL, NULL, 1, 1,
  'https://www.nichecoffee.co.uk/products/niche-zero',
  'Niche Coffee, Zero tech specs'
),
(
  'fellow-ode-gen-2', 'Fellow', 'Ode Gen 2', 'home', 'flat', 64, 'stepped', 31,
  NULL, 'Pour-over, drip, AeroPress, French press, cold brew', 0, 1,
  'https://fellowproducts.com/products/ode-brew-grinder-gen-2',
  'Fellow, Ode Brew Grinder Gen 2 details'
),
(
  'baratza-encore-esp', 'Baratza', 'Encore ESP', 'home', 'conical', 40, 'stepped', 40,
  '1–20', '21–40', 1, 1,
  'https://www.baratza.com/en-gb/product/encoretm-esp-zcg495',
  'Baratza GB, Encore ESP specifications'
),
(
  'mahlkonig-ek43', 'Mahlkönig', 'EK43', 'commercial', 'flat', 98, 'stepless', NULL,
  NULL, NULL, 1, 1,
  'https://www.mahlkoenig.us/products/ek43',
  'Mahlkönig USA, EK43 specifications'
),
(
  'sage-bes875-grinder', 'Sage', 'Barista Express built-in grinder', 'home', 'conical', NULL, NULL, NULL,
  NULL, NULL, 1, NULL,
  'https://assets.sageappliances.com/BES875/SES875_EU_UG6_D21_FA_LR.pdf',
  'Sage, Barista Express user guide (integrated conical burr grinder)'
)
ON CONFLICT (id) DO NOTHING;
