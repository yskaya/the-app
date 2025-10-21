-- 🔗 Link Recipient Wallet to Google Account
-- This script updates the wallet ownership for multi-account testing

-- STEP 1: First, log in with july.skaya.by@gmail.com on the frontend
-- STEP 2: Find your Google user ID in the users database
-- STEP 3: Replace 'YOUR_GOOGLE_USER_ID' below with your actual Google ID
-- STEP 4: Run this SQL in your wallet database

-- Update the recipient wallet to be owned by your Google account
UPDATE "Wallet"
SET "userId" = 'YOUR_GOOGLE_USER_ID'
WHERE "address" = '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d';

-- Verify the update
SELECT "id", "userId", "address", "network", "createdAt"
FROM "Wallet"
WHERE "address" = '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d';

-- EXAMPLE:
-- If your Google ID is: 123456789012345678901
-- UPDATE "Wallet"
-- SET "userId" = '123456789012345678901'
-- WHERE "address" = '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d';

