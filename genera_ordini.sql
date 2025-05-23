-- Today's date in SQL format
SET @today = '2025-05-18';
SET @today_giorno = 'dom';

-- ============= ORDERS BY PROFESSORS =============
-- 5 Ordini Classe made by professors (each has their own class)
INSERT INTO OrdineClasse (idResponsabile, data, nTurno, giorno, lastUpdate, confermato, oraRitiro, classe)
VALUES
-- Professor orders (all using turno n=2)
(6, @today, 2, @today_giorno, NOW(), true, '8:35:00', 131),   -- Mario Rossi, class 131
(7, @today, 2, @today_giorno, NOW(), true, '10:40:00', 132),   -- Giuseppe Bianchi, class 132
(8, @today, 2, @today_giorno, NOW(), true, '11:45:00', 133),   -- Andrea Verdi, class 133
(9, @today, 2, @today_giorno, NOW(), true, '11:50:00', 134),   -- Lucia Neri, class 134
(10, @today, 2, @today_giorno, NOW(), true, '16:55:00', 135);  -- Laura Gialli, class 135

-- Get the IDs of the inserted orders for professors
SET @prof_order_1 = LAST_INSERT_ID();
SET @prof_order_2 = @prof_order_1 + 1;
SET @prof_order_3 = @prof_order_1 + 2;
SET @prof_order_4 = @prof_order_1 + 3;
SET @prof_order_5 = @prof_order_1 + 4;

-- Create one OrdineSingolo for each professor's OrdineClasse
INSERT INTO OrdineSingolo (data, nTurno, giorno, confermato, lastUpdate, user, idOrdineClasse)
VALUES
(@today, 2, @today_giorno, true, NOW(), 6, @prof_order_1),
(@today, 2, @today_giorno, true, NOW(), 7, @prof_order_2),
(@today, 2, @today_giorno, true, NOW(), 8, @prof_order_3),
(@today, 2, @today_giorno, true, NOW(), 9, @prof_order_4),
(@today, 2, @today_giorno, true, NOW(), 10, @prof_order_5);

-- Get the IDs of the inserted individual orders for professors
SET @prof_single_order_1 = LAST_INSERT_ID();
SET @prof_single_order_2 = @prof_single_order_1 + 1;
SET @prof_single_order_3 = @prof_single_order_1 + 2;
SET @prof_single_order_4 = @prof_single_order_1 + 3;
SET @prof_single_order_5 = @prof_single_order_1 + 4;

-- Add DettagliOrdineSingolo for each professor's order (what products they ordered)
INSERT INTO DettagliOrdineSingolo (idOrdineSingolo, idProdotto, quantita, preparato)
VALUES
-- Professor 1 order (Mario Rossi)
(@prof_single_order_1, 1, 2, false),  -- Panino al prosciutto
(@prof_single_order_1, 7, 1, false),  -- Acqua naturale

-- Professor 2 order (Giuseppe Bianchi)
(@prof_single_order_2, 4, 1, false),  -- Pizza margherita
(@prof_single_order_2, 9, 1, false),  -- Coca Cola

-- Professor 3 order (Andrea Verdi)
(@prof_single_order_3, 17, 1, true), -- Panino al tonno
(@prof_single_order_3, 8, 1, true),  -- Acqua frizzante

-- Professor 4 order (Lucia Neri)
(@prof_single_order_4, 19, 3, false), -- Insalata mista
(@prof_single_order_4, 11, 1, false), -- Tè alla pesca

-- Professor 5 order (Laura Gialli)
(@prof_single_order_5, 3, 1, false),  -- Focaccia
(@prof_single_order_5, 10, 1, false); -- Fanta

-- ============= ORDERS BY STUDENT CLASSES =============
-- 5 Ordini Classe for student classes (1A, 2A, 3A, 4A, 5A)
-- For student orders, use turno n=0 and n=1, alternating
-- For each class, we'll have 5 individual students ordering
-- Let's select student class representatives as responsabile
-- Note for student orders, oraRitiro is NULL

-- Student classes from the data: 1A=1, 2A=4, 3A=7, 4A=10, 5A=13
INSERT INTO OrdineClasse (idResponsabile, data, nTurno, giorno, lastUpdate, confermato, oraRitiro, classe)
VALUES
-- Student class orders (alternating between turno 0 and 1)
(131, @today, 0, @today_giorno, NOW(), true, NULL, 1),  -- 1A representative, class 1A
(129, @today, 1, @today_giorno, NOW(), true, NULL, 4),  -- 2A representative, class 2A
(127, @today, 0, @today_giorno, NOW(), true, NULL, 7),  -- 3A representative, class 3A
(125, @today, 1, @today_giorno, NOW(), true, NULL, 10), -- 4A representative, class 4A
(123, @today, 0, @today_giorno, NOW(), true, NULL, 13); -- 5A representative, class 5A

-- Get the IDs of the inserted orders for student classes
SET @class_order_1 = LAST_INSERT_ID();
SET @class_order_2 = @class_order_1 + 1;
SET @class_order_3 = @class_order_1 + 2;
SET @class_order_4 = @class_order_1 + 3;
SET @class_order_5 = @class_order_1 + 4;

-- For each student class, create 5 individual orders (OrdineSingolo)
-- Make sure to match the turno with the corresponding OrdineClasse
INSERT INTO OrdineSingolo (data, nTurno, giorno, confermato, lastUpdate, user, idOrdineClasse)
VALUES
-- 1A students (turno 0)
(@today, 0, @today_giorno, true, NOW(), 131, @class_order_1), -- Studente 1 1A
(@today, 0, @today_giorno, true, NOW(), 141, @class_order_1), -- Studente 2 1A
(@today, 0, @today_giorno, true, NOW(), 151, @class_order_1), -- Studente 3 1A
(@today, 0, @today_giorno, true, NOW(), 161, @class_order_1), -- Studente 4 1A
(@today, 0, @today_giorno, true, NOW(), 171, @class_order_1), -- Studente 5 1A

-- 2A students (turno 1)
(@today, 1, @today_giorno, true, NOW(), 129, @class_order_2), -- Studente 1 2A
(@today, 1, @today_giorno, true, NOW(), 139, @class_order_2), -- Studente 2 2A
(@today, 1, @today_giorno, true, NOW(), 149, @class_order_2), -- Studente 3 2A
(@today, 1, @today_giorno, true, NOW(), 159, @class_order_2), -- Studente 4 2A
(@today, 1, @today_giorno, true, NOW(), 169, @class_order_2), -- Studente 5 2A

-- 3A students (turno 0)
(@today, 0, @today_giorno, true, NOW(), 127, @class_order_3), -- Studente 1 3A
(@today, 0, @today_giorno, true, NOW(), 137, @class_order_3), -- Studente 2 3A
(@today, 0, @today_giorno, true, NOW(), 147, @class_order_3), -- Studente 3 3A
(@today, 0, @today_giorno, true, NOW(), 157, @class_order_3), -- Studente 4 3A
(@today, 0, @today_giorno, true, NOW(), 167, @class_order_3), -- Studente 5 3A

-- 4A students (turno 1)
(@today, 1, @today_giorno, true, NOW(), 125, @class_order_4), -- Studente 1 4A
(@today, 1, @today_giorno, true, NOW(), 135, @class_order_4), -- Studente 2 4A
(@today, 1, @today_giorno, true, NOW(), 145, @class_order_4), -- Studente 3 4A
(@today, 1, @today_giorno, true, NOW(), 155, @class_order_4), -- Studente 4 4A
(@today, 1, @today_giorno, true, NOW(), 165, @class_order_4), -- Studente 5 4A

-- 5A students (turno 0)
(@today, 0, @today_giorno, true, NOW(), 123, @class_order_5), -- Studente 1 5A
(@today, 0, @today_giorno, true, NOW(), 133, @class_order_5), -- Studente 2 5A
(@today, 0, @today_giorno, true, NOW(), 143, @class_order_5), -- Studente 3 5A
(@today, 0, @today_giorno, true, NOW(), 153, @class_order_5), -- Studente 4 5A
(@today, 0, @today_giorno, true, NOW(), 163, @class_order_5); -- Studente 5 5A

-- Get the first individual order ID for the student orders
SET @stud_single_order_start = LAST_INSERT_ID();

-- Add DettagliOrdineSingolo for each student's order
INSERT INTO DettagliOrdineSingolo (idOrdineSingolo, idProdotto, quantita, preparato)
VALUES
-- 1A students orders (5 students)
(@stud_single_order_start, 1, 3, false),      -- Studente 1 1A: Panino al prosciutto
(@stud_single_order_start, 7, 1, false),      -- Studente 1 1A: Acqua naturale
(@stud_single_order_start + 1, 2, 1, false),  -- Studente 2 1A: Panino vegetariano
(@stud_single_order_start + 1, 9, 1, false),  -- Studente 2 1A: Coca Cola
(@stud_single_order_start + 2, 16, 2, false), -- Studente 3 1A: Panino al salame
(@stud_single_order_start + 2, 10, 1, false), -- Studente 3 1A: Fanta
(@stud_single_order_start + 3, 4, 1, false),  -- Studente 4 1A: Pizza margherita
(@stud_single_order_start + 3, 12, 2, false), -- Studente 4 1A: Succo di frutta
(@stud_single_order_start + 4, 18, 1, false), -- Studente 5 1A: Toast
(@stud_single_order_start + 4, 11, 1, false), -- Studente 5 1A: Tè alla pesca

-- 2A students orders (5 students)
(@stud_single_order_start + 5, 3, 1, true),  -- Studente 1 2A: Focaccia
(@stud_single_order_start + 5, 8, 1, true),  -- Studente 1 2A: Acqua frizzante
(@stud_single_order_start + 6, 17, 2, true), -- Studente 2 2A: Panino al tonno
(@stud_single_order_start + 6, 7, 1, true),  -- Studente 2 2A: Acqua naturale
(@stud_single_order_start + 7, 4, 1, true),  -- Studente 3 2A: Pizza margherita
(@stud_single_order_start + 7, 9, 1, true),  -- Studente 3 2A: Coca Cola
(@stud_single_order_start + 8, 1, 3, true),  -- Studente 4 2A: Panino al prosciutto
(@stud_single_order_start + 8, 10, 1, true), -- Studente 4 2A: Fanta
(@stud_single_order_start + 9, 22, 1, true), -- Studente 5 2A: Tramezzino
(@stud_single_order_start + 9, 11, 1, true), -- Studente 5 2A: Tè alla pesca

-- 3A students orders (5 students)
(@stud_single_order_start + 10, 29, 1, false), -- Studente 1 3A: Pizza al prosciutto
(@stud_single_order_start + 10, 7, 1, false),  -- Studente 1 3A: Acqua naturale
(@stud_single_order_start + 11, 16, 1, false), -- Studente 2 3A: Panino al salame
(@stud_single_order_start + 11, 8, 1, false),  -- Studente 2 3A: Acqua frizzante
(@stud_single_order_start + 12, 3, 2, false),  -- Studente 3 3A: Focaccia
(@stud_single_order_start + 12, 12, 1, false), -- Studente 3 3A: Succo di frutta
(@stud_single_order_start + 13, 28, 1, false), -- Studente 4 3A: Wrap vegetariano
(@stud_single_order_start + 13, 9, 1, false),  -- Studente 4 3A: Coca Cola
(@stud_single_order_start + 14, 18, 4, false), -- Studente 5 3A: Toast
(@stud_single_order_start + 14, 14, 1, false), -- Studente 5 3A: Patatine

-- 4A students orders (5 students)
(@stud_single_order_start + 15, 17, 1, false), -- Studente 1 4A: Panino al tonno
(@stud_single_order_start + 15, 10, 1, false), -- Studente 1 4A: Fanta
(@stud_single_order_start + 16, 4, 5, false),  -- Studente 2 4A: Pizza margherita
(@stud_single_order_start + 16, 7, 1, false),  -- Studente 2 4A: Acqua naturale
(@stud_single_order_start + 17, 22, 1, false), -- Studente 3 4A: Tramezzino
(@stud_single_order_start + 17, 8, 1, false),  -- Studente 3 4A: Acqua frizzante
(@stud_single_order_start + 18, 19, 3, false), -- Studente 4 4A: Insalata mista
(@stud_single_order_start + 18, 20, 1, false), -- Studente 4 4A: Frutta fresca
(@stud_single_order_start + 19, 1, 1, false),  -- Studente 5 4A: Panino al prosciutto
(@stud_single_order_start + 19, 9, 1, false),  -- Studente 5 4A: Coca Cola

-- 5A students orders (5 students)
(@stud_single_order_start + 20, 2, 1, true),  -- Studente 1 5A: Panino vegetariano
(@stud_single_order_start + 20, 11, 1, true), -- Studente 1 5A: Tè alla pesca
(@stud_single_order_start + 21, 18, 1, true), -- Studente 2 5A: Toast
(@stud_single_order_start + 21, 12, 2, true), -- Studente 2 5A: Succo di frutta
(@stud_single_order_start + 22, 4, 1, true),  -- Studente 3 5A: Pizza margherita
(@stud_single_order_start + 22, 9, 1, true),  -- Studente 3 5A: Coca Cola
(@stud_single_order_start + 23, 32, 2, true), -- Studente 4 5A: Panino salame
(@stud_single_order_start + 23, 33, 2, true), -- Studente 4 5A: Acqua naturale
(@stud_single_order_start + 24, 20, 1, true), -- Studente 5 5A: Frutta fresca
(@stud_single_order_start + 24, 21, 1, true); -- Studente 5 5A: Yogurt alla frutta

-- Add QR codes for all orders
-- For professor orders (gestione 1 - order 1, 2, 4 and gestione 2 - order 3, 5)
INSERT INTO QrCode (token, idOrdineClasse, gestore, preparato)
VALUES
-- Gestione 1 (3 orders)
(MD5(CONCAT('order-', @prof_order_1)), @prof_order_1, 1, false),  -- Mario Rossi - not prepared
(MD5(CONCAT('order-', @prof_order_2)), @prof_order_2, 1, false),  -- Giuseppe Bianchi - not prepared
(MD5(CONCAT('order-', @prof_order_4)), @prof_order_4, 1, false),  -- Lucia Neri - not prepared

-- Gestione 2 (2 orders)
(MD5(CONCAT('order-', @prof_order_3)), @prof_order_3, 2, true),   -- Andrea Verdi - prepared
(MD5(CONCAT('order-', @prof_order_5)), @prof_order_5, 2, false);  -- Laura Gialli - not prepared

-- For student class orders
INSERT INTO QrCode (token, idOrdineClasse, gestore, preparato)
VALUES
-- Gestione 1 (3 classes)
(MD5(CONCAT('class-', @class_order_1)), @class_order_1, 1, false),  -- 1A - not prepared
(MD5(CONCAT('class-', @class_order_3)), @class_order_3, 1, false),  -- 3A - not prepared
(MD5(CONCAT('class-', @class_order_5)), @class_order_5, 1, true),   -- 5A - prepared

-- Gestione 2 (2 classes)
(MD5(CONCAT('class-', @class_order_2)), @class_order_2, 2, true),   -- 2A - prepared
(MD5(CONCAT('class-', @class_order_4)), @class_order_4, 2, false);  -- 4A - not prepared