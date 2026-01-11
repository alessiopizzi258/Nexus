import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runAutomationREACT } from '@/lib/automation';

export async function POST(req: Request) {
  try {
    const { targetIndustry, campaignBrief } = await req.json();
    const db = await getDb();

    // 1. Salviamo la configurazione della campagna come "Attiva"
    // Questo permette al Cron Job di leggere i parametri corretti
    await db.collection('settings').updateOne(
      { id: 'active_campaign' },
      { 
        $set: { 
          targetIndustry, 
          campaignBrief,
          updated_at: new Date() 
        } 
      },
      { upsert: true }
    );

    // 2. Facciamo partire il primo batch immediatamente (User Experience)
    const report = await runAutomationREACT(targetIndustry, campaignBrief);

    return NextResponse.json({ 
      success: true, 
      message: "Strategia salvata e primo batch avviato",
      report 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}