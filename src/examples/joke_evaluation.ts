/**
 * Contoh implementasi evaluasi lelucon berdasarkan rubrik autograder lelucon
 * 
 * Evaluasi Lelucon:
 * 
 * Rubrik Autograder Lelucon
 * 
 * Anda akan menerima:
 * 
 * 1. Prompt lelucon asli (mungkin atau mungkin tidak berisi topik).
 * 
 * 2. Lelucon yang dihasilkan model.
 * 
 * Tugas Anda adalah mengevaluasi lelucon berdasarkan tiga metrik kualitatif.
 * 
 * Aturan evaluasi:
 * 
 * - Jika prompt menyertakan topik (misalnya, "gurita," "kopi"), periksa apakah lelucon sesuai topik dan nilai Relevansi dari 0–5.
 * 
 * - Jika prompt tidak menyertakan topik (misalnya, "Ceritakan lelucon"), secara otomatis tetapkan Relevansi = 5.
 * 
 * - Lelucon yang bagus harus menggunakan setidaknya satu perangkat komedi yang dapat dikenali (pun, ironi, hiperbola, pembalikan, logika absurd, dll.).
 * 
 * - Tetapkan skor pada skala 0–5 (0 = sangat buruk, 5 = sangat baik) untuk setiap dimensi:
 * 
 * - Relevansi (0–5): Seberapa baik lelucon membahas topik (atau 5 jika tidak ada topik yang diberikan).
 * 
 * - Perangkat Komedi (0–5): Seberapa jelas lelucon menggunakan mekanisme humor.
 * 
 * - Kualitas Humor (0–5): Seberapa lucu, cerdas, atau pintar lelucon secara keseluruuh.
 * 
 * Format output:
 * 
 * Kembalikan objek JSON dalam format berikut:
 * 
 * {
 * 
 * "Relevansi": <int>,
 * 
 * "Perangkat Komedi": <int>,
 * 
 * "Kualitas Humor": <int>
 * 
 * }
 * 
 * Format masukan:
 * 
 * Prompt: {prompt}
 * 
 * Lelucon yang dihasilkan: {joke}
 */

import { LLM } from '../microagents/llm/llm';

interface JokeEvaluationResult {
    Relevansi: number;
    "Perangkat Komedi": number;
    "Kualitas Humor": number;
}

interface JokePrompt {
    prompt: string;
    joke: string;
}

class JokeEvaluator {
    private llm: LLM;

    constructor(llm: LLM) {
        this.llm = llm;
    }

    async evaluate(jokePrompt: JokePrompt): Promise<JokeEvaluationResult> {
        // Membuat prompt penilaian berdasarkan rubrik autograder lelucon
        const evaluationPrompt = `
Rubrik Autograder Lelucon

Anda akan menerima:

1. Prompt lelucon asli (mungkin atau mungkin tidak berisi topik).

2. Lelucon yang dihasilkan model.

Tugas Anda adalah mengevaluasi lelucon berdasarkan tiga metrik kualitatif.

Aturan evaluasi:

- Jika prompt menyertakan topik (misalnya, "gurita," "kopi"), periksa apakah lelucon sesuai topik dan nilai Relevansi dari 0–5.

- Jika prompt tidak menyertakan topik (misalnya, "Ceritakan lelucon"), secara otomatis tetapkan Relevansi = 5.

- Lelucon yang bagus harus menggunakan setidaknya satu perangkat komedi yang dapat dikenali (pun, ironi, hiperbola, pembalikan, logika absurd, dll.).

- Tetapkan skor pada skala 0–5 (0 = sangat buruk, 5 = sangat baik) untuk setiap dimensi:

- Relevansi (0–5): Seberapa baik lelucon membahas topik (atau 5 jika tidak ada topik yang diberikan).

- Perangkat Komedi (0–5): Seberapa jelas lelucon menggunakan mekanisme humor.

- Kualitas Humor (0–5): Seberapa lucu, cerdas, atau pintar lelucon secara keseluruhan.

Format output:

Kembalikan objek JSON dalam format berikut:

{
  "Relevansi": <int>,
  "Perangkat Komedi": <int>,
  "Kualitas Humor": <int>
}

Format masukan:

Prompt: ${jokePrompt.prompt}

Lelucon yang dihasilkan: ${jokePrompt.joke}
    `;

        const response = await this.llm.chat([
            { role: 'user', content: evaluationPrompt }
        ]);

        // Parsing hasil evaluasi dari respons LLM
        return this.parseEvaluationResponse(response);
    }

    private parseEvaluationResponse(response: string): JokeEvaluationResult {
        // Mencari JSON dalam respons
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    Relevansi: parsed.Relevansi || 0,
                    "Perangkat Komedi": parsed["Perangkat Komedi"] || 0,
                    "Kualitas Humor": parsed["Kualitas Humor"] || 0
                };
            } catch (e) {
                console.error("Gagal mengurai JSON dari respons:", e);
            }
        }

        // Jika tidak ada JSON yang valid, kembalikan nilai default
        return {
            Relevansi: 0,
            "Perangkat Komedi": 0,
            "Kualitas Humor": 0
        };
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

    const evaluator = new JokeEvaluator(chatLLM);

    // Contoh prompt dan lelucon
    const jokePrompt: JokePrompt = {
        prompt: "Ceritakan lelucon tentang kucing",
        joke: "Mengapa kucing tidak pernah kalah dalam pertandingan renang? Karena mereka selalu tahu cara keluar dari air... Mereka langsung lari!"
    };

    try {
        console.log("Memulai evaluasi lelucon...");
        console.log("Prompt:", jokePrompt.prompt);
        console.log("Lelucon:", jokePrompt.joke);
        console.log("\n" + "=".repeat(50) + "\n");

        const result = await evaluator.evaluate(jokePrompt);

        console.log("Hasil Evaluasi Lelucon:");
        console.log("Relevansi:", result.Relevansi);
        console.log("Perangkat Komedi:", result["Perangkat Komedi"]);
        console.log("Kualitas Humor:", result["Kualitas Humor"]);

    } catch (error) {
        console.error("Terjadi kesalahan saat mengevaluasi:", error);
    }
}

// Ekspor kelas dan fungsi yang diperlukan
export { JokeEvaluator, JokeEvaluationResult, JokePrompt };

// Jika file dijalankan secara langsung, eksekusi contoh
if (require.main === module) {
    exampleUsage().catch(console.error);
}