-- Sourced machine catalog. NULL means the source page does not state the field.
INSERT INTO machines (
  id, brand, model, category, heating, pid, brew_bar, pump_bar, portafilter_mm, pre_infusion, flow_control, source_url, source_title
) VALUES
(
  'gaggia-classic-pro-e24', 'Gaggia', 'Classic Pro E24', 'home', 'single-boiler', NULL, 9, 15, 58, NULL, NULL,
  'https://www.gaggia-na.com/products/gaggia-classic-pro',
  'Gaggia North America, Classic Pro E24 specifications'
),
(
  'sage-bes875', 'Sage', 'Barista Express BES875', 'home', 'thermocoil', 1, 9, 15, 54, 'Low pressure pre-infusion', NULL,
  'https://www.sageappliances.com/en-gb/product/bes875',
  'Sage GB, Barista Express product page'
),
(
  'rancilio-silvia', 'Rancilio', 'Silvia', 'home', 'single-boiler', 0, NULL, NULL, NULL, NULL, NULL,
  'https://www.ranciliogroup.com/rancilio/silvia/silvia/',
  'Rancilio Group, Silvia technical specifications'
),
(
  'rancilio-silvia-pro-x', 'Rancilio', 'Silvia Pro X', 'prosumer', 'dual-boiler', 1, NULL, NULL, NULL, 'Soft infusion', NULL,
  'https://www.ranciliogroup.com/rancilio/silvia-pro-x/silvia-pro-x/',
  'Rancilio Group, Silvia Pro X technical specifications'
),
(
  'profitec-go-2', 'Profitec', 'GO 2.0', 'home', 'single-boiler', 1, NULL, NULL, NULL, 'Selectable preinfusion', NULL,
  'https://www.profitec-espresso.com/en/products/go-2-0',
  'Profitec, GO 2.0 technical data'
),
(
  'lelit-bianca-pl162t', 'Lelit', 'Bianca PL162T', 'prosumer', 'dual-boiler', 1, NULL, NULL, 58, 'Programmable pre-infusion', 1,
  'https://www.lelit.com/wp-content/uploads/2024/09/EN-Bianca.pdf',
  'Lelit, Bianca PL162T product sheet'
),
(
  'lm-linea-micra', 'La Marzocco', 'Linea Micra', 'prosumer', 'dual-boiler', 1, NULL, NULL, NULL, NULL, NULL,
  'https://www.lamarzocco.com/uk/en/wp-content/uploads/2023/04/product_brochure_linea_micra_eng.pdf',
  'La Marzocco UK, Linea Micra brochure'
)
ON CONFLICT (id) DO NOTHING;
