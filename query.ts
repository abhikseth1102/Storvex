import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './app/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const p = await prisma.product.findFirst()
  if (p) {
    await prisma.product.update({
      where: { id: p.id },
      data: { barcode: '1234567890' }
    })
    console.log(`Assigned Barcode '1234567890' to Product: ${p.name}`)
  } else {
    console.log("No products found.")
  }
}

main().finally(() => process.exit(0))
