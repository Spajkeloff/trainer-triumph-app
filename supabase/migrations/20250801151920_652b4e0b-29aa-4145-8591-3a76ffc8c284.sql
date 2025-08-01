-- Clean up duplicate transactions for Elena Nikolovska
-- Keep only one charge for the trial session and one payment

-- First, let's delete duplicate charges (keep the most recent one)
DELETE FROM transactions 
WHERE id IN (
  'a5b4ab71-dae0-400f-80ad-a597b8c25309', -- Older duplicate charge
  'f019d48d-627d-4e17-8d95-b0afaa4b498a'  -- Future dated charge (wrong date)
);

-- Delete duplicate payments (keep one payment)
DELETE FROM transactions 
WHERE id IN (
  '594b1ec9-a14a-4792-9156-5cb939a52f7a', -- Older payment
  'dc89e65d-f1e7-4033-9d2c-e085886dd89d'  -- Duplicate payment
);

-- Also clean up the payments table to match
DELETE FROM payments 
WHERE client_id = '8c848ed6-5d78-4823-b947-3faeac9220ec' 
AND payment_date = '2025-08-01' 
AND description IN ('Payment for PT Trial Session - 7/31/2025', 'Payment received');