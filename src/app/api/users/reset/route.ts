import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE() {
  try {
    const db = await getDb();
    
    // Eliminiamo solo i profili (i lead caricati), 
    // manteniamo automation_logs per non perdere le statistiche del dashboard
    await db.collection('profiles').deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: "Database lead pulito con successo" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}