'use server';

import { prisma } from '@fedge/database';
import { revalidatePath } from 'next/cache';

export async function markTaskComplete(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'DONE' }
  });
  
  revalidatePath('/dashboard');
}

export async function updateRightsStatus(rightsId: string, type: 'BMI' | 'MLC' | 'SOUNDEXCHANGE', status: string) {
  const updateData: any = {};
  if (type === 'BMI') updateData.bmiProStatus = status;
  if (type === 'MLC') updateData.mlcStatus = status;
  if (type === 'SOUNDEXCHANGE') updateData.soundExchangeStatus = status;
  
  await prisma.rightsChecklist.update({
    where: { id: rightsId },
    data: updateData
  });
  
  revalidatePath('/dashboard/rights');
}
