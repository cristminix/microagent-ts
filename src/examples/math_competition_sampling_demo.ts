import { LLM } from '../microagents/llm/llm';
import { MicroAgent, BaseMessageStore } from '../microagents/core';

// Initialize LLM dengan konfigurasi yang diberikan
const chatLLM = new LLM(
    "https://llm.ponpeskanzululumcirebon.com/v1",
    "sk-f6825e70c7904bbeb944850e6084500e",
    "gemini-2.5-flash",
    4000,
    0.8,
    0.9
);

// Fungsi untuk menjalankan sampling prompt untuk matematika kompetisi
async function runMathCompetitionSampling(inputPrompt: string, numSamplings: number, targetWords: number): Promise<any> {
    // Agent untuk prompt sampling matematika kompetisi
    const samplingAgent = new MicroAgent(
        chatLLM,
        `Anda adalah agen sampling prompt untuk matematika kompetisi. Tugas Anda adalah menghasilkan beberapa soal kompetisi matematika dengan gaya AMC 10, AMC 12, atau AIME sesuai dengan instruksi berikut:

Generate ${numSamplings} instances data based on the input prompt. Each instance should be about ${targetWords} words.

Soal kompetisi matematika yang dihasilkan harus:
- Mengikuti gaya AMC 10, AMC 12, atau AIME
- Menggunakan matematika sekolah menengah atau atas — aritmatika, aljabar, perhitungan & probabilitas, teori bilangan, kombinatorika, geometri, trigonometri, pra-kalkulus, dan teknik kontes umum (ketidaksetaraan seperti AM–GM atau Cauchy–Schwarz, simetri, invarian, manipulasi cerdas)
- Dinyatakan dengan jelas satu masalah matematika di bawah baris yang dimulai dengan "Pertanyaan:"
- Menyertakan tingkat kesulitan di bawah baris yang dimulai dengan "Kesulitan:", menggunakan tepat salah satu: AMC atau AIME
- Jawaban harus berupa angka spesifik atau ekspresi yang disederhanakan (bukan pilihan ganda)
- Masalah harus mandiri dan terdefinisi dengan baik
- Tidak memerlukan matematika sarjana tingkat lanjat (misalnya, kalkulus tingkat lanjut, aljabar abstrak)
- Hindari trik yang tidak jelas; hanya mengandalkan aplikasi kreatif dari matematika sekolah menengah standar
- Jaga tingkat kesulitan dan gaya konsisten dengan masalah AMC/AIME resmi
- Diformat sebagai berikut:
  Pertanyaan:
  [pernyataan masalah dalam bahasa alami]
  
  Kesulitan:
  [tingkat kesulitan, tepat salah satu: AMC atau AIME]

Return responses in JSON format with key: "responses" (list of dicts). Each dict should include:
- text: response string only (no explanations or additional text)
- probability: estimated probability from 0.0 to 1.0 of this response given the input prompt (relative to full distribution)

Provide ONLY the JSON object, no explanations or additional text.`,
        []
    );

    // Format prompt dengan parameter
    const formattedPrompt = `Input Prompt: "${inputPrompt}"`;

    const messageStore = new BaseMessageStore();
    const result = await samplingAgent.executeAgent(formattedPrompt, messageStore);

    try {
        // Bersihkan hasil dari format markdown jika ada
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```json')) {
            cleanResult = cleanResult.substring(7); // Hapus ```json
        }
        if (cleanResult.startsWith('```')) {
            cleanResult = cleanResult.substring(3); // Hapus ```
        }
        if (cleanResult.endsWith('```')) {
            cleanResult = cleanResult.substring(0, cleanResult.length - 3); // Hapus ```
        }
        cleanResult = cleanResult.trim();

        // Parsing hasil sebagai JSON
        const parsedResult = JSON.parse(cleanResult);
        return parsedResult;
    } catch (error) {
        console.error("Error parsing JSON result:", error);
        console.log("Raw result:", result);
        return { responses: [] };
    }
}

// Contoh penggunaan
async function main() {
    console.log("Contoh Prompt Sampling Matematika Kompetisi dengan MicroAgent");
    console.log("===========================================================");

    // Contoh prompt sampling untuk matematika kompetisi
    const inputPrompt = "Hasilkan soal kompetisi matematika dengan gaya AMC 10, AMC 12, atau AIME.";
    const numSamplings = 3;
    const targetWords = 80;

    console.log(`Input Prompt: ${inputPrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWords}`);
    console.log("\nSedang menghasilkan respons...\n");

    try {
        const result = await runMathCompetitionSampling(inputPrompt, numSamplings, targetWords);

        console.log("Hasil Sampling:");
        console.log("================");

        if (result.responses && Array.isArray(result.responses)) {
            result.responses.forEach((response: any, index: number) => {
                console.log(`\nRespons ${index + 1} (Probabilitas: ${(response.probability || 0).toFixed(2)}):`);
                console.log(response.text || response);
            });
        } else {
            console.log("Tidak ada respons yang dihasilkan atau format tidak valid.");
        }
    } catch (error) {
        console.error("Error saat menjalankan sampling:", error);
    }
}

// Jalankan contoh jika file ini dijalankan langsung
if (require.main === module) {
    main().catch(console.error);
}

export { runMathCompetitionSampling };