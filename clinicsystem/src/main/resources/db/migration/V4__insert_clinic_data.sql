-- V4__insert_clinic_data.sql
-- Import 10 GP clinics and 10 Specialist clinics for testing
-- TODO: Add remaining 90 GP and 90 Specialist clinics after testing

-- ===== GP CLINICS (Primary Care Network) =====

-- GP Clinic 1: 57 MEDICAL CLINIC (GEYLANG BAHRU)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (GEYLANG BAHRU)', 'GP', '57 GEYLANG BAHRU #01-3505, SINGAPORE 330057', '66947078', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 2: 57 MEDICAL CLINIC (KALLANG AIRPORT)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (KALLANG AIRPORT)', 'GP', '32 CASSIA CRESCENT #01-62, SINGAPORE 390032', '65189262', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 3: 57 MEDICAL CLINIC (PARKWAY CENTRE)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (PARKWAY CENTRE)', 'GP', '1 MARINE PARADE CENTRAL #02-05 PARKWAY CENTRE, SINGAPORE 449408', '62149612', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 4: 57 MEDICAL CLINIC (PEK KIO)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (PEK KIO)', 'GP', '41 CAMBRIDGE ROAD #01-17, SINGAPORE 210041', '65399237', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 5: 57 MEDICAL CLINIC (WOODLANDS)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (WOODLANDS)', 'GP', '166 WOODLANDS STREET 13 #01-533, SINGAPORE 730166', '65399236', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 6: 57 MEDICAL CLINIC (YISHUN)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('57 MEDICAL CLINIC (YISHUN)', 'GP', '618 YISHUN RING ROAD #01-3238, SINGAPORE 760618', '62353490', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 7: 888 PLAZA FAMILY CLINIC
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('888 PLAZA FAMILY CLINIC', 'GP', '888 WOODLANDS DRIVE 50 #01-739 888 PLAZA, SINGAPORE 730888', '63688762', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 8: ACUMED MEDICAL GROUP
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('ACUMED MEDICAL GROUP', 'GP', '111 WOODLANDS STREET 13 #01-78, SINGAPORE 730111', '63627789', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 9: ACUMED MEDICAL GROUP (TAMPINES)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('ACUMED MEDICAL GROUP (TAMPINES)', 'GP', '801 TAMPINES AVENUE 4 #01-269 TAMPINES POLYVIEW, SINGAPORE 520801', '62231070', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);

-- GP Clinic 10: ACUMED MEDICAL GROUP (BOON LAY)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, pcn_network, operating_hours, appt_interval, num_rooms)
VALUES ('ACUMED MEDICAL GROUP (BOON LAY)', 'GP', '301 BOON LAY WAY #01-18/19 BOON LAY MRT STATION, SINGAPORE 649846', '65159919', 'CENTRAL', 'ASSURANCE PCN', '0900-1300, 1400-1700', 30, 2);


-- ===== SPECIALIST CLINICS =====

-- Specialist Clinic 1: CH POH DIGESTIVE & LIVER CLINIC PTE LTD
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('CH POH DIGESTIVE & LIVER CLINIC PTE LTD', 'SPECIALIST', '38  IRRAWADDY ROAD  #09-46  MOUNT ELIZABETH NOVENA  SINGAPORE 329563', '66946988', 'CENTRAL', 'GASTROENTEROLOGY', '0830 - 1300, 1300 - 1700', 45, 3);

-- Specialist Clinic 2: ISLAND ORTHOPAEDIC CONSULTANTS PTE LTD (MT E NOVENA)
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('ISLAND ORTHOPAEDIC CONSULTANTS PTE LTD (MT E NOVENA)', 'SPECIALIST', '38  IRRAWADDY ROAD  #05-42  MOUNT ELIZABETH NOVENA SPECIALIST CENTRE  SINGAPORE 329563', '63520529', 'CENTRAL', 'ORTHOPAEDIC', '0900 - 1300, 1300 - 1700', 45, 3);

-- Specialist Clinic 3: SLEEP CLINIC SERVICES PTE LTD
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('SLEEP CLINIC SERVICES PTE LTD', 'SPECIALIST', '38  IRRAWADDY ROAD  #05-46/47  MOUNT ELIZABETH NOVENA SPECIALIST CENTRE  SINGAPORE 329563', '69331351', 'CENTRAL', 'RESPIRATORY MEDICINE', '0830 - 1300, 1300 - 1730', 45, 3);

-- Specialist Clinic 4: THE EYE CLINIC
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('THE EYE CLINIC', 'SPECIALIST', '38  IRRAWADDY ROAD  #06-08  MOUNT ELIZABETH NOVENA SPECIALIST CENTRE  SINGAPORE 329563', '69336288', 'CENTRAL', 'OPHTHALMOLOGY', '0830 - 1300, 1400 - 1800', 45, 3);

-- Specialist Clinic 5: HEARTBEAT @ MOUNT ELIZABETH
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('HEARTBEAT @ MOUNT ELIZABETH', 'SPECIALIST', '3 MOUNT ELIZABETH  #17-05  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67338755', 'CENTRAL', 'CARDIOLOGY', '0830 - 1300, 1400 - 1700', 45, 3);

-- Specialist Clinic 6: CAMRY CLINIC
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('CAMRY CLINIC', 'SPECIALIST', '3 MOUNT ELIZABETH  #14-14  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67375669', 'CENTRAL', 'DERMATOLOGY', '0900 - 1300, 1400 - 1700', 45, 3);

-- Specialist Clinic 7: SINGAPORE PAINCARE CENTER
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('SINGAPORE PAINCARE CENTER', 'SPECIALIST', '3 MOUNT ELIZABETH  #11-12  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67376697', 'CENTRAL', 'ANAESTHESIOLOGY', '0900 - 1300, 1400 - 1800', 45, 3);

-- Specialist Clinic 8: LEE PLASTIC SURGERY & LASER CENTRE
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('LEE PLASTIC SURGERY & LASER CENTRE', 'SPECIALIST', '3 MOUNT ELIZABETH  #03-05  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67370777', 'CENTRAL', 'PLASTIC SURGERY', '0900 - 1300, 1400 - 1700', 45, 3);

-- Specialist Clinic 9: THE PAIN RELIEF PRACTICE
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('THE PAIN RELIEF PRACTICE', 'SPECIALIST', '3 MOUNT ELIZABETH  #12-01  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67349500', 'CENTRAL', 'PAIN MANAGEMENT', '0830 - 1230, 1330 - 1730', 45, 3);

-- Specialist Clinic 10: COVE SURGICAL
INSERT INTO clinic (name, clinic_type, address, telephone_number, location, specialty, operating_hours, appt_interval, num_rooms)
VALUES ('COVE SURGICAL', 'SPECIALIST', '3 MOUNT ELIZABETH  #12-03  MOUNT ELIZABETH MEDICAL CENTRE  SINGAPORE 228510', '67334448', 'CENTRAL', 'GENERAL SURGERY', '0900 - 1300, 1400 - 1700', 45, 3);