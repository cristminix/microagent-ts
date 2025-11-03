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

// Fungsi untuk menjalankan sampling prompt
async function runPromptSampling(inputPrompt: string, numSamplings: number, targetWords: number, probabilityTuning?: number): Promise<any> {
    // Agent untuk prompt sampling
    const samplingAgent = new MicroAgent(
        chatLLM,
        `Anda adalah agen sampling prompt. Tugas Anda adalah menghasilkan beberapa respons terhadap prompt masukan sesuai dengan instruksi berikut:

Generate ${numSamplings} responses to the above input prompt. Each response should be about ${targetWords} words.

${probabilityTuning ? `Sample responses randomly from the distribution, with each response probability below ${probabilityTuning}.` : 'Sample responses randomly from the full distribution.'}

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
    console.log("Contoh Prompt Sampling dengan MicroAgent");
    console.log("=====================================");

    // Contoh prompt sampling
    const inputPrompt = "Jelaskan manfaat dari teknologi AI dalam kehidupan sehari-hari.";
    const numSamplings = 3;
    const targetWords = 50;
    const probabilityTuning = 0.8; // Opsional

    console.log(`Input Prompt: ${inputPrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWords}`);
    console.log(`Probability Tuning: ${probabilityTuning}`);
    console.log("\nSedang menghasilkan respons...\n");

    try {
        const result = await runPromptSampling(inputPrompt, numSamplings, targetWords, probabilityTuning);

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

export { runPromptSampling };