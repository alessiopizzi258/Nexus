/*
Serve per caricare le liste
*/ 

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { leads } = await req.json();
    const db = await getDb();

    // Creiamo operazioni "upsert": se l'email esiste già, aggiorna; se no, crea.
    const operations = leads.map((lead: any) => ({
    updateOne: {
        filter: { email: lead.email?.trim().toLowerCase() },
        update: { 
        $set: { 
            full_name: lead.full_name || '',
            industry: lead.industry || '',
            website: lead.website || '', // <--- Aggiunto!
            notes: lead.notes || '',
            credits: 10,
            updated_at: new Date()
        },
        $setOnInsert: { created_at: new Date() }
        },
        upsert: true
    }
    }));

    const result = await db.collection('profiles').bulkWrite(operations);

    return NextResponse.json({ 
      success: true, 
      inserted: result.upsertedCount, 
      modified: result.modifiedCount 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}