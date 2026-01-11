import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  
  // Eseguiamo i conteggi in parallelo per massima velocità
  const [sent, opened, bounced] = await Promise.all([
    db.collection('automation_logs').countDocuments({ status: { $ne: 'failed' } }),
    db.collection('automation_logs').countDocuments({ status: 'opened' }),
    db.collection('automation_logs').countDocuments({ status: 'bounced' })
  ]);

  // Calcolo salute del dominio (Deliverability Rate)
  const deliverabilityRate = sent > 0 
    ? (((sent - bounced) / sent) * 100).toFixed(1) 
    : 100;

  return NextResponse.json({
    sent,
    opened,
    bounced,
    replied: 0, // Implementabile con tracking risposte
    deliverability: deliverabilityRate,
    healthStatus: Number(deliverabilityRate) > 95 ? 'Excellent' : 'Risk'
  });
}