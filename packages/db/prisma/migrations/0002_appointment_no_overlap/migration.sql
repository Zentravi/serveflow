-- Enable btree_gist for scalar-type GiST exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping active appointments for the same staff member.
-- Only PENDING and CONFIRMED appointments occupy a time slot.
-- CANCELLED, COMPLETED, and NO_SHOW appointments do not block future bookings,
-- matching cancellation and rescheduling behavior.
ALTER TABLE "appointments"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));
