-- Keep scheduling integrity at the database boundary as well as in the
-- application service. The half-open range permits back-to-back appointments
-- (for example, 09:00-10:00 and 10:00-11:00) while rejecting actual overlap.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointment"
    ADD CONSTRAINT "appointment_member_no_time_overlap"
    EXCLUDE USING gist (
        "attended_by_member_id" WITH =,
        tsrange("start_at", "end_at", '[)') WITH &&
    )
    WHERE (
        "deleted_at" IS NULL
        AND "status" NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')
    );

ALTER TABLE "appointment"
    ADD CONSTRAINT "appointment_room_no_time_overlap"
    EXCLUDE USING gist (
        "room_id" WITH =,
        tsrange("start_at", "end_at", '[)') WITH &&
    )
    WHERE (
        "room_id" IS NOT NULL
        AND "deleted_at" IS NULL
        AND "status" NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')
    );
