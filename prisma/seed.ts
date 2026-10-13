import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting comprehensive Review 3 database seeding...')

  // 1. Setup Tenant with GSTIN & PAN for Thermal Receipts
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'storvex-flagship' },
    update: {
      gstin: '27AABCS1429B1Z5',
      pan: 'AABCS1429B',
      address: '100 Innovation Way, Commercial Retail Plaza',
      phone: '+91-98201-55199',
    },
    create: {
      name: 'Storvex Flagship Retail',
      slug: 'storvex-flagship',
      gstin: '27AABCS1429B1Z5',
      pan: 'AABCS1429B',
      address: '100 Innovation Way, Commercial Retail Plaza',
      phone: '+91-98201-55199',
    },
  })
  console.log(`✅ Tenant Ready: ${tenant.name} (GSTIN: ${tenant.gstin})`)

  // 2. Setup Admin & Cashier Users (RBAC Demo)
  const adminHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@storvex.com' },
    update: { password: adminHash, role: 'ADMIN' },
    create: {
      tenantId: tenant.id,
      email: 'admin@storvex.com',
      password: adminHash,
      fullName: 'Store Manager Admin',
      role: 'ADMIN',
    },
  })

  const cashierHash = await bcrypt.hash('cashier123', 10)
  await prisma.user.upsert({
    where: { email: 'cashier@storvex.com' },
    update: { password: cashierHash, role: 'CASHIER' },
    create: {
      tenantId: tenant.id,
      email: 'cashier@storvex.com',
      password: cashierHash,
      fullName: 'Rohan Sharma (Counter 1)',
      role: 'CASHIER',
    },
  })
  console.log(`✅ Seeded Staff: admin@storvex.com (ADMIN) & cashier@storvex.com (CASHIER)`)

  // 3. Setup Categories
  const categoryNames = ['Electronics', 'Apparel', 'Footwear', 'Accessories', 'Ethnic Wear']
  const categories: Record<string, { id: string; name: string }> = {}
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // 4. Setup 11 Products (including 2 Low-Stock items for Alert & AI Copilot Demo)
  const productsToSeed = [
    {
      name: 'Sony WH-1000XM5',
      sku: 'ELEC-SNY-001',
      barcode: 'ELEC-SNY-001',
      brand: 'Sony',
      costPrice: 18500,
      sellingRate: 24990,
      wholesaleRate: 21500,
      gstRate: 18,
      stockQty: 28,
      hsnCode: '85183000',
      categoryId: categories['Electronics'].id,
    },
    {
      name: 'MacBook Pro M3',
      sku: 'ELEC-MAC-002',
      barcode: 'ELEC-MAC-002',
      brand: 'Apple',
      costPrice: 118000,
      sellingRate: 149900,
      wholesaleRate: 136000,
      gstRate: 18,
      stockQty: 4, // Low stock (<5) for alert demo!
      hsnCode: '84713010',
      categoryId: categories['Electronics'].id,
    },
    {
      name: 'Keychron K2 Mechanical Keyboard',
      sku: 'ELEC-KEY-003',
      barcode: 'ELEC-KEY-003',
      brand: 'Keychron',
      costPrice: 5200,
      sellingRate: 8499,
      wholesaleRate: 6999,
      gstRate: 18,
      stockQty: 19,
      hsnCode: '84716040',
      categoryId: categories['Electronics'].id,
    },
    {
      name: 'Premium Cotton T-Shirt',
      sku: 'APP-TSH-001',
      barcode: 'APP-TSH-001',
      brand: 'Essentials',
      size: 'L',
      color: 'Ivory',
      costPrice: 450,
      sellingRate: 999,
      wholesaleRate: 699,
      gstRate: 5,
      stockQty: 85,
      hsnCode: '61091000',
      categoryId: categories['Apparel'].id,
    },
    {
      name: 'Classic Denim Jacket',
      sku: 'APP-JAC-002',
      barcode: 'APP-JAC-002',
      brand: 'Levi',
      size: 'M',
      color: 'Indigo',
      costPrice: 1650,
      sellingRate: 3299,
      wholesaleRate: 2450,
      gstRate: 12,
      stockQty: 32,
      hsnCode: '62019200',
      categoryId: categories['Apparel'].id,
    },
    {
      name: 'Royal Pashmina Embroidered Shawl',
      sku: 'ETH-PAS-001',
      barcode: 'ETH-PAS-001',
      brand: 'Kashmir Loom',
      size: 'Free',
      color: 'Crimson Gold',
      costPrice: 2800,
      sellingRate: 5499,
      wholesaleRate: 4100,
      gstRate: 12,
      stockQty: 3, // Low stock (<5) for alert demo!
      hsnCode: '62142010',
      categoryId: categories['Ethnic Wear'].id,
    },
    {
      name: 'Chanderi Silk Kurta Set',
      sku: 'ETH-CHD-002',
      barcode: 'ETH-CHD-002',
      brand: 'Fabindia',
      size: 'M',
      color: 'Emerald',
      costPrice: 1900,
      sellingRate: 3899,
      wholesaleRate: 2950,
      gstRate: 12,
      stockQty: 24,
      hsnCode: '62041910',
      categoryId: categories['Ethnic Wear'].id,
    },
    {
      name: 'Nike Air Force 1',
      sku: 'FOOT-NK-001',
      barcode: 'FOOT-NK-001',
      brand: 'Nike',
      size: 'UK 9',
      color: 'White',
      costPrice: 4800,
      sellingRate: 7995,
      wholesaleRate: 6400,
      gstRate: 18,
      stockQty: 42,
      hsnCode: '64039990',
      categoryId: categories['Footwear'].id,
    },
    {
      name: 'Running Sneakers Pro',
      sku: 'FOOT-RSP-002',
      barcode: 'FOOT-RSP-002',
      brand: 'Adidas',
      size: 'UK 8',
      color: 'Core Black',
      costPrice: 2900,
      sellingRate: 5299,
      wholesaleRate: 4100,
      gstRate: 18,
      stockQty: 55,
      hsnCode: '64041190',
      categoryId: categories['Footwear'].id,
    },
    {
      name: 'Handcrafted Leather Wallet',
      sku: 'ACC-WAL-001',
      barcode: 'ACC-WAL-001',
      brand: 'Bellroy',
      color: 'Tan Brown',
      costPrice: 850,
      sellingRate: 1999,
      wholesaleRate: 1399,
      gstRate: 18,
      stockQty: 64,
      hsnCode: '42023120',
      categoryId: categories['Accessories'].id,
    },
    {
      name: 'Minimalist Sapphire Watch',
      sku: 'ACC-WAT-002',
      barcode: 'ACC-WAT-002',
      brand: 'Titan Edge',
      color: 'Rose Gold',
      costPrice: 4200,
      sellingRate: 7499,
      wholesaleRate: 5800,
      gstRate: 18,
      stockQty: 15,
      hsnCode: '91021100',
      categoryId: categories['Accessories'].id,
    },
  ]

  const productMap: Record<string, any> = {}
  for (const prod of productsToSeed) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenant.id, sku: prod.sku },
    })
    if (existing) {
      productMap[prod.sku] = await prisma.product.update({
        where: { id: existing.id },
        data: { ...prod, tenantId: tenant.id },
      })
    } else {
      productMap[prod.sku] = await prisma.product.create({
        data: { ...prod, tenantId: tenant.id },
      })
    }
  }
  console.log(`✅ Seeded ${productsToSeed.length} Products (with 2 low-stock alert items)`)

  // 5. Setup Registered Customers (Retail + B2B Wholesale + Net-15 Store Credit)
  const customersData = [
    {
      name: 'Ananya Deshmukh',
      phone: '9820411290',
      city: 'Mumbai',
      loyaltyPoints: 420,
      balance: 0,
    },
    {
      name: 'Vogue Lifestyle Boutique (B2B)',
      phone: '9811234901',
      city: 'Pune',
      companyName: 'Vogue Lifestyle Pvt Ltd',
      gstin: '27AAACV8921K1Z2',
      billingAddress: '42 FC Road, Pune',
      loyaltyPoints: 1250,
      balance: 14500, // Active Net-15 Store Credit Receivable!
    },
    {
      name: 'Vikramaditya Nair',
      phone: '9765098123',
      city: 'Bengaluru',
      loyaltyPoints: 180,
      balance: 3299, // Active Store Credit!
    },
    {
      name: 'Meera Textiles & Co. (B2B)',
      phone: '9920876512',
      city: 'Surat',
      companyName: 'Meera Textiles LLP',
      gstin: '24AABFM4412N1Z9',
      billingAddress: 'Ring Road Textile Market, Surat',
      loyaltyPoints: 890,
      balance: 0,
    },
  ]

  const customerMap: Record<string, any> = {}
  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, name: c.name },
    })
    if (existing) {
      customerMap[c.name] = await prisma.customer.update({
        where: { id: existing.id },
        data: c,
      })
    } else {
      customerMap[c.name] = await prisma.customer.create({
        data: { ...c, tenantId: tenant.id },
      })
    }
  }
  console.log(`✅ Seeded ${customersData.length} CRM Customers`)

  // 6. Setup Suppliers & Purchase Orders (Procurement Module)
  const suppliersData = [
    {
      name: 'Arvind Mills & Apparel Distributors',
      contactName: 'Rajesh Parekh',
      email: 'orders@arvinddistributors.in',
      phone: '9825011223',
      address: 'Naroda Road, Ahmedabad',
      gstin: '24AAACA5511B1Z4',
      balance: 28000,
    },
    {
      name: 'Redington Tech & Audio India',
      contactName: 'Siddharth Menon',
      email: 'b2b@redingtontech.in',
      phone: '9840099881',
      address: 'Guindy Industrial Estate, Chennai',
      gstin: '33AAACR1188E1Z1',
      balance: 0,
    },
  ]

  const supplierMap: Record<string, any> = {}
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { tenantId: tenant.id, name: s.name },
    })
    if (existing) {
      supplierMap[s.name] = await prisma.supplier.update({
        where: { id: existing.id },
        data: s,
      })
    } else {
      supplierMap[s.name] = await prisma.supplier.create({
        data: { ...s, tenantId: tenant.id },
      })
    }
  }

  // Create 1 ISSUED Purchase Order ready to click "Receive Goods" in the live review!
  const existingPo = await prisma.purchaseOrder.findFirst({
    where: { tenantId: tenant.id, poNumber: 'PO-2026-901' },
  })
  if (!existingPo) {
    const pashmina = productMap['ETH-PAS-001']
    const denim = productMap['APP-JAC-002']
    await prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplierMap['Arvind Mills & Apparel Distributors'].id,
        poNumber: 'PO-2026-901',
        status: 'ISSUED',
        totalAmount: 15 * 2800 + 20 * 1650,
        items: {
          create: [
            {
              productId: pashmina.id,
              quantity: 15,
              unitCost: 2800,
              gstAmount: 0,
              totalCost: 42000,
            },
            {
              productId: denim.id,
              quantity: 20,
              unitCost: 1650,
              gstAmount: 0,
              totalCost: 33000,
            },
          ],
        },
      },
    })
  }
  console.log(`✅ Seeded Suppliers & Active Purchase Order (PO-2026-901)`)

  // 7. Setup General Ledger Accounts (Cash Drawer & Bank Account)
  let cashAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, type: 'CASH' },
  })
  if (!cashAccount) {
    cashAccount = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Cash Drawer',
        type: 'CASH',
        balance: 48500,
      },
    })
  }

  let bankAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, type: 'BANK' },
  })
  if (!bankAccount) {
    bankAccount = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        name: 'HDFC Corporate Bank & UPI',
        type: 'BANK',
        balance: 184900,
      },
    })
  }

  // 8. Seed Sample Historical Invoices if none exist yet so Analytics Charts are rich
  const invoiceCount = await prisma.saleInvoice.count({ where: { tenantId: tenant.id } })
  if (invoiceCount < 3) {
    const now = new Date()
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

    const sampleInvoices = [
      {
        invoiceNumber: 'INV-881024',
        customerId: customerMap['Ananya Deshmukh'].id,
        grossAmount: 24990,
        gstAmount: 4498,
        discountAmt: 488,
        netAmount: 29000,
        paymentMode: 'CARD' as const,
        paidCard: 29000,
        isB2b: false,
        createdAt: daysAgo(4),
        item: {
          productId: productMap['ELEC-SNY-001'].id,
          quantity: 1,
          unitRate: 24990,
          gstRate: 18,
          gstAmount: 4498,
          totalPrice: 24990,
        },
      },
      {
        invoiceNumber: 'INV-881092',
        customerId: customerMap['Vogue Lifestyle Boutique (B2B)'].id,
        grossAmount: 24500,
        gstAmount: 2940,
        discountAmt: 440,
        netAmount: 27000,
        paymentMode: 'SPLIT' as const,
        paidCash: 12500,
        paidCredit: 14500,
        isB2b: true,
        dueDate: daysAgo(-11),
        createdAt: daysAgo(2),
        item: {
          productId: productMap['APP-JAC-002'].id,
          quantity: 10,
          unitRate: 2450,
          gstRate: 12,
          gstAmount: 2940,
          totalPrice: 24500,
        },
      },
      {
        invoiceNumber: 'INV-881145',
        customerId: customerMap['Vikramaditya Nair'].id,
        grossAmount: 11894,
        gstAmount: 1906,
        discountAmt: 300,
        netAmount: 13500,
        paymentMode: 'UPI' as const,
        paidCard: 13500,
        isB2b: false,
        createdAt: daysAgo(1),
        item: {
          productId: productMap['FOOT-NK-001'].id,
          quantity: 1,
          unitRate: 7995,
          gstRate: 18,
          gstAmount: 1439,
          totalPrice: 7995,
        },
      },
    ]

    for (const inv of sampleInvoices) {
      const created = await prisma.saleInvoice.create({
        data: {
          tenantId: tenant.id,
          customerId: inv.customerId,
          invoiceNumber: inv.invoiceNumber,
          grossAmount: inv.grossAmount,
          gstAmount: inv.gstAmount,
          discountAmt: inv.discountAmt,
          netAmount: inv.netAmount,
          paymentMode: inv.paymentMode,
          paidCash: inv.paidCash || 0,
          paidCard: inv.paidCard || 0,
          paidCredit: inv.paidCredit || 0,
          isB2b: inv.isB2b,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          items: {
            create: [inv.item],
          },
        },
      })

      await prisma.ledgerTransaction.create({
        data: {
          tenantId: tenant.id,
          accountId: inv.paymentMode === 'SPLIT' ? cashAccount.id : bankAccount.id,
          type: 'CREDIT',
          amount: inv.netAmount,
          description: `${inv.paymentMode} Sale ${inv.invoiceNumber}`,
          referenceId: created.id,
          createdAt: inv.createdAt,
        },
      })
    }
    console.log(`✅ Seeded Historical Sales Invoices & Double-Entry Ledger Transactions`)
  }

  console.log('🎉 Review 3 360° Database Seeding Complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
