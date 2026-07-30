import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs' // 1. Import bcrypt

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'storvex-flagship' },
    update: {},
    create: {
      name: 'Storvex Flagship Retail',
      slug: 'storvex-flagship',
      address: '100 Innovation Way, Tech District',
      phone: '+1-555-0199',
    },
  })
  console.log(`✅ Created Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Hash the password before saving it to the database
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@storvex.com' },
    update: {
      password: hashedPassword, // Updates existing seed user with real hash
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@storvex.com',
      password: hashedPassword,
      fullName: 'Store Manager Admin',
      role: 'ADMIN',
    },
  })
  console.log(`✅ Created Admin User: ${admin.fullName} (Password: admin123)`)

  const categories = ['Apparel', 'Footwear', 'Accessories', 'Electronics']
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    })
  }
  console.log(`✅ Seeded ${categories.length} product categories!`)
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })