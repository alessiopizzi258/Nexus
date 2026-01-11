import OpenAI from 'openai';
import { Resend } from 'resend';
import { getDb } from './db';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const resend = new Resend(process.env.RESEND_API_KEY);
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function runAutomationREACT(targetIndustry: string = 'all', campaignBrief: string = '') {
  const db = await getDb();
  
  // Fase Observation: Filtro dinamico
  const matchStage: any = { history: { $size: 0 } };
  if (targetIndustry !== 'all') {
    matchStage.industry = targetIndustry;
  }

  const users = await db.collection('profiles').aggregate([
    {
      $lookup: {
        from: "automation_logs",
        localField: "_id",
        foreignField: "user_id",
        as: "history"
      }
    },
    { $match: matchStage },
    { $limit: 50 } 
  ]).toArray();

  if (!users.length) return { message: "Nessun lead trovato per i criteri selezionati." };

  const results = [];

  for (const user of users) {
    try {
      // Fase Reasoning: L'AI elabora la mail basandosi sul tuo brief specifico
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Sei l'AI Growth Engine di Nexus Outreach. 
            CONTESTO CAMPAGNA: ${campaignBrief || 'Presentazione servizi Design Lab Studio.'}
            
            REGOLE:
            1. Genera una mail focalizzata sull'industria specifica del lead.
            2. Usa i dettagli del brief per spingere l'offerta/prodotto indicato.
            3. Rispondi SOLO in JSON: { "send": boolean, "campaign": "string", "subject": "string", "body": "string" }`
          },
          { role: "user", content: `Lead: ${user.full_name}, Settore: ${user.industry}, Sito: ${user.website || 'N/A'}` }
        ],
        response_format: { type: "json_object" }
      });

      const decision = JSON.parse(completion.choices[0].message.content || "{}");

      if (decision.send) {
        // Fase Acting: Invio professionale
        const { data, error } = await resend.emails.send({
          from: 'Alessio Pizzi <a.pizzi@designlabstudio.it>',
          to: [user.email],
          subject: decision.subject,
          html: `
            <div style="font-family:sans-serif; max-width:600px; margin:auto; border:1px solid #eee; padding:40px; border-radius:10px;">
              <h2 style="color:#4F46E5; letter-spacing:-1px;">NEXUS OUTREACH</h2>
              <div style="line-height:1.6; color:#333; font-size:16px;">
                ${decision.body.replace(/\n/g, '<br>')}
              </div>
              <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
              <p style="font-size:12px; color:#999;">Generato da Nexus Intelligence per ${user.industry}</p>
            </div>`
        });

        if (error) throw error;

        await db.collection('automation_logs').insertOne({
          user_id: user._id,
          email: user.email,
          status: 'sent',
          industry: user.industry,
          brief_used: campaignBrief,
          ai_decision: decision,
          created_at: new Date()
        });

        results.push({ email: user.email, status: 'sent' });
        await delay(1500); // Drip feeding per 10k/giorno
      }
    } catch (err: any) {
      console.error(`Errore: ${user.email}`, err.message);
    }
  }
  return { processed: results.length };
}