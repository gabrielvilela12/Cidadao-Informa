ALTER TABLE users
    ADD COLUMN IF NOT EXISTS residence_city TEXT,
    ADD COLUMN IF NOT EXISTS residence_state TEXT;

CREATE INDEX IF NOT EXISTS ix_users_residence_location
    ON users (residence_state, residence_city);

UPDATE users AS citizen
   SET residence_city = establishment.city,
       residence_state = UPPER(establishment.state)
  FROM establishments AS establishment
 WHERE citizen.establishment_id = establishment.id
   AND (citizen.residence_city IS NULL OR citizen.residence_state IS NULL);

UPDATE users
   SET residence_city = 'Ribeirao Preto',
       residence_state = 'SP',
       establishment_id = 'est-demo-ribeirao-preto'
 WHERE cpf = '11122233344'
   AND role = 'citizen';
