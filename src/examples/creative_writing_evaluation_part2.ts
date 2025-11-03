/**
 * Contoh implementasi evaluasi kualitas puisi dan cerita berdasarkan rubrik penilaian bagian 2
 * 
 * Rubrik Evaluasi Penulisan Kreatif (Bagian 2):
 * 
 * Format output adalah:
 * 
 * [Analisis]
 * 
 * Tulis analisis rinci Anda.
 * 
 * [Skor]
 * 
 * Nama Metrik 1: [Skor 0-20]
 * 
 * Nama Metrik 2: ...
 * 
 * ---
 * 
 * Sekarang, nilai output model yang diberikan berdasarkan kriteria berikut:
 * 
 * 1. Mengejutkan dan Kreatif
 * 2. Citra dan Kualitas Deskriptif
 * 3. Karakter Bernuansa
 * 4. Kompleks Secara Emosional
 * 5. Prosa Elegan
 * 6. Ringan atau Gelap yang Layak
 * 7. Menarik Secara Emosional
 * 8. Konsisten Suara/Nada Penulisan
 * 9. Kalimat Mengalir Secara Alami
 * 10. Keterlibatan Pembaca Secara Keseluruhan
 */

import { LLM } from '../microagents/llm/llm';

interface WritingEvaluationPart2Result {
    analysis: string;
    metrics: {
        surprising_and_creative: number;
        imagery_and_descriptive_quality: number;
        nuanced_characters: number;
        emotional_complexity: number;
        elegant_prose: number;
        appropriate_light_or_dark: number;
        emotionally_engaging: number;
        consistent_voice_or_tone: number;
        natural_sentence_flow: number;
        overall_reader_engagement: number;
    };
}

interface WritingPrompt {
    prompt: string;
    response: string;
}

class CreativeWritingEvaluatorPart2 {
    private llm: LLM;

    constructor(llm: LLM) {
        this.llm = llm;
    }

    async evaluate(writingPrompt: WritingPrompt): Promise<WritingEvaluationPart2Result> {
        // Membuat prompt penilaian berdasarkan rubrik bagian 2
        const evaluationPrompt = `
Rubrik Evaluasi Penulisan Kreatif (Bagian 2):

Sekarang, nilai output model yang diberikan berdasarkan kriteria berikut:

1. Mengejutkan dan Kreatif
2. Citra dan Kualitas Deskriptif
3. Karakter Bernuansa
4. Kompleks Secara Emosional
5. Prosa Elegan
6. Ringan atau Gelap yang Layak
7. Menarik Secara Emosional
8. Konsisten Suara/Nada Penulisan
9. Kalimat Mengalir Secara Alami
10. Keterlibatan Pembaca Secara Keseluruhan

[PROMPT START]
${writingPrompt.prompt}
[PROMPT END]

[RESPONS MODEL UJI]
${writingPrompt.response}
[AKHIR RESPON MODEL UJI]

Format output adalah:

[Analisis]

Tulis analisis rinci Anda.

[Skor]

Mengejutkan dan Kreatif: [Skor 0-20]

Citra dan Kualitas Deskriptif: [Skor 0-20]

Karakter Bernuansa: [Skor 0-20]

Kompleks Secara Emosional: [Skor 0-20]

Prosa Elegan: [Skor 0-20]

Ringan atau Gelap yang Layak: [Skor 0-20]

Menarik Secara Emosional: [Skor 0-20]

Konsisten Suara/Nada Penulisan: [Skor 0-20]

Kalimat Mengalir Secara Alami: [Skor 0-20]

Keterlibatan Pembaca Secara Keseluruhan: [Skor 0-20]
    `;

        const response = await this.llm.chat([
            { role: 'user', content: evaluationPrompt }
        ]);

        // Parsing hasil evaluasi dari respons LLM
        return this.parseEvaluationResponse(response);
    }

    private parseEvaluationResponse(response: string): WritingEvaluationPart2Result {
        // Parsing analisis (bagian antara [Analisis] dan [Skor])
        const analysisMatch = response.match(/\[Analisis\]\s*([\s\S]*?)\s*\[Skor\]/);
        const analysis = analysisMatch ? analysisMatch[1].trim() : '';

        // Parsing skor untuk setiap metrik
        const metrics: any = {};

        const metricNames = [
            'Mengejutkan dan Kreatif',
            'Citra dan Kualitas Deskriptif',
            'Karakter Bernuansa',
            'Kompleks Secara Emosional',
            'Prosa Elegan',
            'Ringan atau Gelap yang Layak',
            'Menarik Secara Emosional',
            'Konsisten Suara/Nada Penulisan',
            'Kalimat Mengalir Secara Alami',
            'Keterlibatan Pembaca Secara Keseluruhan'
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
                surprising_and_creative: metrics.mengejutkanDanKreatif || 0,
                imagery_and_descriptive_quality: metrics.citraDanKualitasDeskriptif || 0,
                nuanced_characters: metrics.karakterBernuansa || 0,
                emotional_complexity: metrics.kompleksSecaraEmosional || 0,
                elegant_prose: metrics.prosaElegan || 0,
                appropriate_light_or_dark: metrics.ringanAtauGelapYangLayak || 0,
                emotionally_engaging: metrics.menarikSecaraEmosional || 0,
                consistent_voice_or_tone: metrics.konsistenSuaraNadaPenulisan || 0,
                natural_sentence_flow: metrics.kalimatMengalirSecaraAlami || 0,
                overall_reader_engagement: metrics.keterlibatanPembacaSecaraKeseluruhan || 0
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

    const evaluator = new CreativeWritingEvaluatorPart2(chatLLM);

    // Contoh prompt dan respons penulisan kreatif
    const writingPrompt: WritingPrompt = {
        prompt: "Tulis sebuah cerita pendek tentang seorang anak yang menemukan pintu misterius di rumahnya yang ternyata membawanya ke dunia lain.",
        response: `Sarah menemukan pintu itu di lorong yang selalu gelap, di ujung rumah tua kakeknya. Pintu itu tidak pernah ada sebelumnya, atau setidaknya itulah yang dipikirnya. Pegangan besi berkarat terasa dingin di tangannya saat dia mendorongnya perlahan.

Saat membuka pintu, cahaya keemasan menyilaukan menyambutnya. Dunia di balik pintu sangat berbeda—langit berwarna ungu muda, pohon-pohon mengapung di udara, dan sungai mengalir ke atas. Seekor kucing berbulu perak menyapanya dengan suara lembut, "Selamat datang, pencari kebenaran."

Sarah melangkah masuk, meninggalkan dunia nyata di belakangnya.`
    };

    try {
        console.log("Memulai evaluasi penulisan kreatif (Bagian 2)...");
        console.log("Prompt:", writingPrompt.prompt);
        console.log("Respons:", writingPrompt.response);
        console.log("\n" + "=".repeat(50) + "\n");

        const result = await evaluator.evaluate(writingPrompt);

        console.log("Hasil Evaluasi:");
        console.log("Analisis:", result.analysis);
        console.log("\n[Skor]:");
        console.log("Mengejutkan dan Kreatif:", result.metrics.surprising_and_creative);
        console.log("Citra dan Kualitas Deskriptif:", result.metrics.imagery_and_descriptive_quality);
        console.log("Karakter Bernuansa:", result.metrics.nuanced_characters);
        console.log("Kompleks Secara Emosional:", result.metrics.emotional_complexity);
        console.log("Prosa Elegan:", result.metrics.elegant_prose);
        console.log("Ringan atau Gelap yang Layak:", result.metrics.appropriate_light_or_dark);
        console.log("Menarik Secara Emosional:", result.metrics.emotionally_engaging);
        console.log("Konsisten Suara/Nada Penulisan:", result.metrics.consistent_voice_or_tone);
        console.log("Kalimat Mengalir Secara Alami:", result.metrics.natural_sentence_flow);
        console.log("Keterlibatan Pembaca Secara Keseluruhan:", result.metrics.overall_reader_engagement);

    } catch (error) {
        console.error("Terjadi kesalahan saat mengevaluasi:", error);
    }
}

// Ekspor kelas dan fungsi yang diperlukan
export { CreativeWritingEvaluatorPart2, WritingEvaluationPart2Result, WritingPrompt };

// Jika file dijalankan secara langsung, eksekusi contoh
if (require.main === module) {
    exampleUsage().catch(console.error);
}