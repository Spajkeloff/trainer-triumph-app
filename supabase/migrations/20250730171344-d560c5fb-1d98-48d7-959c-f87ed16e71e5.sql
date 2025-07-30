-- Clean up duplicate charge transactions for trial sessions
-- Remove charges created by SessionManagementModal (keep the ones from BookSessionModal)
DELETE FROM transactions 
WHERE transaction_type = 'charge' 
AND category = 'session' 
AND description LIKE '%Trial Session - %'
AND created_at > '2025-07-30 17:10:35';