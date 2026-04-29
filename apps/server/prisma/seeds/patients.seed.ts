/**
 * Seed: Pacientes de desenvolvimento.
 *
 * Depende de: clinic.seed (clinicId fixo)
 *
 * Cria 4 pacientes com perfis variados para cobrir cenários de testes:
 *   - Ana (retorno frequente, alérgica)
 *   - Carlos (primeira consulta, jovem)
 *   - Maria (idosa, múltiplas condições)
 *   - João (sem dados opcionais)
 *
 * Run via: ts-node prisma/seeds/patients.seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLINIC_ID = "00000000-0000-0000-0000-000000000010";

const PATIENTS = [
  {
    personId: "00000000-0000-0000-0001-000000000001",
    name: "Ana Beatriz Costa",
    documentId: "111.111.111-11",
    phone: "(11) 98888-1111",
    gender: "FEMALE" as const,
    birthDate: new Date("1990-03-15"),
    email: "ana.costa@email.com",
    emergencyContactName: "João Costa",
    emergencyContactPhone: "(11) 97777-1111",
  },
  {
    personId: "00000000-0000-0000-0001-000000000002",
    name: "Carlos Eduardo Mendes",
    documentId: "222.222.222-22",
    phone: "(11) 98888-2222",
    gender: "MALE" as const,
    birthDate: new Date("2001-07-22"),
    email: "carlos.mendes@email.com",
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
  {
    personId: "00000000-0000-0000-0001-000000000003",
    name: "Maria das Graças Oliveira",
    documentId: "333.333.333-33",
    phone: "(11) 98888-3333",
    gender: "FEMALE" as const,
    birthDate: new Date("1950-11-08"),
    email: null,
    emergencyContactName: "Pedro Oliveira",
    emergencyContactPhone: "(11) 97777-3333",
  },
  {
    personId: "00000000-0000-0000-0001-000000000004",
    name: "João Batista Ferreira",
    documentId: "444.444.444-44",
    phone: null,
    gender: "MALE" as const,
    birthDate: null,
    email: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
  // Pacientes extras para volume/paginação
  {
    personId: "00000000-0000-0000-0001-000000000005",
    name: "Fernanda Lima Souza",
    documentId: "555.555.555-55",
    phone: "(21) 98888-5555",
    gender: "FEMALE" as const,
    birthDate: new Date("1985-06-20"),
    email: "fernanda.souza@email.com",
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
  {
    personId: "00000000-0000-0000-0001-000000000006",
    name: "Rafael Henrique Alves",
    documentId: "666.666.666-66",
    phone: "(31) 98888-6666",
    gender: "MALE" as const,
    birthDate: new Date("1978-09-03"),
    email: "rafael.alves@email.com",
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
  {
    personId: "00000000-0000-0000-0001-000000000007",
    name: "Beatriz Monteiro Ramos",
    documentId: "777.777.777-77",
    phone: "(41) 98888-7777",
    gender: "FEMALE" as const,
    birthDate: new Date("1995-12-11"),
    email: null,
    emergencyContactName: "Cláudio Ramos",
    emergencyContactPhone: "(41) 97777-7777",
  },
  {
    personId: "00000000-0000-0000-0001-000000000008",
    name: "Gustavo Pereira Neto",
    documentId: "888.888.888-88",
    phone: "(51) 98888-8888",
    gender: "MALE" as const,
    birthDate: new Date("1968-04-25"),
    email: "gustavo.neto@email.com",
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
  {
    personId: "00000000-0000-0000-0001-000000000009",
    name: "Patrícia Vasconcelos",
    documentId: "999.999.999-99",
    phone: "(85) 98888-9999",
    gender: "FEMALE" as const,
    birthDate: new Date("1940-02-17"),
    email: null,
    emergencyContactName: "Marcos Vasconcelos",
    emergencyContactPhone: "(85) 97777-9999",
  },
  {
    personId: "00000000-0000-0000-0001-000000000010",
    name: "Thiago Carvalho Brito",
    documentId: "101.010.101-01",
    phone: "(71) 98888-1010",
    gender: "MALE" as const,
    birthDate: new Date("2003-08-14"),
    email: "thiago.brito@email.com",
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
];

export async function main() {
  const now = new Date();

  for (const p of PATIENTS) {
    // Person
    await prisma.person.upsert({
      where: { id: p.personId },
      create: {
        id: p.personId,
        name: p.name,
        phone: p.phone,
        gender: p.gender,
        personType: "NATURAL",
        createdAt: now,
        updatedAt: now,
      },
      update: { name: p.name, updatedAt: now },
    });

    // Patient (id == personId por design do schema)
    await prisma.patient.upsert({
      where: { id: p.personId },
      create: {
        id: p.personId,
        documentId: p.documentId,
        birthDate: p.birthDate,
        email: p.email,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        clinicId: CLINIC_ID,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        birthDate: p.birthDate,
        email: p.email,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        updatedAt: now,
      },
    });

    console.log(`✔ Paciente criado/atualizado: ${p.name}`);
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
