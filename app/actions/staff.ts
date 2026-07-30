'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function createStaff(formData: FormData) {
  const session = await auth()
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can manage staff')
  }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'ADMIN' | 'CASHIER'

  if (!fullName || !email || !password || !role) {
    throw new Error('All fields are required')
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  })

  if (existingUser) {
    throw new Error('A user with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      tenantId: session.user.tenantId
    }
  })

  revalidatePath('/staff')
  return { success: true }
}

export async function deleteStaff(userId: string) {
  const session = await auth()
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can manage staff')
  }

  if (userId === session.user.id) {
    throw new Error('You cannot delete your own account')
  }

  await prisma.user.delete({
    where: {
      id: userId,
      tenantId: session.user.tenantId
    }
  })

  revalidatePath('/staff')
  return { success: true }
}
