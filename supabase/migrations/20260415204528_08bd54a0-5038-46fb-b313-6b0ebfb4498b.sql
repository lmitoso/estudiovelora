
UPDATE conversations 
SET lead_id = (SELECT id FROM leads WHERE email = 'teste-boasvindas@velora.com' LIMIT 1)
WHERE whatsapp_number = '+5598991722040' 
  AND lead_id IS NULL;
