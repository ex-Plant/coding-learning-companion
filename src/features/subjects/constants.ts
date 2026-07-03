// Sentinel value the subject filter/picker uses for "no subject" (unfiled) items. It rides in the
// `?subjects=` URL list alongside real subject UUIDs and can never collide with one; the query layer
// (applySubjectIdFilter) maps it to `subject_id IS NULL`, which a plain `.in('subject_id', …)` can't
// match.
export const NO_SUBJECT_VALUE = 'none'
export const NO_SUBJECT_LABEL = 'No subject'
