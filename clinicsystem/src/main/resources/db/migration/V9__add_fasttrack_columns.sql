-- Add fast-track columns to queue_entries
ALTER TABLE queue_entries
  ADD COLUMN fast_tracked boolean DEFAULT false,
  ADD COLUMN fast_tracked_at timestamp NULL,
  ADD COLUMN fast_track_reason text NULL;
