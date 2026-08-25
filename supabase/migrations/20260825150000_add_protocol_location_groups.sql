ALTER TABLE public.protocols
    ADD COLUMN IF NOT EXISTS location_key TEXT;

ALTER TABLE public.protocols
    ADD COLUMN IF NOT EXISTS cause_key TEXT;

UPDATE public.protocols
   SET location_key = trim(regexp_replace(
       lower(translate(
           address,
           'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
           'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
       )),
       '[^a-z0-9]+',
       ' ',
       'g'
   ))
 WHERE location_key IS NULL OR location_key = '';

UPDATE public.protocols
   SET cause_key = concat(
       trim(regexp_replace(
           lower(translate(
               category,
               'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
               'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
           )), '[^a-z0-9]+', ' ', 'g'
       )),
       '|',
       trim(regexp_replace(
           lower(translate(
               split_part(description, ' - ', 1),
               'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
               'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
           )), '[^a-z0-9]+', ' ', 'g'
       ))
   )
 WHERE cause_key IS NULL OR cause_key = '';

UPDATE public.protocols
   SET cause_key = concat('protocol:', id)
 WHERE cause_key IS NULL
    OR cause_key = ''
    OR cause_key !~ '^[^|]+[|][^|]+$';

ALTER TABLE public.protocols
    ALTER COLUMN location_key SET NOT NULL;

ALTER TABLE public.protocols
    ALTER COLUMN cause_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_protocols_location_cause
    ON public.protocols (location_key, cause_key, created_at);
