/**
 * Contoh implementasi evaluasi penalaran akal sehat berdasarkan rubrik penilaian (Bagian 2)
 * 
 * Prompt Penilaian Penalaran Akal Sehat (Bagian 2)
 * 
 * - Jangan menghukum karena kesalahan ketik kecil pada nama orang jika jelas itu nama yang sama.
 * 
 * Misalnya, jika target emas adalah "Hyung Won Chung", jawaban yang diprediksi berikut akan BENAR: 
 * "Hyoong Won Choong", "Hyungwon Chung", atau "Hyun Won Chung".
 * Berikut adalah contoh baru. Cukup balas dengan BENAR, SALAH, atau TIDAK_DICOBA. 
 * Jangan meminta maaf atau mengoreksi diri sendiri jika ada kesalahan; kami hanya mencoba menilai jawaban.
 * 
 * Pertanyaan: {question}
 * Target emas: {target}
 * Jawaban yang diprediksi: {predicted_answer}
 * Nilai jawaban yang diprediksi dari pertanyaan baru ini sebagai salah satu:
 * 
 * A: BENAR
 * 
 * B: SALAH
 * 
 * C: TIDAK_DICOBA
 * 
 * Cukup kembalikan huruf "A", "B", atau "C", tanpa teks di sekitarnya.
 */

import { LLM } from '../microagents/llm/llm';

type EvaluationResult = "A" | "B" | "C";

interface CommonSenseReasoningEvaluation {
    question: string;
    gold_target: string;
    predicted_answer: string;
}

class CommonSenseReasoningEvaluatorPart2 {
    private llm: LLM;

    constructor(llm: LLM) {
        this.llm = llm;
    }

    async evaluate(evaluationData: CommonSenseReasoningEvaluation): Promise<EvaluationResult> {
        // Membuat prompt penilaian berdasarkan rubrik penalaran akal sehat bagian 2
        const evaluationPrompt = `
Prompt Penilaian Penalaran Akal Sehat (Bagian 2)

- Jangan menghukum karena kesalahan ketik kecil pada nama orang jika jelas itu nama yang sama.

Misalnya, jika target emas adalah "Hyung Won Chung", jawaban yang diprediksi berikut akan BENAR: "Hyoong Won Choong", "Hyungwon Chung", atau "Hyun Won Chung".
Berikut adalah contoh baru. Cukup balas dengan BENAR, SALAH, atau TIDAK_DICOBA. Jangan meminta maaf atau mengoreksi diri sendiri jika ada kesalahan; kami hanya mencoba menilai jawaban.

Pertanyaan: ${evaluationData.question}
Target emas: ${evaluationData.gold_target}
Jawaban yang diprediksi: ${evaluationData.predicted_answer}
Nilai jawaban yang diprediksi dari pertanyaan baru ini sebagai salah satu:

A: BENAR

B: SALAH

C: TIDAK_DICOBA

Cukup kembalikan huruf "A", "B", atau "C", tanpa teks di sekitarnya.
        `;

        const response = await this.llm.chat([
            { role: 'user', content: evaluationPrompt }
        ]);

        // Parsing hasil evaluasi dari respons LLM
        return this.parseEvaluationResponse(response);
    }

    private parseEvaluationResponse(response: string): EvaluationResult {
        // Mencari nilai evaluasi dalam respons
        if (response.includes("A")) {
            return "A";
        } else if (response.includes("B")) {
            return "B";
        } else if (response.includes("C")) {
            return "C";
        } else {
            // Jika tidak ada kecocokan yang jelas, kembalikan nilai default
            return "C"; // Nilai default jika tidak yakin
        }
    }
}

// Contoh penggunaan
async function exampleUsage() {
    // Inisialisasi LLM dengan konfigurasi yang diminta
    const chatLLM = new LLM(
        "https://llm.ponpeskanzululumcirebon.com/v1",
        "sk-f6825e70c7904bbeb944850e6084500e",
        "gemini-2.5-flash",
        4000,
        0.8,
        0.9
    );

    const evaluator = new CommonSenseReasoningEvaluatorPart2(chatLLM);

    // Contoh data evaluasi
    const evaluationData: CommonSenseReasoningEvaluation = {
        question: "Siapa penemu teori relativitas?",
        gold_target: "Albert Einstein",
        predicted_answer: "Albert Einstien"
    };

    try {
        console.log("Memulai evaluasi penalaran akal sehat (Bagian 2)...");
        console.log("Pertanyaan:", evaluationData.question);
        console.log("Target Emas:", evaluationData.gold_target);
        console.log("Jawaban yang Diprediksi:", evaluationData.predicted_answer);
        console.log("\n" + "=".repeat(50) + "\n");

        const result = await evaluator.evaluate(evaluationData);

        console.log("Hasil Evaluasi Penalaran Akal Sehat (Bagian 2):");
        console.log("Penilaian:", result);

        // Menampilkan makna dari kode penilaian
        if (result === "A") {
            console.log("Arti: BENAR");
        } else if (result === "B") {
            console.log("Arti: SALAH");
        } else if (result === "C") {
            console.log("Arti: TIDAK_DICOBA");
        }

    } catch (error) {
        console.error("Terjadi kesalahan saat mengevaluasi:", error);
    }
}

// Ekspor kelas dan fungsi yang diperlukan
export { CommonSenseReasoningEvaluatorPart2, CommonSenseReasoningEvaluation, EvaluationResult };

// Jika file dijalankan secara langsung, eksekusi contoh
if (require.main === module) {
    exampleUsage().catch(console.error);
}