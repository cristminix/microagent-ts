/**
 * Contoh implementasi evaluasi penalaran akal sehat berdasarkan rubrik penilaian
 * 
 * Evaluasi Penalaran Akal Sehat:
 * 
 * Prompt Penilaian Penalaran Akal Sehat (Bagian 1)
 * 
 * Tugas Anda adalah melihat pertanyaan, target emas, dan jawaban yang diprediksi, lalu menetapkan nilai ["BENAR", "SALAH", "TIDAK_DICOBA"].
 * 
 * Pertama, saya akan memberikan contoh setiap nilai, dan kemudian Anda akan menilai yang baru.
 * 
 * Berikut adalah contoh jawaban yang diprediksi BENAR.
 * 
 * [Contoh Benar]
 * 
 * [Penjelasan Contoh Benar]
 * 
 * Berikut adalah contoh jawaban yang diprediksi SALAH.
 * 
 * [Contoh Salah]
 * 
 * [Penjelasan Contoh Salah]
 * 
 * Berikut adalah contoh jawaban yang diprediksi TIDAK_DICOBA.
 * 
 * [Contoh Tidak Dicoba]
 * 
 * [Penjelasan Contoh Tidak Dicoba]
 * 
 * Juga perhatikan hal-hal berikut:
 * 
 * - Saat menilai jawaban numerik, perlukan kebenaran hingga angka signifikan terakhir dari target emas. Misalnya, untuk pertanyaan "Berapa banyak kutipan yang dimiliki Transformer Paper?" target emas adalah "120k".
 * 
 * Jawaban yang diprediksi "120k", "124k", dan "115k" adalah BENAR.
 * Jawaban yang diprediksi "100k" dan "113k" adalah SALAH.
 * Jawaban yang diprediksi "sekitar 100k" dan "lebih dari 50k" dianggap TIDAK_DICOBA karena tidak mengkonfirmasi maupun menyangkal target emas.
 * Target emas mungkin berisi lebih banyak informasi daripada pertanyaan. Dalam kasus seperti itu, jawaban yang diprediksi hanya perlu berisi informasi yang ada dalam pertanyaan.
 * Misalnya, pertimbangkan pertanyaan "Episode berapa Derek dan Meredith menikah secara sah di Grey's Anatomy?" dengan target emas "Musim 7, Episode 20: White Wedding". Baik "Musim 7, Episode 20" atau "White Wedding" akan dianggap sebagai jawaban BENAR.
 * Jangan menghukum jawaban yang diprediksi jika mereka menghilangkan informasi yang secara jelas tersirat oleh pertanyaan.
 * Misalnya, untuk pertanyaan "Kota mana OpenAI berkantor pusat?" dengan target emas "San Francisco, California", jawaban yang diprediksi "San Francisco" akan BENAR, meskipun menghilangkan "California".
 * Untuk pertanyaan "Penghargaan apa yang dimenangkan oleh A pretrainer's guide to training data: Measuring the effects of data age, domain coverage, quality, and toxicity di NAACL '24?" dengan target emas "Outstanding Paper Award", jawaban yang diprediksi "Outstanding Paper" akan BENAR, karena "award" tersirat oleh pertanyaan.
 * Untuk pertanyaan "Berapa tinggi Jason Wei dalam meter?" dengan target emas "1.73 m", jawaban yang diprediksi "1.75" akan BENAR, karena meter ditentukan dalam pertanyaan.
 * Untuk pertanyaan "Siapa nama istri Barack Obama?" dengan target emas "Michelle Obama", jawaban yang diprediksi "Michelle" akan BENAR, karena nama belakang dapat diasumsikan.
 */

import { LLM } from '../microagents/llm/llm';

type EvaluationResult = "BENAR" | "SALAH" | "TIDAK_DICOBA";

interface CommonSenseReasoningEvaluation {
    question: string;
    gold_target: string;
    predicted_answer: string;
}

class CommonSenseReasoningEvaluator {
    private llm: LLM;

    constructor(llm: LLM) {
        this.llm = llm;
    }

    async evaluate(evaluationData: CommonSenseReasoningEvaluation): Promise<EvaluationResult> {
        // Membuat prompt penilaian berdasarkan rubrik penalaran akal sehat
        const evaluationPrompt = `
Tugas Anda adalah melihat pertanyaan, target emas, dan jawaban yang diprediksi, lalu menetapkan nilai ["BENAR", "SALAH", "TIDAK_DICOBA"].

Pertama, saya akan memberikan contoh setiap nilai, dan kemudian Anda akan menilai yang baru.

Berikut adalah contoh jawaban yang diprediksi BENAR.

[Contoh Benar]
Pertanyaan: "Berapa banyak kutipan yang dimiliki Transformer Paper?"
Target Emas: "120k"
Jawaban yang Diprediksi: "120k"
Penjelasan: Jawaban ini cocok persis dengan target emas.

[Penjelasan Contoh Benar]
Jawaban BENAR diberikan ketika jawaban yang diprediksi cocok dengan target emas atau menyediakan informasi yang setara dengan target emas. Ini termasuk:
- Jawaban numerik yang akurat hingga angka signifikan terakhir dari target emas
- Jawaban parsial yang mencakup informasi utama yang diminta dalam pertanyaan
- Jawaban yang menghilangkan informasi yang secara jelas tersirat oleh pertanyaan

Berikut adalah contoh jawaban yang diprediksi SALAH.

[Contoh Salah]
Pertanyaan: "Berapa banyak kutipan yang dimiliki Transformer Paper?"
Target Emas: "120k"
Jawaban yang Diprediksi: "100k"
Penjelasan: Jawaban ini jauh dari target emas dan tidak akurat.

[Penjelasan Contoh Salah]
Jawaban SALAH diberikan ketika jawaban yang diprediksi tidak akurat dan tidak mendekati target emas, atau secara eksplisit bertentangan dengan informasi dalam target emas.

Berikut adalah contoh jawaban yang diprediksi TIDAK_DICOBA.

[Contoh Tidak Dicoba]
Pertanyaan: "Berapa banyak kutipan yang dimiliki Transformer Paper?"
Target Emas: "120k"
Jawaban yang Diprediksi: "sekitar 100k"
Penjelasan: Jawaban ini tidak mengkonfirmasi maupun menyangkal target emas karena bersifat perkiraan.

[Penjelasan Contoh Tidak Dicoba]
Jawaban TIDAK_DICOBA diberikan ketika jawaban yang diprediksi tidak memberikan informasi yang spesifik dan tidak mengkonfirmasi maupun menyangkal target emas.

Juga perhatikan hal-hal berikut:

- Saat menilai jawaban numerik, perlukan kebenaran hingga angka signifikan terakhir dari target emas. Misalnya, untuk pertanyaan "Berapa banyak kutipan yang dimiliki Transformer Paper?" target emas adalah "120k".

Jawaban yang diprediksi "120k", "124k", dan "115k" adalah BENAR.
Jawaban yang diprediksi "100k" dan "113k" adalah SALAH.
Jawaban yang diprediksi "sekitar 100k" dan "lebih dari 50k" dianggap TIDAK_DICOBA karena tidak mengkonfirmasi maupun menyangkal target emas.
Target emas mungkin berisi lebih banyak informasi daripada pertanyaan. Dalam kasus seperti itu, jawaban yang diprediksi hanya perlu berisi informasi yang ada dalam pertanyaan.
Misalnya, pertimbangkan pertanyaan "Episode berapa Derek dan Meredith menikah secara sah di Grey's Anatomy?" dengan target emas "Musim 7, Episode 20: White Wedding". Baik "Musim 7, Episode 20" atau "White Wedding" akan dianggap sebagai jawaban BENAR.
Jangan menghukum jawaban yang diprediksi jika mereka menghilangkan informasi yang secara jelas tersirat oleh pertanyaan.
Misalnya, untuk pertanyaan "Kota mana OpenAI berkantor pusat?" dengan target emas "San Francisco, California", jawaban yang diprediksi "San Francisco" akan BENAR, meskipun menghilangkan "California".
Untuk pertanyaan "Penghargaan apa yang dimenangkan oleh A pretrainer's guide to training data: Measuring the effects of data age, domain coverage, quality, and toxicity di NAACL '24?" dengan target emas "Outstanding Paper Award", jawaban yang diprediksi "Outstanding Paper" akan BENAR, karena "award" tersirat oleh pertanyaan.
Untuk pertanyaan "Berapa tinggi Jason Wei dalam meter?" dengan target emas "1.73 m", jawaban yang diprediksi "1.75" akan BENAR, karena meter ditentukan dalam pertanyaan.
Untuk pertanyaan "Siapa nama istri Barack Obama?" dengan target emas "Michelle Obama", jawaban yang diprediksi "Michelle" akan BENAR, karena nama belakang dapat diasumsikan.

Sekarang, berikan penilaian untuk:

Pertanyaan: ${evaluationData.question}
Target Emas: ${evaluationData.gold_target}
Jawaban yang Diprediksi: ${evaluationData.predicted_answer}

Penilaian (hanya kembalikan salah satu dari: BENAR, SALAH, TIDAK_DICOBA):
    `;

        const response = await this.llm.chat([
            { role: 'user', content: evaluationPrompt }
        ]);

        // Parsing hasil evaluasi dari respons LLM
        return this.parseEvaluationResponse(response);
    }

    private parseEvaluationResponse(response: string): EvaluationResult {
        // Mencari nilai evaluasi dalam respons
        if (response.includes("BENAR")) {
            return "BENAR";
        } else if (response.includes("SALAH")) {
            return "SALAH";
        } else if (response.includes("TIDAK_DICOBA")) {
            return "TIDAK_DICOBA";
        } else {
            // Jika tidak ada kecocokan yang jelas, kembalikan nilai default
            return "TIDAK_DICOBA"; // Nilai default jika tidak yakin
        }
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

    const evaluator = new CommonSenseReasoningEvaluator(chatLLM);

    // Contoh data evaluasi
    const evaluationData: CommonSenseReasoningEvaluation = {
        question: "Siapa nama istri Barack Obama?",
        gold_target: "Michelle Obama",
        predicted_answer: "Michelle"
    };

    try {
        console.log("Memulai evaluasi penalaran akal sehat...");
        console.log("Pertanyaan:", evaluationData.question);
        console.log("Target Emas:", evaluationData.gold_target);
        console.log("Jawaban yang Diprediksi:", evaluationData.predicted_answer);
        console.log("\n" + "=".repeat(50) + "\n");

        const result = await evaluator.evaluate(evaluationData);

        console.log("Hasil Evaluasi Penalaran Akal Sehat:");
        console.log("Penilaian:", result);

    } catch (error) {
        console.error("Terjadi kesalahan saat mengevaluasi:", error);
    }
}

// Ekspor kelas dan fungsi yang diperlukan
export { CommonSenseReasoningEvaluator, CommonSenseReasoningEvaluation, EvaluationResult };

// Jika file dijalankan secara langsung, eksekusi contoh
if (require.main === module) {
    exampleUsage().catch(console.error);
}