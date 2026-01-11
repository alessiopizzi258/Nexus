import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runAutomationREACT } from '@/lib/automation';

export async function GET(request: Request) {
  // 1. Sicurezza: Verifica Secret Key (da impostare nel file .env)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Non autorizzato', { status: 401 });
  }

  try {
    const db = await getDb();
    
    // --- AUTO-CLEANUP (Manutenzione Enterprise) ---
    // Rimuove i log più vecchi di 365 giorni per ottimizzare lo spazio e le performance
    const unAnnoFa = new Date();
    unAnnoFa.setFullYear(unAnnoFa.getFullYear() - 1);
    
    const deleteResult = await db.collection('automation_logs').deleteMany({
      created_at: { $lt: unAnnoFa }
    });
    
    // 2. Recupera l'ultima strategia salvata (Brief e Industria)
    const settings = await db.collection('settings').findOne({ id: 'active_campaign' });
    
    // 3. Esegue l'invio del batch (50 email)
    const report = await runAutomationREACT(
      settings?.targetIndustry || 'all', 
      settings?.campaignBrief || 'Presentazione generale servizi Design Lab Studio'
    );

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      logs_cleaned: deleteResult.deletedCount,
      execution_details: report 
    });
  } catch (error: any) {
    console.error("CRON_ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}