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
function cleanMarkdown(result: string): string {
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
    return cleanResult.trim();
}
// Fungsi untuk menjalankan sampling prompt verbal multi-giliran
async function runVerbalPromptSamplingMultiTurn(
    inputPrompt: string,
    numSamplings: number,
    targetWords: number,
    numSamplesPerPrompt: number
): Promise<any> {
    // Agent untuk prompt sampling verbal multi-giliran
    const samplingAgent = new MicroAgent(
        chatLLM,
        `Anda adalah agen sampling prompt verbal multi-giliran. Tugas Anda adalah menghasilkan respons terhadap prompt masukan sesuai dengan instruksi berikut:

Generate ${numSamplings} responses to the input prompt. Each response should be about ${targetWords} words.

First, sample ${numSamplesPerPrompt} responses.

Return responses in JSON format with key: "responses" (list of dicts). Each dict should include:
- text: response string (no explanations or additional text)
- confidence: normalized likelihood score between 0.0 and 1.0 indicating how representative or typical this response is compared to the full distribution

Provide ONLY the JSON object, no explanations or additional text.`,
        []
    );

    // Format prompt dengan parameter
    let formattedPrompt = `Input Prompt: "${inputPrompt}"`;

    const messageStore = new BaseMessageStore();
    let result = await samplingAgent.executeAgent(formattedPrompt, messageStore);
    console.log("Hasil Sampling Multi-Giliran:");
    console.log("=============================");

    try {
        // Fungsi untuk membersihkan hasil dari format markdown jika ada


        // Bersihkan hasil dari format markdown jika ada
        let cleanResult = cleanMarkdown(result);

        // Parsing hasil sebagai JSON
        let parsedResult = JSON.parse(cleanResult);


        formattedPrompt = `Hasilkan ${numSamplesPerPrompt} respons alternatif terhadap prompt masukan asli.`
        const nextTurnResult = await samplingAgent.executeAgent(formattedPrompt, messageStore);
        console.log("Hasil Sampling Multi-Giliran:");
        console.log("=============================");

        // Bersihkan hasil giliran berikutnya
        let cleanNextTurnResult = cleanMarkdown(nextTurnResult);

        const nextTurnParsedResult = JSON.parse(cleanNextTurnResult);

        // Gabungkan hasil dari kedua giliran dengan informasi sumber
        const combinedResponses = [
            ...parsedResult.responses.map((response: any) => ({ ...response, source: 'turn_1' })),
            ...nextTurnParsedResult.responses.map((response: any) => ({ ...response, source: 'turn_2' }))
        ];

        return {
            responses: combinedResponses
        };
    } catch (error) {
        console.error("Error parsing JSON result:", error);
        console.log("Raw result:", result);
        return { responses: [] };
    }
}

// Contoh penggunaan
async function main() {
    console.log("Contoh Prompt Sampling Verbal Multi-Giliran dengan LLM");
    console.log("=====================================================");

    // Contoh prompt sampling verbal multi-giliran
    const inputPrompt = "Persahabatan bagai kepompong.";
    const numSamplings = 3;
    const targetWords = 50;
    const numSamplesPerPrompt = 2;

    console.log(`Input Prompt: ${inputPrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWords}`);
    console.log(`Jumlah Sampel Per Prompt: ${numSamplesPerPrompt}`);
    console.log("\nSedang menghasilkan respons multi-giliran...\n");

    try {
        const result = await runVerbalPromptSamplingMultiTurn(inputPrompt, numSamplings, targetWords, numSamplesPerPrompt);


        if (result.responses && Array.isArray(result.responses)) {
            result.responses.forEach((response: any, index: number) => {
                const sourceLabel = response.source === 'turn_1' ? 'Giliran 1' : response.source === 'turn_2' ? 'Giliran 2' : 'Tidak diketahui';
                console.log(`\nRespons ${index + 1} (${sourceLabel}, Confidence: ${(response.confidence || 0).toFixed(2)}):`);
                console.log(response.text || response);
            });
        } else {
            console.log("Tidak ada respons yang dihasilkan atau format tidak valid.");
        }
    } catch (error) {
        console.error("Error saat menjalankan sampling multi-giliran:", error);
    }
}

// Jalankan contoh jika file ini dijalankan langsung
if (require.main === module) {
    main().catch(console.error);
}

export { runVerbalPromptSamplingMultiTurn };