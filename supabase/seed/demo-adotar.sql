-- Passa alguns chamados de demonstração para a SUA conta - GERADO.
--
-- Opcional. Rode depois de demo-dados.sql, trocando o e-mail abaixo pelo da
-- conta com que você vai apresentar. Serve para "Meus Protocolos" e o dashboard
-- do cidadão não abrirem vazios.
--
-- Se o e-mail não existir, o UPDATE não altera nada e não dá erro.

BEGIN;

UPDATE protocols
SET user_id = dono.id,
    requester = dono.full_name
FROM (
    SELECT id, full_name
    FROM users
    WHERE lower(email) = lower('troque-pelo-seu@email.com')
    LIMIT 1
) AS dono
WHERE protocols.id IN (
    'c05e9b8d-c4a9-a988-3b54-b50e81f145dd',
    '56254a0e-a96a-17ae-6db7-38c9b8d0aefb',
    '11738f04-6a33-1763-c726-1524aa766143',
    '04b7520c-b6fe-8702-0ba3-7a0ab12c084e',
    '573036e3-76a1-bcc1-4b6e-829e90bed7f7',
    '4acc87b5-49e5-13b0-0dbc-4c2ba84bfd14',
    'c3b00e24-9f5f-a9d7-dac9-71e9eeece0b7',
    'da3ffc98-1a84-9562-8519-dbebad67823a',
    '715230b3-f106-154b-0961-dd745547d4da'
);

COMMIT;
