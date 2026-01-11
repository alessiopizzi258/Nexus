import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6'); // Allineato al frontend
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || 'all'; // Aggiunto supporto industria
    
    const skip = (page - 1) * limit;
    let query: any = {};

    if (status !== 'all') query.status = status;
    if (industry !== 'all') query.industry = industry;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { "ai_decision.subject": { $regex: search, $options: 'i' } },
        { campaign_name: { $regex: search, $options: 'i' } } // Cerca anche per nome campagna
      ];
    }

    // Esecuzione parallela ottimizzata
    const [history, total] = await Promise.all([
  db.collection('automation_logs')
    .find(query)
    .sort({ created_at: -1 }) // Rimosso .hint() per evitare l'errore 500
    .skip(skip)
    .limit(limit)
    .toArray(),
  db.collection('automation_logs').countDocuments(query)
]);

    return NextResponse.json({
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("❌ API History Error:", error.message);
    return NextResponse.json({ error: "Errore nel recupero dei log." }, { status: 500 });
  }
}