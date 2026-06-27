/**
 * Check-in Inclusivo — Database Seed
 *
 * Crea datos de demostración para recorrer todos los flujos:
 * - 1 hotel con configuración de lobby tranquilo
 * - 1 staff user (admin)
 * - 4 huéspedes con diferentes preferencias de accesibilidad
 * - 6 reservas en distintos estados del flujo de check-in
 * - Franjas horarias configuradas
 * - Textos de consentimiento en lectura fácil
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean existing data ──────────────────────────────────
  await prisma.auditEvent.deleteMany();
  await prisma.authChallenge.deleteMany();
  await prisma.digitalKey.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.sensitiveData.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.staffUser.deleteMany();
  await prisma.hotelConfig.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.hotel.deleteMany();

  // ─── Hotel ────────────────────────────────────────────────
  const hotel = await prisma.hotel.create({
    data: {
      id: 'hotel-sereno-001',
      name: 'Hotel Sereno Bogotá',
      address: 'Calle 82 #12-15, Zona T',
      city: 'Bogotá',
      country: 'Colombia',
    },
  });
  console.log(`  ✅ Hotel: ${hotel.name}`);

  // ─── Hotel Config ─────────────────────────────────────────
  const timeWindows = [
    { id: 'tw-1', label: '12:00 – 14:00', startTime: '12:00', endTime: '14:00', available: true },
    { id: 'tw-2', label: '14:00 – 16:00', startTime: '14:00', endTime: '16:00', available: true },
    { id: 'tw-3', label: '16:00 – 18:00', startTime: '16:00', endTime: '18:00', available: true },
    { id: 'tw-4', label: '18:00 – 20:00', startTime: '18:00', endTime: '20:00', available: true },
    { id: 'tw-5', label: '20:00 – 22:00', startTime: '20:00', endTime: '22:00', available: false },
  ];

  const consentTexts = [
    {
      version: '1.0',
      easyReadText:
        'Necesitamos algunos de tus datos para el registro.\n\n' +
        '• Tu nombre y correo, para saber quién eres.\n' +
        '• Tu documento, para verificar tu identidad.\n' +
        '• Tus preferencias, para darte la mejor experiencia.\n\n' +
        'Puedes pedir que borremos tus datos en cualquier momento.\n' +
        'No compartimos tus datos con terceros sin tu permiso.',
      fullText:
        'AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES\n\n' +
        'En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, ' +
        'Hotel Sereno Bogotá, identificado con NIT XXXXXXXXX, en calidad de ' +
        'Responsable del Tratamiento de datos personales, solicita su autorización ' +
        'para recolectar, almacenar, usar, circular y suprimir sus datos personales ' +
        'de acuerdo con las finalidades descritas en nuestra Política de Tratamiento ' +
        'de Datos Personales.\n\n' +
        'FINALIDADES: (a) Gestión del proceso de check-in y hospedaje. ' +
        '(b) Personalización de la experiencia del huésped según sus preferencias ' +
        'de accesibilidad. (c) Cumplimiento de obligaciones legales de registro hotelero. ' +
        '(d) Emisión de credenciales digitales de acceso.\n\n' +
        'DERECHOS DEL TITULAR: Usted tiene derecho a conocer, actualizar, rectificar ' +
        'y suprimir sus datos personales. Puede ejercer estos derechos contactándonos ' +
        'en datos@hotelsereno.co o en la recepción del hotel.\n\n' +
        'Sus datos sensibles (documento de identidad, datos biométricos si aplica) ' +
        'recibirán tratamiento reforzado con cifrado y acceso restringido.',
      scopes: ['PERSONAL_DATA', 'IDENTITY_DOCUMENT', 'ACCESSIBILITY_PREFERENCES', 'LOCATION_DATA'],
    },
  ];

  await prisma.hotelConfig.create({
    data: {
      hotelId: hotel.id,
      quietLobbyEnabled: true,
      availableTimeWindows: timeWindows,
      consentTexts: consentTexts,
    },
  });
  console.log('  ✅ Hotel config (quiet lobby ON, 5 time windows)');

  // ─── Staff User ───────────────────────────────────────────
  const staffPassword = await bcrypt.hash('admin123', 10);
  await prisma.staffUser.create({
    data: {
      id: 'staff-001',
      email: 'admin@hotelsereno.co',
      passwordHash: staffPassword,
      name: 'Administrador Sereno',
      role: 'ADMIN',
      hotelId: hotel.id,
    },
  });
  console.log('  ✅ Staff: admin@hotelsereno.co / admin123');

  // ─── Guests ───────────────────────────────────────────────
  const guest1 = await prisma.guest.create({
    data: {
      id: 'guest-001',
      firstName: 'María',
      lastName: 'García López',
      email: 'maria.garcia@email.com',
      phone: '+57 310 123 4567',
      preferredLanguage: 'es',
      accessibilityPreferences: {
        textOnly: true,
        highContrast: false,
        reducedMotion: true,
        screenReader: false,
        preferredChannel: 'text',
      },
    },
  });

  const guest2 = await prisma.guest.create({
    data: {
      id: 'guest-002',
      firstName: 'Carlos',
      lastName: 'Rodríguez Martínez',
      email: 'carlos.rodriguez@email.com',
      phone: '+57 315 987 6543',
      preferredLanguage: 'es',
      accessibilityPreferences: {
        textOnly: true,
        highContrast: true,
        reducedMotion: false,
        screenReader: true,
        preferredChannel: 'text',
      },
    },
  });

  const guest3 = await prisma.guest.create({
    data: {
      id: 'guest-003',
      firstName: 'Ana',
      lastName: 'Moreno Díaz',
      email: 'ana.moreno@email.com',
      preferredLanguage: 'es',
      accessibilityPreferences: {
        textOnly: false,
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        preferredChannel: 'email',
      },
    },
  });

  const guest4 = await prisma.guest.create({
    data: {
      id: 'guest-004',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@email.com',
      phone: '+1 555 123 4567',
      preferredLanguage: 'en',
      accessibilityPreferences: {
        textOnly: true,
        highContrast: false,
        reducedMotion: true,
        screenReader: false,
        preferredChannel: 'text',
      },
    },
  });

  console.log(`  ✅ 4 guests created`);

  // ─── Reservations in different states ─────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const threeDaysOut = new Date(today);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);

  // Reservation 1: Fresh — ready for pre-check-in (link just sent)
  const res1 = await prisma.reservation.create({
    data: {
      id: 'res-001',
      bookingCode: 'SERENO-2024-001',
      guestId: guest1.id,
      hotelId: hotel.id,
      checkInDate: tomorrow,
      checkOutDate: dayAfter,
      status: 'CONFIRMED',
      pmsSource: 'MOCK_OHIP',
    },
  });
  await prisma.checkIn.create({
    data: {
      reservationId: res1.id,
      status: 'INVITADO',
      invitedAt: new Date(),
    },
  });

  // Reservation 2: Data validated, pending time window selection
  const res2 = await prisma.reservation.create({
    data: {
      id: 'res-002',
      bookingCode: 'SERENO-2024-002',
      guestId: guest2.id,
      hotelId: hotel.id,
      checkInDate: tomorrow,
      checkOutDate: dayAfter,
      status: 'PRE_CHECKIN',
      pmsSource: 'MOCK_OHIP',
    },
  });
  await prisma.checkIn.create({
    data: {
      reservationId: res2.id,
      status: 'DATOS_VALIDADOS',
      invitedAt: new Date(Date.now() - 3600000),
      dataValidatedAt: new Date(),
    },
  });

  // Reservation 3: Window selected, pending authentication
  const res3 = await prisma.reservation.create({
    data: {
      id: 'res-003',
      bookingCode: 'SERENO-2024-003',
      guestId: guest3.id,
      hotelId: hotel.id,
      checkInDate: today,
      checkOutDate: tomorrow,
      status: 'PRE_CHECKIN',
      pmsSource: 'MOCK_OHIP',
    },
  });
  await prisma.checkIn.create({
    data: {
      reservationId: res3.id,
      status: 'VENTANA_SELECCIONADA',
      selectedTimeWindow: timeWindows[1],
      invitedAt: new Date(Date.now() - 7200000),
      dataValidatedAt: new Date(Date.now() - 3600000),
      windowSelectedAt: new Date(),
    },
  });

  // Reservation 4: Fully completed check-in
  const res4 = await prisma.reservation.create({
    data: {
      id: 'res-004',
      bookingCode: 'SERENO-2024-004',
      guestId: guest4.id,
      hotelId: hotel.id,
      checkInDate: today,
      checkOutDate: dayAfter,
      roomNumber: '405',
      status: 'CHECKED_IN',
      pmsSource: 'MOCK_OHIP',
    },
  });
  const checkIn4 = await prisma.checkIn.create({
    data: {
      reservationId: res4.id,
      status: 'COMPLETADO',
      selectedTimeWindow: timeWindows[0],
      invitedAt: new Date(Date.now() - 86400000),
      dataValidatedAt: new Date(Date.now() - 82800000),
      windowSelectedAt: new Date(Date.now() - 79200000),
      authenticatedAt: new Date(Date.now() - 7200000),
      keyIssuedAt: new Date(Date.now() - 7100000),
      completedAt: new Date(Date.now() - 3600000),
    },
  });
  await prisma.digitalKey.create({
    data: {
      checkInId: checkIn4.id,
      credential: 'MOCK-KEY-405-' + Date.now().toString(36),
      validFrom: today,
      validUntil: dayAfter,
      status: 'ACTIVE',
      roomNumber: '405',
    },
  });

  // Reservation 5: Future reservation (no check-in yet)
  await prisma.reservation.create({
    data: {
      id: 'res-005',
      bookingCode: 'SERENO-2024-005',
      guestId: guest1.id,
      hotelId: hotel.id,
      checkInDate: threeDaysOut,
      checkOutDate: new Date(threeDaysOut.getTime() + 86400000 * 2),
      status: 'CONFIRMED',
      pmsSource: 'MOCK_OHIP',
    },
  });

  // Reservation 6: Cancelled
  await prisma.reservation.create({
    data: {
      id: 'res-006',
      bookingCode: 'SERENO-2024-006',
      guestId: guest3.id,
      hotelId: hotel.id,
      checkInDate: tomorrow,
      checkOutDate: dayAfter,
      status: 'CANCELLED',
      pmsSource: 'MOCK_OHIP',
    },
  });

  console.log('  ✅ 6 reservations in different states');

  // ─── Consent records ─────────────────────────────────────
  await prisma.consent.create({
    data: {
      guestId: guest2.id,
      version: '1.0',
      accepted: true,
      scope: ['PERSONAL_DATA', 'IDENTITY_DOCUMENT', 'ACCESSIBILITY_PREFERENCES'],
    },
  });
  await prisma.consent.create({
    data: {
      guestId: guest4.id,
      version: '1.0',
      accepted: true,
      scope: ['PERSONAL_DATA', 'IDENTITY_DOCUMENT', 'ACCESSIBILITY_PREFERENCES', 'LOCATION_DATA'],
    },
  });
  console.log('  ✅ 2 consent records');

  // ─── Audit Events ────────────────────────────────────────
  const auditEvents = [
    { type: 'CHECKIN_STARTED', actorId: guest1.id, actorRole: 'GUEST', details: 'Pre-check-in link sent for SERENO-2024-001' },
    { type: 'CHECKIN_STARTED', actorId: guest2.id, actorRole: 'GUEST', details: 'Pre-check-in link sent for SERENO-2024-002' },
    { type: 'DATA_VALIDATED', actorId: guest2.id, actorRole: 'GUEST', details: 'Guest data validated for SERENO-2024-002' },
    { type: 'CHECKIN_STARTED', actorId: guest4.id, actorRole: 'GUEST', details: 'Pre-check-in started for SERENO-2024-004' },
    { type: 'DATA_VALIDATED', actorId: guest4.id, actorRole: 'GUEST', details: 'Data validated for SERENO-2024-004' },
    { type: 'WINDOW_SELECTED', actorId: guest4.id, actorRole: 'GUEST', details: 'Time window 12:00-14:00 selected' },
    { type: 'AUTH_SUCCEEDED', actorId: guest4.id, actorRole: 'GUEST', details: 'OTP authentication successful' },
    { type: 'KEY_ISSUED', actorId: guest4.id, actorRole: 'GUEST', details: 'Digital key issued for room 405' },
    { type: 'CHECKIN_COMPLETED', actorId: guest4.id, actorRole: 'GUEST', details: 'Check-in completed for SERENO-2024-004' },
    { type: 'CONSENT_GIVEN', actorId: guest4.id, actorRole: 'GUEST', details: 'Consent v1.0 accepted' },
    { type: 'QUIET_LOBBY_TOGGLED', actorId: 'staff-001', actorRole: 'ADMIN', details: 'Quiet lobby mode enabled' },
  ];

  for (const event of auditEvents) {
    await prisma.auditEvent.create({ data: event });
  }
  console.log(`  ✅ ${auditEvents.length} audit events`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo credentials:');
  console.log('   Staff login: admin@hotelsereno.co / admin123');
  console.log('   Guest booking codes: SERENO-2024-001 through SERENO-2024-006');
  console.log('   Booking SERENO-2024-001: Ready for full pre-check-in flow');
  console.log('   Booking SERENO-2024-004: Fully completed (with digital key)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
