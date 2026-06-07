import { PrismaClient, Role, TipoUnidade } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  // Unidade
  const unidade = await prisma.unidade.upsert({
    where: { id: 'unidade-demo-001' },
    update: {},
    create: {
      id: 'unidade-demo-001',
      name: 'CMEI Trilhas da Infância',
      type: TipoUnidade.cmei,
      address: 'Rua das Flores, 123 - Curitiba/PR',
    },
  })

  // Users
  const sme = await prisma.user.upsert({
    where: { email: 'sme@trilhas.edu.br' },
    update: {},
    create: { name: 'SME Municipal', email: 'sme@trilhas.edu.br', passwordHash: hash('Trilhas@2026'), role: Role.sme },
  })

  const coord = await prisma.user.upsert({
    where: { email: 'coord@trilhas.edu.br' },
    update: {},
    create: { name: 'Ana Coordenadora', email: 'coord@trilhas.edu.br', passwordHash: hash('Trilhas@2026'), role: Role.coordenador },
  })

  const diretora = await prisma.user.upsert({
    where: { email: 'diretora@trilhas.edu.br' },
    update: {},
    create: { name: 'Maria Diretora', email: 'diretora@trilhas.edu.br', passwordHash: hash('Trilhas@2026'), role: Role.diretora },
  })

  const prof = await prisma.user.upsert({
    where: { email: 'prof@trilhas.edu.br' },
    update: {},
    create: { name: 'Beatriz Professora', email: 'prof@trilhas.edu.br', passwordHash: hash('Trilhas@2026'), role: Role.professor },
  })

  const corregente = await prisma.user.upsert({
    where: { email: 'corregente@trilhas.edu.br' },
    update: {},
    create: { name: 'Carla Corregente', email: 'corregente@trilhas.edu.br', passwordHash: hash('Trilhas@2026'), role: Role.corregente },
  })

  // Vincular coord e diretora à unidade
  await prisma.unidadeUser.upsert({
    where: { unidadeId_userId: { unidadeId: unidade.id, userId: coord.id } },
    update: {},
    create: { unidadeId: unidade.id, userId: coord.id },
  })
  await prisma.unidadeUser.upsert({
    where: { unidadeId_userId: { unidadeId: unidade.id, userId: diretora.id } },
    update: {},
    create: { unidadeId: unidade.id, userId: diretora.id },
  })

  // Turma
  const turma = await prisma.turma.upsert({
    where: { id: 'turma-demo-001' },
    update: {},
    create: { id: 'turma-demo-001', name: 'Maternal II - A', year: 2026, unidadeId: unidade.id },
  })

  // Vínculo professor → turma
  await prisma.professorTurma.upsert({
    where: { id: 'vinculo-demo-001' },
    update: {},
    create: { id: 'vinculo-demo-001', professorId: prof.id, turmaId: turma.id, tipoVinculo: 'regente' },
  })

  // Alunos demo
  const alunos = ['Sofia Almeida', 'Pedro Henrique', 'Isabela Costa', 'Lucas Ferreira', 'Valentina Souza']
  for (const [i, name] of alunos.entries()) {
    await prisma.aluno.upsert({
      where: { id: `aluno-demo-00${i + 1}` },
      update: {},
      create: { id: `aluno-demo-00${i + 1}`, name, turmaId: turma.id, birthDate: new Date(`2021-0${i + 1}-15`) },
    })
  }

  console.log('✅ Seed concluído!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('  SME:         sme@trilhas.edu.br       / Trilhas@2026')
  console.log('  Coordenador: coord@trilhas.edu.br     / Trilhas@2026')
  console.log('  Diretora:    diretora@trilhas.edu.br  / Trilhas@2026')
  console.log('  Professor:   prof@trilhas.edu.br      / Trilhas@2026')
  console.log('  Corregente:  corregente@trilhas.edu.br/ Trilhas@2026')
}

main().catch(console.error).finally(() => prisma.$disconnect())
