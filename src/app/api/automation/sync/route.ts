import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const db = await getDb();
    // Controlliamo solo i log degli ultimi 3 giorni che non sono ancora chiusi
    const treGiorniFa = new Date();
    treGiorniFa.setDate(treGiorniFa.getDate() - 3);

    const logs = await db.collection('automation_logs')
      .find({ 
        status: { $nin: ['opened', 'bounced', 'complained'] },
        created_at: { $gte: treGiorniFa } 
      })
      .limit(100) // Evitiamo di saturare le API di Resend in un colpo solo
      .toArray();

    for (const log of logs) {
      if (log.resend_id) {
        const { data, error } = await resend.emails.get(log.resend_id);
        if (data && !error) {
          await db.collection('automation_logs').updateOne(
            { _id: log._id },
            { $set: { status: data.last_event || 'delivered' } }
          );
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}