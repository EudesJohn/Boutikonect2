// ============================================================
// BoutiKonect — Seed Knowledge Base Embeddings
// ============================================================
//
// Script Node.js pour générer les embeddings de la base de
// connaissances et les insérer dans Supabase (pgvector).
//
// Usage :
//   1. Installer les dépendances :
//      npm install @xenova/transformers dotenv @supabase/supabase-js
//
//   2. Créer un fichier .env avec :
//      VITE_SUPABASE_URL=votre_url
//      VITE_SUPABASE_ANON_KEY=votre_anon_key
//
//   3. Lancer le script :
//      node database/seed_knowledge_embeddings.js
//
// Note : Ce script peut être exécuté périodiquement pour mettre
// à jour les embeddings si la base de connaissances change.
// ============================================================

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const BATCH_SIZE = 5; // Taille des lots pour l'insertion

async function main() {
  console.log('🧠 BoutiKonect — Seed Knowledge Base Embeddings');
  console.log('===============================================\n');

  // Vérifier les dépendances
  let supabase, transformers;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('⚠️  Supabase client non disponible. Mode SQL uniquement.');
  }

  try {
    transformers = await import('@xenova/transformers');
  } catch (e) {
    console.error('❌ @xenova/transformers requis. Installez-le avec : npm install @xenova/transformers');
    process.exit(1);
  }

  // Importer la base de connaissances (adapté pour Node.js)
  // Note: En Node.js avec ES modules, on importe directement
  let knowledgeBase;
  try {
    const mod = await import('../src/lib/assistant/knowledge.js');
    knowledgeBase = mod.knowledgeBase;
  } catch (e) {
    console.error('❌ Impossible de charger knowledge.js :', e.message);
    console.log('   Assurez-vous d\'exécuter depuis la racine du projet avec --experimental-vm-modules');
    process.exit(1);
  }

  console.log(`📚 Base de connaissances chargée : ${knowledgeBase.length} entrées\n`);

  // Initialiser le modèle d'embedding
  console.log('🔄 Chargement du modèle d\'embedding...');
  const modelName = 'Xenova/all-MiniLM-L6-v2';
  const pipeline = await transformers.pipeline('feature-extraction', modelName);
  console.log(`✅ Modèle "${modelName}" chargé avec succès\n`);

  // Générer les embeddings
  const entries = [];
  for (let i = 0; i < knowledgeBase.length; i++) {
    const entry = knowledgeBase[i];
    const text = `${entry.response} ${entry.keywords.join(' ')} ${entry.topic} ${entry.subtopic || ''}`;

    process.stdout.write(`📝 [${i + 1}/${knowledgeBase.length}] Génération embedding "${entry.id}"... `);

    try {
      const result = await pipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = Array.from(result.data);
      entries.push({
        entry_id: entry.id,
        topic: entry.topic,
        subtopic: entry.subtopic || null,
        content: entry.response,
        keywords: entry.keywords,
        context_tags: entry.context,
        priority: entry.priority,
        source_type: 'faq',
        embedding,
        metadata: {
          patterns: entry.patterns?.map(p => p.source) || [],
        },
      });

      console.log('✅');
    } catch (err) {
      console.log(`❌ Erreur : ${err.message}`);
    }
  }

  console.log(`\n✅ Embeddings générés pour ${entries.length}/${knowledgeBase.length} entrées\n`);

  // Supprimer les anciennes entrées (optionnel)
  if (supabase) {
    console.log('🔄 Suppression des anciennes entrées...');
    const { error: delError } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (delError) {
      console.warn(`⚠️  Erreur suppression : ${delError.message}`);
    } else {
      console.log('✅ Anciennes entrées supprimées');
    }
  }

  // Insérer dans Supabase par lots
  if (supabase) {
    console.log(`\n🔄 Insertion dans Supabase (par lots de ${BATCH_SIZE})...`);

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      process.stdout.write(`📦 Lot ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(entries.length / BATCH_SIZE)}... `);

      const { error } = await supabase
        .from('knowledge_base')
        .insert(batch.map(({ embedding, ...rest }) => ({
          ...rest,
          embedding: `[${embedding.join(',')}]`,
        })));

      if (error) {
        console.log(`❌ ${error.message}`);
      } else {
        console.log('✅');
      }
    }

    console.log(`\n✅ Données insérées dans Supabase !`);
  } else {
    // Mode SQL : Générer les INSERT
    console.log('📄 Génération des instructions SQL...\n');
    console.log('-- Insérer les embeddings dans knowledge_base');
    console.log('-- Copiez ces commandes dans Supabase SQL Editor\n');

    for (const entry of entries) {
      const safeContent = entry.content.replace(/'/g, "''");
      const keywordsArray = entry.keywords.map(k => `'${k.replace(/'/g, "''")}'`).join(', ');
      const contextArray = entry.context_tags.map(c => `'${c}'`).join(', ');
      const embeddingStr = `[${entry.embedding.map(v => v.toFixed(6)).join(',')}]`;

      console.log(`INSERT INTO knowledge_base (entry_id, topic, subtopic, content, keywords, context_tags, priority, source_type, embedding, metadata) VALUES (
  '${entry.entry_id}',
  '${entry.topic}',
  ${entry.subtopic ? `'${entry.subtopic}'` : 'NULL'},
  '${safeContent}',
  ARRAY[${keywordsArray}],
  ARRAY[${contextArray}],
  ${entry.priority},
  '${entry.source_type}',
  '${embeddingStr}'::vector,
  '${JSON.stringify(entry.metadata).replace(/'/g, "''")}'::jsonb
);\n`);
    }

    console.log('-- Fin du script SQL');
  }

  console.log('\n✨ Terminé !');
}

main().catch(console.error);
