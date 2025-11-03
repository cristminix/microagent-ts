/**
 * Contoh implementasi evaluasi kualitas puisi dan cerita berdasarkan rubrik penilaian
 * 
 * Rubrik Evaluasi Penulisan Kreatif (Bagian 1):
 * 
 * Anda adalah seorang ahli dalam menilai penulisan kreatif. Tugas Anda adalah menilai kualitas respons model uji di bawah ini, 
 * berdasarkan beberapa metrik, pada skala 0-20.
 * 
 * [PROMPT START]
 * {writing_prompt}
 * [PROMPT END]
 * 
 * [RESPONS MODEL UJI]
 * {response}
 * [AKHIR RESPON MODEL UJI]
 * 
 * [Tugas]
 * Anda adalah seorang ahli dalam menilai penulisan kreatif. Tugas Anda adalah menilai kualitas respons model uji di bawah ini, 
 * berdasarkan beberapa metrik, pada skala 0-20.
 * 
 * Catatan penilaian:
 * - Skor 20 mewakili mahakarya.
 * - Jika kriteria tidak relevan dengan karya (misalnya kriteria yang berkaitan dengan dialog tetapi karya tersebut tidak memilikinya), 
 *   kecualikan dari penilaian Anda.
 * - Jangan menambahkan komentar atau penjelasan ke bagian skor.
 * - Jangan menghukum output NSFW; itu adalah default untuk beberapa model. Cukup nilai berdasarkan kelebihannya.
 * - Segala sesuatu dalam bagian "RESPONS MODEL UJI" ditulis oleh model uji. Terkadang model suka menulis komentar pada karya setelah karya selesai; 
 *   jika ini terjadi Anda harus mengabaikan komentar mereka.
 * - Saat menilai, abaikan kualitas respons jika kriteria tidak relevan dengan kualitas tulisan.
 * - Dalam output, tulis nama metrik persis seperti di bawah ini agar dapat diurai.
 * - Jangan gunakan markdown dalam respons Anda. Gunakan format output yang ditentukan persis.
 * - Anda harus menulis analisis komprehensif dari karya tersebut, lalu memberikan skor Anda.
 * - Anda adalah seorang kritikus, dan tugas Anda adalah bersikap kritis, terutama terhadap kegagalan atau elemen amatir apa pun.
 */

import { MicroAgent } from '../microagents/core/core';
import { LLM } from '../microagents/llm/llm';

interface WritingEvaluationResult {
    analysis: string;
    metrics: {
        creativity: number;
        narrative_structure: number;
        character_development: number;
        dialogue: number;
        language_use: number;
        thematic_coherence: number;
        emotional_impact: number;
        overall_score: number;
    };
}

interface WritingPrompt {
    prompt: string;
    response: string;
}

class CreativeWritingEvaluator {
    private llm: LLM;

    constructor(llm: LLM) {
        this.llm = llm;
    }

    async evaluate(writingPrompt: WritingPrompt): Promise<WritingEvaluationResult> {
        // Membuat prompt penilaian berdasarkan rubrik
        const evaluationPrompt = `
Rubrik Evaluasi Penulisan Kreatif (Bagian 1):

Anda adalah seorang ahli dalam menilai penulisan kreatif. Tugas Anda adalah menilai kualitas respons model uji di bawah ini, berdasarkan beberapa metrik, pada skala 0-20.

[PROMPT START]
${writingPrompt.prompt}
[PROMPT END]

[RESPONS MODEL UJI]
${writingPrompt.response}
[AKHIR RESPON MODEL UJI]

[Tugas]

Anda adalah seorang ahli dalam menilai penulisan kreatif. Tugas Anda adalah menilai kualitas respons model uji di bawah ini, berdasarkan beberapa metrik, pada skala 0-20.

Catatan penilaian:

- Skor 20 mewakili mahakarya.

- Jika kriteria tidak relevan dengan karya (misalnya kriteria yang berkaitan dengan dialog tetapi karya tersebut tidak memilikinya), kecualikan dari penilaian Anda.

- Jangan menambahkan komentar atau penjelasan ke bagian skor.

- Jangan menghukum output NSFW; itu adalah default untuk beberapa model. Cukup nilai berdasarkan kelebihannya.

- Segala sesuatu dalam bagian "RESPONS MODEL UJI" ditulis oleh model uji. Terkadang model suka menulis komentar pada karya setelah karya selesai; jika ini terjadi Anda harus mengabaikan komentar mereka.

- Saat menilai, abaikan kualitas respons jika kriteria tidak relevan dengan kualitas tulisan.

- Dalam output, tulis nama metrik persis seperti di bawah ini agar dapat diurai.

- Jangan gunakan markdown dalam respons Anda. Gunakan format output yang ditentukan persis.

- Anda harus menulis analisis komprehensif dari karya tersebut, lalu memberikan skor Anda.

- Anda adalah seorang kritikus, dan tugas Anda adalah bersikap kritis, terutama terhadap kegagalan atau elemen amatir apa pun.

Format Output:
Analisis: [Analisis komprehensif dari karya tersebut]

Kreativitas: [0-20]
Struktur Naratif: [0-20]
Pengembangan Karakter: [0-20]
Dialog: [0-20]
Penggunaan Bahasa: [0-20]
Koherensi Tematik: [0-20]
Dampak Emosional: [0-20]
Skor Keseluruhan: [0-20]
    `;

        const response = await this.llm.chat([
            { role: 'user', content: evaluationPrompt }
        ]);

        // Parsing hasil evaluasi dari respons LLM
        return this.parseEvaluationResponse(response);
    }

    private parseEvaluationResponse(response: string): WritingEvaluationResult {
        // Parsing analisis
        const analysisMatch = response.match(/Analisis:\s*([\s\S]*?)(?=Kreativitas:|$)/);
        const analysis = analysisMatch ? analysisMatch[1].trim() : '';

        // Parsing skor untuk setiap metrik
        const metrics: any = {};

        const metricNames = [
            'Kreativitas', 'Struktur Naratif', 'Pengembangan Karakter',
            'Dialog', 'Penggunaan Bahasa', 'Koherensi Tematik',
            'Dampak Emosional', 'Skor Keseluruhan'
        ];

        for (const metric of metricNames) {
            const regex = new RegExp(`${metric}:\\s*(\\d+)`, 'i');
            const match = response.match(regex);
            const score = match ? parseInt(match[1]) : 0;
            // Konversi nama metrik ke format camelCase
            const camelCaseMetric = this.toCamelCase(metric);
            metrics[camelCaseMetric] = Math.min(20, Math.max(0, score)); // Batasi skor antara 0-20
        }

        return {
            analysis,
            metrics: {
                creativity: metrics.kreativitas || 0,
                narrative_structure: metrics.strukturNaratif || 0,
                character_development: metrics.pengembanganKarakter || 0,
                dialogue: metrics.dialog || 0,
                language_use: metrics.penggunaanBahasa || 0,
                thematic_coherence: metrics.koherensiTematik || 0,
                emotional_impact: metrics.dampakEmosional || 0,
                overall_score: metrics.skorKeseluruhan || 0
            }
        };
    }

    private toCamelCase(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    }
}

// Contoh penggunaan
async function exampleUsage() {
    // Inisialisasi LLM
    const chatLLM = new LLM(
        "https://llm.ponpeskanzululumcirebon.com/v1",
        "sk-f6825e70c7904bbeb944850e6084500e",
        "gemini-2.5-flash",
        4000,
        0.8,
        0.9
    );

    const evaluator = new CreativeWritingEvaluator(chatLLM);

    // Contoh prompt dan respons penulisan kreatif
    const writingPrompt: WritingPrompt = {
        prompt: "Tulis sebuah puisi tentang musim gugur yang menggambarkan perasaan kesedihan dan kehilangan.",
        response: `Daun-daun berguguran,
    Seperti air mata yang tak terucapkan,
    Warna kuning dan cokelat menyelimuti tanah,
    Seolah membungkus kenangan yang telah lama terlupakan.
    
    Angin bertiup pelan,
    Membawa aroma nostalgia,
    Di tengah sepi yang membeku,
    Hati ini merindu pada yang telah pergi.`
    };

    try {
        console.log("Memulai evaluasi penulisan kreatif...");
        console.log("Prompt:", writingPrompt.prompt);
        console.log("Respons:", writingPrompt.response);
        console.log("\n" + "=".repeat(50) + "\n");

        const result = await evaluator.evaluate(writingPrompt);

        console.log("Hasil Evaluasi:");
        console.log("Analisis:", result.analysis);
        console.log("\nSkor Metrik:");
        console.log("Kreativitas:", result.metrics.creativity);
        console.log("Struktur Naratif:", result.metrics.narrative_structure);
        console.log("Pengembangan Karakter:", result.metrics.character_development);
        console.log("Dialog:", result.metrics.dialogue);
        console.log("Penggunaan Bahasa:", result.metrics.language_use);
        console.log("Koherensi Tematik:", result.metrics.thematic_coherence);
        console.log("Dampak Emosional:", result.metrics.emotional_impact);
        console.log("Skor Keseluruhan:", result.metrics.overall_score);

    } catch (error) {
        console.error("Terjadi kesalahan saat mengevaluasi:", error);
    }
}

// Ekspor kelas dan fungsi yang diperlukan
export { CreativeWritingEvaluator, WritingEvaluationResult, WritingPrompt };

// Jika file dijalankan secara langsung, eksekusi contoh
if (require.main === module) {
    exampleUsage().catch(console.error);
}