-- Remove password material (hash, salt and key size) from stored event payloads.
--
-- Until now EventMapper cloned each domain event with structuredClone, which copies every own
-- property. Events that carry a User (USER_SIGNED_UP, USER_CREATED, USER_DELETED and, under
-- oldState/newState, USER_CHANGED) therefore stored user.password in "event"."payload".
-- New events no longer contain it (EventMapper serialises through toJSON()); this cleans the rows
-- written before that fix.
--
-- Rows are kept. Only the "password" key is removed, so the audit trail (who, when, which user)
-- stays intact. Deliberately not filtered by event type: a User may also have been embedded by
-- event types that no longer exist. Idempotent: rows without the key are not touched.
UPDATE "event"
SET "payload" = "payload" #- '{user,password}' #- '{oldState,password}' #- '{newState,password}'
WHERE "payload" #> '{user,password}' IS NOT NULL
   OR "payload" #> '{oldState,password}' IS NOT NULL
   OR "payload" #> '{newState,password}' IS NOT NULL;
