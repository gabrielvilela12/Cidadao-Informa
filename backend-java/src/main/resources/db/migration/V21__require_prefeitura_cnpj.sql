UPDATE establishment_applications
   SET document = regexp_replace(coalesce(document, ''), '\D', '', 'g');

ALTER TABLE establishment_applications
    ALTER COLUMN document SET NOT NULL;

ALTER TABLE establishment_applications
    DROP CONSTRAINT IF EXISTS establishment_applications_document_cnpj_check;

ALTER TABLE establishment_applications
    ADD CONSTRAINT establishment_applications_document_cnpj_check
    CHECK (document ~ '^[0-9]{14}$');
